// Holt offene Daten und legt sie als JSON in src/data/ ab. Die Seite bleibt statisch:
// Diese Dateien werden mit der Seite gebaut und versioniert. Aufruf: npm run daten
//
// Quellen:
//  - Abgeordnete: Sitzverteilung des Bundestags (bundestag.de, static/appdata/sitzplan/data.json)
//  - Namentliche Abstimmungen: abgeordnetenwatch.de API v2 (Lizenz CC0 1.0)
//  - Tagesordnung: bundestag.de (apps/plenar/plenar/conferenceWeekJSON, nicht dokumentiert)
//  - Gesetzgebungsverfahren: DIP-API des Bundestags (Nutzung mit Quellenangabe erlaubt)
//  - Bundesgesetzblatt: RSS-Feed von recht.bund.de
//
// Jede Quelle ist für sich: Fällt eine aus, bleibt die alte Datei stehen und das Skript meldet es.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const ZIEL = new URL('../src/data/', import.meta.url);
const HEUTE = new Date().toISOString().slice(0, 10);
// Öffentlicher API-Schlüssel des Bundestags, laut DIP-Hilfe gültig bis Ende Mai 2027.
// Neuer Schlüssel: https://dip.bundestag.de/über-dip/hilfe/api
const DIP_KEY = process.env.DIP_API_KEY ?? 'R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ';
const UA = { 'User-Agent': 'gesagtundgetan-datenabruf/0.1' };

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function holeJson(url, headers = {}) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { ...UA, ...headers } });
    if (res.status === 429) { await pause(30000); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`zu viele Anfragen: ${url}`);
}
async function speichern(name, daten) {
  await mkdir(ZIEL, { recursive: true });
  await writeFile(new URL(name, ZIEL), JSON.stringify(daten, null, 2) + '\n');
  console.log(`✓ ${name}`);
}
const nurTeil = process.argv.slice(2);
const soll = (teil) => nurTeil.length === 0 || nurTeil.includes(teil);
const fehler = [];
async function schritt(teil, fn) {
  if (!soll(teil)) return;
  try { await fn(); } catch (e) { fehler.push(`${teil}: ${e.message}`); console.error(`✗ ${teil}: ${e.message}`); }
}

// Fraktionsnamen der Quellen → Partei-IDs dieser Seite.
function parteiId(name = '') {
  const n = name.toLowerCase();
  if (n.includes('cdu') || n.includes('csu')) return 'cdu-csu';
  if (n.startsWith('afd')) return 'afd';
  if (n.startsWith('spd')) return 'spd';
  if (n.includes('grün')) return 'gruene';
  if (n.includes('linke')) return 'linke';
  if (n.includes('ssw')) return 'ssw';
  if (n.includes('fraktionslos')) return 'fraktionslos';
  return 'unbekannt';
}

// ---------- Abgeordnete ----------
await schritt('abgeordnete', async () => {
  const d = await holeJson('https://www.bundestag.de/static/appdata/sitzplan/data.json');
  const liste = Object.entries(d)
    .filter(([k, v]) => k !== '-1' && v && v.name)
    .map(([, v]) => ({
      id: v.id,
      name: v.name,
      sortname: v.lastnamefirst,
      fraktion: v.party,
      partei: parteiId(v.party),
      land: v.federalState,
      direkt: v.direct === 1,
      url: `https://www.bundestag.de${v.href}`,
    }))
    .sort((a, b) => a.sortname.localeCompare(b.sortname, 'de'));
  await speichern('abgeordnete.json', {
    stand: HEUTE,
    quelle: 'https://www.bundestag.de/parlament/plenum/sitzverteilung',
    anzahl: liste.length,
    abgeordnete: liste,
  });
});

