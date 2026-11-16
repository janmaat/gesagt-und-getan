/** Offene Daten aus src/data/ (geholt mit `npm run daten`). */
import abgeordneteJson from '../data/abgeordnete.json';
import abstimmungenJson from '../data/abstimmungen.json';
import tagesordnungJson from '../data/tagesordnung.json';
import dipJson from '../data/dip.json';
import bgblJson from '../data/bgbl.json';

export const abgeordnete = abgeordneteJson;
export const abstimmungen = abstimmungenJson;
export const tagesordnung = tagesordnungJson;
export const dip = dipJson as { stand: string; quelle: string; vorgaenge: Record<string, DipVorgang> };
export const bgbl = bgblJson;

export interface DipVorgang {
  titel: string;
  stand: string;
  initiative: string[];
  verkuendung: { datum: string; fundstelle: string; url: string }[];
  inkrafttreten: { datum: string; erlaeuterung?: string }[];
  schritte: { datum: string; schritt: string; organ: string; dokument: string | null; url: string | null; beschluss: string[] }[];
  quelle: string;
}

export type Stimmen = { yes?: number; no?: number; abstain?: number; no_show?: number };

/** Reihenfolge der Fraktionen in Tabellen: Sitze bei der Wahl 2025, dann fraktionslos. */
export const FRAKTIONEN = [
  { id: 'cdu-csu', name: 'CDU/CSU' },
  { id: 'afd', name: 'AfD' },
  { id: 'spd', name: 'SPD' },
  { id: 'gruene', name: 'Grüne' },
  { id: 'linke', name: 'Linke' },
  { id: 'fraktionslos', name: 'fraktionslos' },
] as const;

/** Mehrheitsposition einer Fraktion; „gemischt“, wenn keine Position mehr als die Hälfte der abgegebenen Stimmen hat. */
export function linie(s: Stimmen | undefined): 'ja' | 'nein' | 'enthaltung' | 'gemischt' | 'keine' {
  if (!s) return 'keine';
  const ja = s.yes ?? 0, nein = s.no ?? 0, ent = s.abstain ?? 0;
  const ab = ja + nein + ent;
  if (ab === 0) return 'keine';
  if (ja / ab > 0.5) return 'ja';
  if (nein / ab > 0.5) return 'nein';
  if (ent / ab > 0.5) return 'enthaltung';
  return 'gemischt';
}
export const LINIE_LABEL = { ja: 'Ja', nein: 'Nein', enthaltung: 'Enthaltung', gemischt: 'gemischt', keine: '–' } as const;

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** „24. November 2026“ → 2026-11-24 */
export function isoAusDeutsch(d: string): string {
  const m = d.match(/(\d+)\.\s+(\S+)\s+(\d{4})/);
  if (!m) return '';
  const mon = MONATE.indexOf(m[2]) + 1;
  return `${m[3]}-${String(mon).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
