// Prüft die gebaute Seite auf die festen Regeln: keine Skripte, Schriften oder Stile von Dritten,
// keine Cookies, keine Tracker. Mit --live zusätzlich: keine Platzhalter, keine Vorschau-Inhalte.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const live = process.argv.includes('--live');
const DIST = new URL('../dist/', import.meta.url).pathname;
const fehler = [];
const warnungen = [];

async function* dateien(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* dateien(p);
    else yield p;
  }
}

const VERBOTEN = [
  [/<script[^>]+src=["']https?:\/\//i, 'Skript von einem fremden Server'],
  [/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i, 'Stylesheet von einem fremden Server'],
  [/fonts\.(googleapis|gstatic)\.com/i, 'Google Fonts'],
  [/googletagmanager|google-analytics|gtag\(|doubleclick|adsbygoogle/i, 'Google-Tracking oder -Werbung'],
  [/document\.cookie/i, 'Zugriff auf Cookies'],
  [/<iframe/i, 'Eingebetteter fremder Inhalt (iframe)'],
];

let html = 0;
for await (const datei of dateien(DIST)) {
  if (!/\.(html|js)$/.test(datei) || datei.includes('/pagefind/')) continue;
  const text = await readFile(datei, 'utf8');
  if (datei.endsWith('.html')) html++;
  for (const [muster, grund] of VERBOTEN) if (muster.test(text)) fehler.push(`${datei}: ${grund}`);
  if (text.includes('[noch einzutragen]')) (live ? fehler : warnungen).push(`${datei}: Platzhalter im Impressum oder in den Betreiberangaben`);
  if (text.includes('class="vorschau"')) (live ? fehler : warnungen).push(`${datei}: Vorschau-Fassung (PUBLIC_VORSCHAU=1)`);
}

console.log(`${html} HTML-Seiten geprüft.`);
for (const w of [...new Set(warnungen)].slice(0, 20)) console.warn('Warnung:', w);
if (warnungen.length > 20) console.warn(`… und ${warnungen.length - 20} weitere Warnungen`);
if (fehler.length) {
  for (const f of fehler) console.error('Fehler:', f);
  process.exit(1);
}
console.log(live ? 'Bereit für die Veröffentlichung.' : 'Keine Verstöße gegen die Datenschutzregeln gefunden.');