// ---------- Namentliche Abstimmungen (abgeordnetenwatch, CC0) ----------
await schritt('abstimmungen', async () => {
  const alt = await readFile(new URL('abstimmungen.json', ZIEL), 'utf8').then(JSON.parse).catch(() => ({ abstimmungen: [] }));
  const bekannt = new Map(alt.abstimmungen.map((a) => [a.id, a]));
  const polls = [];
  for (let start = 0; ; start += 100) {
    const d = await holeJson(`https://www.abgeordnetenwatch.de/api/v2/polls?field_legislature=161&range_start=${start}&range_end=${start + 100}`);
    polls.push(...d.data);
    if (polls.length >= d.meta.result.total || d.data.length === 0) break;
    await pause(2100);
  }
  const ergebnis = [];
  for (const p of polls) {
    if (bekannt.has(p.id)) { ergebnis.push(bekannt.get(p.id)); continue; }
    await pause(2100); // höchstens 30 Anfragen pro Minute
    const v = await holeJson(`https://www.abgeordnetenwatch.de/api/v2/votes?poll=${p.id}&range_end=1000`);
    const proFraktion = {};
    for (const s of v.data) {
      const f = parteiId(s.fraction?.label);
      proFraktion[f] ??= { yes: 0, no: 0, abstain: 0, no_show: 0 };
      proFraktion[f][s.vote] = (proFraktion[f][s.vote] ?? 0) + 1;
    }
    const intro = (p.field_intro ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const drucksachen = [...new Set([...(p.field_intro ?? '').matchAll(/dserver\.bundestag\.de\/btd\/(\d+)\/\d+\/(\d+)\.pdf/g)]
      .map((m) => `${m[1]}/${Number(m[2].slice(String(m[1]).length))}`))];
    ergebnis.push({
      id: p.id,
      titel: p.label,
      datum: p.field_poll_date,
      angenommen: p.field_accepted,
      themen: (p.field_topics ?? []).map((t) => t.label),
      einleitung: intro,
      drucksachen,
      proFraktion,
      quelle: p.abgeordnetenwatch_url,
    });
  }
  ergebnis.sort((a, b) => b.datum.localeCompare(a.datum) || b.id - a.id);
  await speichern('abstimmungen.json', {
    stand: HEUTE,
    quelle: 'abgeordnetenwatch.de API v2',
    lizenz: 'CC0 1.0',
    anzahl: ergebnis.length,
    abstimmungen: ergebnis,
  });
});

// ---------- Tagesordnung ----------
await schritt('tagesordnung', async () => {
  const d = await holeJson('https://www.bundestag.de/apps/plenar/plenar/conferenceWeekJSON');
  const sitzungen = (d.conferences ?? []).map((c) => ({
    nummer: c.conferenceNumber,
    datum: c.conferenceDate?.date,
    punkte: (c.rows ?? []).map((r) => ({
      zeit: r.time,
      top: r.top,
      titel: (r.topic?.title ?? '').trim(),
      drucksachen: [...new Set([...(r.topic?.detail ?? '').matchAll(/Drucksache (\d+\/\d+)/g)].map((m) => m[1]))],
      status: r.status?.title ?? '',
    })),
  }));
  await speichern('tagesordnung.json', {
    stand: HEUTE,
    quelle: 'https://www.bundestag.de/parlament/plenum/tagesordnungen',
    sitzungen,
  });
});

// ---------- DIP: Verfahren zu Versprechen mit dip-Nummer ----------
await schritt('dip', async () => {
  const dir = new URL('../src/content/versprechen/', import.meta.url);
  const ids = new Set();
  for (const f of await readdir(dir)) {
    const m = (await readFile(new URL(f, dir), 'utf8')).match(/^dip:\s*"?(\d+)"?/m);
    if (m) ids.add(m[1]);
  }
  const vorgaenge = {};
  for (const id of ids) {
    const auth = { Authorization: `ApiKey ${DIP_KEY}` };
    const v = await holeJson(`https://search.dip.bundestag.de/api/v1/vorgang/${id}?format=json`, auth);
    const p = await holeJson(`https://search.dip.bundestag.de/api/v1/vorgangsposition?f.vorgang=${id}&format=json`, auth);
    vorgaenge[id] = {
      titel: v.titel,
      stand: v.beratungsstand,
      initiative: v.initiative ?? [],
      verkuendung: (v.verkuendung ?? []).map((x) => ({ datum: x.verkuendungsdatum, fundstelle: x.fundstelle, url: x.pdf_url ?? x.einleitungstext })),
      inkrafttreten: (v.inkrafttreten ?? []).map((x) => ({ datum: x.datum, erlaeuterung: x.erlaeuterung })),
      schritte: p.documents
        .map((x) => ({
          datum: x.datum,
          schritt: x.vorgangsposition,
          organ: x.zuordnung,
          dokument: x.fundstelle?.dokumentnummer ?? null,
          url: x.fundstelle?.pdf_url ?? null,
          beschluss: (x.beschlussfassung ?? []).map((b) => b.beschlusstenor).filter(Boolean),
        }))
        .sort((a, b) => a.datum.localeCompare(b.datum)),
      quelle: `https://dip.bundestag.de/vorgang/${id}`,
    };
    await pause(500);
  }
  await speichern('dip.json', { stand: HEUTE, quelle: 'DIP – Deutscher Bundestag/Bundesrat', vorgaenge });
});

// ---------- Bundesgesetzblatt ----------
await schritt('bgbl', async () => {
  const res = await fetch('https://www.recht.bund.de/rss/feeds/rss_bgbl-1-2.xml', { headers: UA });
  if (!res.ok) throw new Error(`${res.status}`);
  const xml = await res.text();
  const feld = (item, tag) => (item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) ?? [])[1]?.trim() ?? '';
  const eintraege = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
    titel: feld(m[1], 'title'),
    kurz: feld(m[1], 'meta:shortTitle'),
    typ: feld(m[1], 'meta:typ'),
    initiant: feld(m[1], 'meta:initiant'),
    fundstelle: feld(m[1], 'meta:fundstelle'),
    datum: feld(m[1], 'pubDate'),
    url: feld(m[1], 'link'),
  }));
  await speichern('bgbl.json', { stand: HEUTE, quelle: 'https://www.recht.bund.de/', eintraege: eintraege.slice(0, 100) });
});

if (fehler.length) {
  console.error(`\n${fehler.length} Quelle(n) nicht erreichbar; alte Dateien bleiben stehen.`);
  process.exitCode = 1;
}
