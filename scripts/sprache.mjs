// Sprachprüfung mit der öffentlichen LanguageTool-API (https://languagetool.org/http-api/).
// Prüft den sichtbaren Text in <main> aller gebauten Seiten. Kein Teil des normalen Builds:
// npm run build:vorschau && npm run sprache
// Grenzen der kostenlosen API: 20 Anfragen/Minute, 20 kB Text pro Anfrage.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const API = process.env.LANGUAGETOOL_URL ?? 'https://api.languagetool.org/v2/check';
const MAX = 15000;

// Fachwörter und Namen, die LanguageTool nicht kennt.
const ERLAUBT = new Set(
  (await readFile(new URL('./sprache-woerter.txt', import.meta.url), 'utf8'))
    .split('\n').map((w) => w.trim()).filter((w) => w && !w.startsWith('#')),
);
// Regeln, die bei uns nur Lärm machen.
const AUS = ['WHITESPACE_RULE', 'DE_CASE', 'UNPAIRED_BRACKETS', 'TYPOGRAFISCHE_ANFUEHRUNGSZEICHEN'];

async function* html(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== 'pagefind') yield* html(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

function text(seite) {
  const m = seite.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!m) return '';
  return m[1]
    .replace(/<(script|style|pre)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<\/(p|li|h[1-6]|dt|dd|td|th|blockquote|tr|option|label|span)>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .split('\n').map((z) => z.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function pruefe(t) {
  for (let versuch = 0; versuch < 3; versuch++) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: t, language: 'de-DE', disabledRules: AUS.join(',') }),
    });
    if (res.status === 429) { await pause(30000); continue; }
    if (!res.ok) throw new Error(`LanguageTool: HTTP ${res.status}`);
    return (await res.json()).matches;
  }
  throw new Error('LanguageTool: zu viele Anfragen');
}

// Gleiche Texte (Kopf, Fuß, wiederkehrende Sätze) nur einmal prüfen.
// Seiten mit Texten Dritter (Titel von Abstimmungen, Tagesordnung, Namen) nicht prüfen.
const FREMD = [/^\/abstimmungen\//, /^\/abgeordnete\//, /^\/diese-woche\//, /^\/aktuell\//, /^\/einbetten\//];
const gesehen = new Set();
const bericht = [];
let anfragen = 0;
for await (const datei of html(DIST)) {
  const seite = '/' + relative(DIST, datei).replace(/index\.html$/, '');
  if (FREMD.some((m) => m.test(seite))) continue;
  const zeilen = text(await readFile(datei, 'utf8')).split('\n').filter((z) => !gesehen.has(z));
  zeilen.forEach((z) => gesehen.add(z));
  let block = '';
  const bloecke = [];
  for (const z of zeilen) {
    if ((block + '\n' + z).length > MAX) { bloecke.push(block); block = ''; }
    block += (block ? '\n' : '') + z;
  }
  if (block) bloecke.push(block);
  for (const b of bloecke) {
    if (anfragen++) await pause(3500);
    for (const m of await pruefe(b)) {
      const wort = b.slice(m.offset, m.offset + m.length);
      if (ERLAUBT.has(wort)) continue;
      const kontext = m.context.text.slice(Math.max(0, m.context.offset - 30), m.context.offset + m.context.length + 30);
      bericht.push({ seite, regel: m.rule.id, meldung: m.message, wort, vorschlag: m.replacements.slice(0, 3).map((r) => r.value), kontext });
    }
  }
}

await writeFile(new URL('../sprache-bericht.json', import.meta.url), JSON.stringify(bericht, null, 2));
for (const b of bericht) console.log(`${b.seite} [${b.regel}] „${b.wort}“ → ${b.vorschlag.join(' | ') || '–'}\n    ${b.meldung}\n    …${b.kontext}…`);
console.log(`\n${anfragen} Anfragen, ${bericht.length} Hinweise. Details: sprache-bericht.json`);
