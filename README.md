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
npm run daten           # haalt open data op naar src/data/ (Abgeordnete, stemmingen, agenda, DIP, BGBl)
npm run sprache         # taalcontrole van de gebouwde site met LanguageTool (na een build)
```

## Open data (src/data/)

| Bestand | Bron | Licentie / voorwaarden |
|---|---|---|
| `abgeordnete.json` | Sitzverteilung bundestag.de | bronvermelding |
| `abstimmungen.json` | abgeordnetenwatch.de API v2 (namentliche Abstimmungen, stemmen per fractie) | CC0 1.0 |
| `tagesordnung.json` | bundestag.de `conferenceWeekJSON` (niet gedocumenteerd, kan veranderen) | bronvermelding |
| `dip.json` | DIP-API: verloop van wetten bij beloftes met een `dip`-nummer | gebruik toegestaan met bronvermelding |
| `bgbl.json` | RSS van recht.bund.de (laatste 100 publicaties) | amtliche Werke |

De workflow `.github/workflows/daten.yml` ververst deze bestanden elke maandag. Hij verandert nooit een
beoordeling: statussen past alleen een mens aan. De DIP-sleutel is de openbare sleutel van de Bundestag
(geldig tot eind mei 2027); zet een nieuwe in de omgevingsvariabele `DIP_API_KEY`.

## Taalcontrole

`npm run sprache` stuurt de tekst van alle eigen pagina's naar de openbare LanguageTool-API
(max. 20 verzoeken per minuut; duurt een paar minuten) en schrijft `sprache-bericht.json`.
Woorden die goed zijn maar die LanguageTool niet kent: `scripts/sprache-woerter.txt`.
Pagina's met teksten van derden (titels van stemmingen, agenda) worden overgeslagen.
LanguageTool vindt spelling en grammatica, geen stijl of toon: laat de teksten ook door een moedertaalspreker lezen.

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
- Per partij staat in `src/content/kernkandidaten/` de uitkomst van de kernregel uit het onderzoek (citaat + pagina). Alleen zichtbaar in de voorbeeldbuild, als werklijst.
- Gebouwd uit fase 2: Abstimmungen, Abgeordnete, Diese Woche im Bundestag, Aktuell, Regierung Merz, Sagen und Abstimmen, Einfach erklärt, DIP-verloop op beloftepagina's, insluiten, RSS-feed (`/feed.xml`).
- Nog niet: Stimmt das? (factchecks), Positionen erklärt, Nach Bundesland, Steckbrief, Rechner, Quiz.

## Licentie

Eigen teksten en data: CC BY 4.0. Citaten uit verkiezingsprogramma's en het Koalitionsvertrag blijven van de makers.
