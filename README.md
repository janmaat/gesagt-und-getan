# Gesagt und getan?

Duitse tegenhanger van [Beloftewijzer](https://beloftewijzer.nl/): een onafhankelijke, statische site die
verkiezingsbeloftes van alle partijen in de Bundestag volgt in de keten
**Wahlprogramm → Koalitionsvertrag → Umsetzung**, altijd met primaire bron.

Opzet en keuzes: zie het onderzoeksrapport (`rapport-duitse-beloftewijzer.md`, buiten deze repository).
Dit is **fase 1** uit dat rapport.

## Techniek

- [Astro](https://astro.build/) 5 (statisch), TypeScript
- Data als YAML in `src/content/`, gevalideerd met Zod (`src/content.config.ts`)
- Zoeken met [Pagefind](https://pagefind.app/), volledig in de browser
- Geen database, geen cookies, geen trackers, geen scripts of lettertypen van derden

## Aan de slag

```bash
npm install
npm run vorschau        # ontwikkelserver mét beloftes in onderzoek
npm run build           # live-build: alleen beoordeelde én vrijgegeven beloftes
npm run pruefen         # controleert dist/ op cookies, trackers, externe scripts
npm run pruefen:live    # idem, en faalt bij lege Impressum-velden of een voorbeeldbuild
```

## Regels die de code afdwingt

| Regel | Waar |
|---|---|
| Elke belofte heeft een letterlijk citaat, pagina, criterium en het programma als bron | Zod-schema |
| Een status (anders dan `onderzoek`) heeft minstens één primaire bron over de uitvoering | Zod-schema (`superRefine`) |
| Niets gaat live zonder controle door een mens | Veld `freigabe` verplicht bij een status; zonder `freigabe` of met `onderzoek` niet in de live-build (`src/lib/daten.ts`) |
| `onderzoek` heeft een `statusVoorstel`; alleen zichtbaar in de voorbeeldbuild | Zod-schema, `PUBLIC_VORSCHAU=1` |
| Partijen in volgorde van zetels bij de laatste verkiezing | `zetelsVerkiezing` in `src/content/parteien/` |
| Geen score of ranglijst, alleen "x von n" met link | pagina's |
| Geen cookies, trackers, externe scripts of iframes | `scripts/pruefe-dist.mjs` (ook in CI) |

## Datamodel

De sleutels zijn **Nederlands**, gelijk aan Beloftewijzer (`status`, `citaat`, `criterium`,
`akkoord`, `waaromAnders`, `bronnen` …), zodat beide sites later één schema kunnen delen.
Duitse labels staan in `src/lib/begriffe.ts`; de open-data-export (`/daten/`) zet ze er naast.

Duitse uitbreidingen:
- reden `bundesrat` (in plaats van `eerste-kamer`) en `laender`;
- brontypen zoals `drucksache`, `plenarprotokoll`, `bgbl`, `destatis`;
- `stemmingen.wijze` (`namentlich` / `handzeichen`) en `orgaan`;
- `akkoord.zeile` (regelnummer in het Koalitionsvertrag), `ebene`, `dip`.

## Een belofte toevoegen

1. Maak `src/content/versprechen/<partei>-<onderwerp>.yaml` (kijk naar een bestaand bestand).
2. Begin met `status: onderzoek` en een `statusVoorstel`.
3. Na controle: zet de echte `status`, vul `freigabe: { door: ..., datum: ... }` in en verstuur het wederhoor (`reactie`).

## Stand

- De zes beloftes in `src/content/versprechen/` zijn **proefgevallen uit het onderzoek** (één per partij), allemaal `onderzoek`. Ze verschijnen alleen in de voorbeeldbuild.
- Impressum, Datenschutz, Über uns en Kontakt hebben lege velden: vul `src/lib/betreiber.ts` in en laat de teksten juridisch nakijken vóór livegang.
- Nog niet gebouwd (fase 2): DIP-signalen, Bundesgesetzblatt-RSS, namentliche Abstimmungen, agenda, Abgeordnete, „Sagen und Abstimmen“.

## Licentie

Eigen teksten en data: CC BY 4.0. Citaten uit verkiezingsprogramma's en het Koalitionsvertrag blijven van de makers.
