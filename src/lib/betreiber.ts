/**
 * Angaben zum Betreiber für Impressum, Datenschutz und „Über uns“.
 * Bitte selbst ausfüllen. Solange ein Feld leer ist, zeigt die Seite einen Platzhalter,
 * und `npm run pruefen -- --live` schlägt fehl.
 */
export const BETREIBER = {
  name: '',
  /** Ladungsfähige Anschrift (Straße, PLZ Ort, Land). Ein Postfach reicht nicht. */
  anschrift: '',
  email: '',
  /** Niederländische KVK-Nummer, falls vorhanden. */
  kvk: '',
  /** USt-IdNr., falls vorhanden. */
  ustId: '',
  /** Hosting-Anbieter, für die Datenschutzerklärung. */
  hosting: '',
  seitJahr: '',
};

export const PLATZHALTER = '[noch einzutragen]';
export const feld = (wert: string) => wert || PLATZHALTER;
