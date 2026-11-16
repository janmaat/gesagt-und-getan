/** Deutsche Bezeichnungen für die (niederländischen) Schlüssel im Datenmodell. */

export const STATUS_LABEL: Record<string, string> = {
  nagekomen: 'Umgesetzt',
  deels: 'Teilweise umgesetzt',
  uitvoering: 'In Arbeit',
  vastgelopen: 'Stockt',
  gebroken: 'Aufgegeben',
  geenakkoord: 'Nicht vereinbart',
  onderzoek: 'In Prüfung',
};

export const STATUS_ERKLAERUNG: Record<string, string> = {
  nagekomen: 'Die Maßnahme gilt oder das Ziel ist nachweislich erreicht.',
  deels: 'Es wurde etwas umgesetzt, aber weniger als im Wahlprogramm stand.',
  uitvoering: 'Ein Gesetzentwurf liegt vor oder Geld ist eingeplant. Das Ergebnis steht noch aus.',
  vastgelopen: 'Steht im Koalitionsvertrag, aber die Umsetzung ruht oder liegt weit zurück.',
  gebroken: 'Ein Beschluss wurde rückgängig gemacht oder das Ziel offiziell aufgegeben.',
  geenakkoord: 'Kam nicht in den Koalitionsvertrag und wurde auch nicht anders umgesetzt.',
  onderzoek: 'Wird noch geprüft. Noch keine Bewertung.',
};

/** Reihenfolge in Listen und Zählungen. */
export const STATUS_REIHENFOLGE = [
  'nagekomen',
  'deels',
  'uitvoering',
  'vastgelopen',
  'gebroken',
  'geenakkoord',
  'onderzoek',
] as const;

export const GRUND_LABEL: Record<string, string> = {
  formatie: 'Koalitionsvertrag',
  bundesrat: 'Bundesrat',
  rechter: 'Gericht',
  europa: 'EU-Recht',
  geld: 'Haushalt',
  uitvoering: 'Umsetzung',
  laender: 'Zuständigkeit der Länder',
  onbekend: 'Unbekannt',
};

export const AKKOORD_LABEL: Record<string, string> = {
  ja: 'Übernommen',
  aangepast: 'Geändert',
  nee: 'Nicht aufgenommen',
};

export const THEMA_LABEL: Record<string, string> = {
  migratie: 'Migration',
  overheidsfinancien: 'Staatsfinanzen und Steuern',
  wonen: 'Wohnen',
  inkomen: 'Einkommen und Rente',
  zorg: 'Gesundheit und Pflege',
  onderwijs: 'Bildung',
  werk: 'Arbeit',
  'klimaat-energie': 'Klima und Energie',
  economie: 'Wirtschaft',
  veiligheid: 'Sicherheit',
  'landbouw-natuur': 'Landwirtschaft und Natur',
  bereikbaarheid: 'Verkehr',
  defensie: 'Verteidigung',
  bestuur: 'Staat und Demokratie',
  europa: 'Europa',
};

export const QUELLE_LABEL: Record<string, string> = {
  programma: 'Wahlprogramm',
  akkoord: 'Koalitionsvertrag',
  drucksache: 'Bundestagsdrucksache',
  unterrichtung: 'Unterrichtung',
  antrag: 'Antrag',
  aenderungsantrag: 'Änderungsantrag',
  plenarprotokoll: 'Plenarprotokoll',
  stemming: 'Abstimmungsergebnis',
  bundesrat: 'Bundesrat',
  bgbl: 'Bundesgesetzblatt',
  banz: 'Bundesanzeiger',
  begroting: 'Bundeshaushalt',
  destatis: 'Destatis',
  institut: 'Institut',
  normenkontrollrat: 'Normenkontrollrat',
  bundesrechnungshof: 'Bundesrechnungshof',
  gericht: 'Gericht',
  eu: 'EU',
  wetenschap: 'Wissenschaft',
  nieuws: 'Nachrichten',
  overig: 'Sonstiges',
};

const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** 2026-11-14 → „14. November 2026“ */
export function datumLang(iso: string): string {
  if (!iso) return '';
  const [j, m, t] = iso.split('-').map(Number);
  return `${t}. ${MONATE[m - 1]} ${j}`;
}

/** 2026-11-14 → „14.11.2026“ */
export function datumKurz(iso: string): string {
  if (!iso) return '';
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

export function zahl(n: number): string {
  return new Intl.NumberFormat('de-DE').format(n);
}

/**
 * Setzt ein Zitat in deutsche Anführungszeichen. Anführungszeichen im Zitat werden zu einfachen:
 * „Wir schaffen die ‚Turboeinbürgerung‘ ab.“
 */
export function zitat(text: string): string {
  const innen = text.replace(/„/g, '‚').replace(/[“”]/g, '‘').replace(/"([^"]*)"/g, '‚$1‘');
  return `„${innen}“`;
}
