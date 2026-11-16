/**
 * Datenmodell von „Gesagt und getan?“.
 *
 * Die Schlüssel sind bewusst dieselben wie bei Beloftewijzer (niederländisch),
 * damit beide Seiten später ein Schema teilen können. Die deutschen Bezeichnungen
 * stehen in src/lib/begriffe.ts.
 */
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** YAML liest 2026-11-14 als Datum; wir speichern es als Text JJJJ-MM-TT. */
const isoDatum = z.preprocess(
  (w) => (w instanceof Date ? w.toISOString().slice(0, 10) : w),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO-Datum JJJJ-MM-TT erwartet'),
);

export const STATUS = [
  'nagekomen',
  'deels',
  'uitvoering',
  'vastgelopen',
  'gebroken',
  'geenakkoord',
] as const;
export const STATUS_MIT_PRUEFUNG = [...STATUS, 'onderzoek'] as const;

export const GRUENDE = [
  'formatie',
  'bundesrat',
  'rechter',
  'europa',
  'geld',
  'uitvoering',
  'laender',
  'onbekend',
] as const;

export const THEMEN = [
  'migratie',
  'overheidsfinancien',
  'wonen',
  'inkomen',
  'zorg',
  'onderwijs',
  'werk',
  'klimaat-energie',
  'economie',
  'veiligheid',
  'landbouw-natuur',
  'bereikbaarheid',
  'defensie',
  'bestuur',
  'europa',
] as const;

export const QUELLENARTEN = [
  'programma',
  'akkoord',
  'drucksache',
  'unterrichtung',
  'antrag',
  'aenderungsantrag',
  'plenarprotokoll',
  'stemming',
  'bundesrat',
  'bgbl',
  'banz',
  'begroting',
  'destatis',
  'institut',
  'normenkontrollrat',
  'bundesrechnungshof',
  'gericht',
  'eu',
  'wetenschap',
  'nieuws',
  'overig',
] as const;

/** Nur diese Quellenarten zählen als Primärquelle für einen Status. */
export const PRIMAERQUELLEN = new Set<string>([
  'programma',
  'akkoord',
  'drucksache',
  'unterrichtung',
  'antrag',
  'aenderungsantrag',
  'plenarprotokoll',
  'stemming',
  'bundesrat',
  'bgbl',
  'banz',
  'begroting',
  'destatis',
  'gericht',
  'eu',
]);

const parteien = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/parteien' }),
  schema: z.object({
    naam: z.string().min(1),
    kort: z.string().min(1),
    /** Reihenfolge = Sitze bei der letzten Bundestagswahl, groß nach klein. */
    zetelsVerkiezing: z.number().int().nonnegative(),
    zetelsNu: z.number().int().nonnegative(),
    fractie: z.boolean(),
    regering: z.boolean(),
    hinweis: z.string().optional(),
    programma: z.object({
      titel: z.string().min(1),
      jaar: z.number().int(),
      url: z.string().url(),
      paginas: z.number().int().positive(),
      beschlossen: z.string().optional(),
      paginaVerschuiving: z
        .number()
        .int()
        .describe('gedruckte Seite = PDF-Seite − Verschiebung'),
    }),
    reactieAdres: z.string().optional(),
  }),
});

const quelle = z.object({
  soort: z.enum(QUELLENARTEN),
  titel: z.string().min(1),
  url: z.string().url(),
  datum: z.union([isoDatum, z.literal('')]),
  geraadpleegd: isoDatum,
  bewijs: z.enum(['direct', 'indirect']).optional(),
  citaat: z.string().optional(),
});

const stemming = z.object({
  soort: z.enum(['antrag', 'aenderungsantrag', 'entschliessungsantrag', 'gesetz']),
  orgaan: z.enum(['bundestag', 'bundesrat']),
  wijze: z.enum(['namentlich', 'handzeichen']),
  titel: z.string().min(1),
  drucksache: z.string().optional(),
  datum: isoDatum,
  uitslag: z.enum(['aangenomen', 'verworpen']),
  voor: z.array(z.string()),
  tegen: z.array(z.string()),
  onthouding: z.array(z.string()).default([]),
  bron: z.string().url(),
  bronSeite: z.string().optional(),
  /** Stimmte die Partei, deren Versprechen es ist, so, wie sie es versprochen hat? */
  richting: z.enum(['voor', 'tegen', 'onduidelijk']),
  richtingUitleg: z.string().optional(),
});

const versprechen = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/versprechen' }),
  schema: z
    .object({
      partij: reference('parteien'),
      kabinet: z.literal('merz'),
      thema: z.enum(THEMEN),
      status: z.enum(STATUS_MIT_PRUEFUNG),
      /** Nur bei status „onderzoek“: Vorschlag, über den ein Mensch entscheidet. */
      statusVoorstel: z.enum(STATUS).optional(),
      titel: z.string().min(1),
      samenvatting: z.string().min(1),
      citaat: z.string().min(1),
      programma: z.object({
        pagina: z.union([z.number().int().positive(), z.string().min(1)]),
        pdfPagina: z.number().int().positive().optional(),
        hoofdstuk: z.string().min(1),
      }),
      criterium: z.string().min(1),
      akkoord: z.object({
        oordeel: z.enum(['ja', 'aangepast', 'nee']),
        citaat: z.string().optional(),
        zeile: z.string().optional(),
        pagina: z.union([z.number().int().positive(), z.string()]).optional(),
      }),
      waaromAnders: z
        .object({
          reden: z.enum(GRUENDE),
          zekerheid: z.enum(['bevestigd', 'aannemelijk', 'onbekend']).optional(),
          bron: z.string().min(1),
          url: z.string().url().optional(),
          toelichting: z.string().optional(),
        })
        .nullable()
        .default(null),
      toelichting: z.string().min(1),
      ebene: z.enum(['bund', 'laender', 'eu', 'gemischt']).default('bund'),
      regio: z.array(z.string()).default([]),
      kern: z.boolean(),
      kernReden: z.string().nullable().default(null),
      dip: z.string().optional(),
      verwachtBesluit: z
        .object({ moment: z.string(), datum: isoDatum.optional(), bron: z.string() })
        .nullable()
        .default(null),
      reactie: z
        .discriminatedUnion('soort', [
          z.object({
            soort: z.literal('reactie'),
            tekst: z.string().min(1),
            datum: isoDatum,
            afzender: z.string().min(1),
          }),
          z.object({ soort: z.literal('geen-reactie'), gevraagd: isoDatum }),
          z.object({ soort: z.literal('nog-niet-gevraagd') }),
        ])
        .default({ soort: 'nog-niet-gevraagd' }),
      begroting: z
        .object({ post: z.string(), bedrag: z.string().optional(), url: z.string().url() })
        .nullable()
        .default(null),
      stemmingen: z.array(stemming).default([]),
      bronnen: z.array(quelle).min(1),
      geschiedenis: z
        .array(
          z.object({
            datum: isoDatum,
            van: z.enum(STATUS_MIT_PRUEFUNG),
            naar: z.enum(STATUS_MIT_PRUEFUNG),
            bron: z.string(),
            toelichting: z.string().optional(),
          }),
        )
        .default([]),
      /** Menschliche Freigabe. Ohne Freigabe erscheint nichts auf der Live-Seite. */
      freigabe: z
        .object({ door: z.string().min(1), datum: isoDatum })
        .nullable()
        .default(null),
      bijgewerkt: isoDatum,
    })
    .superRefine((v, ctx) => {
      if (v.status === 'onderzoek' && !v.statusVoorstel) {
        ctx.addIssue({ code: 'custom', message: 'status „onderzoek“ braucht statusVoorstel' });
      }
      if (v.status !== 'onderzoek' && v.statusVoorstel) {
        ctx.addIssue({ code: 'custom', message: 'statusVoorstel nur bei status „onderzoek“' });
      }
      if (v.status !== 'onderzoek') {
        const primaer = v.bronnen.filter(
          (b) => PRIMAERQUELLEN.has(b.soort) && b.soort !== 'programma' && b.soort !== 'akkoord',
        );
        if (primaer.length === 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Jeder Status braucht mindestens eine Primärquelle zur Umsetzung',
          });
        }
        if (!v.freigabe) {
          ctx.addIssue({
            code: 'custom',
            message: 'Ein bewerteter Status braucht eine menschliche Freigabe (freigabe)',
          });
        }
      }
      if (!v.bronnen.some((b) => b.soort === 'programma')) {
        ctx.addIssue({ code: 'custom', message: 'Das Wahlprogramm muss als Quelle stehen' });
      }
    }),
});

const begriffe = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/begriffe' }),
  schema: z.object({
    begriff: z.string().min(1),
    erklaerung: z.string().min(1),
  }),
});

const korrekturen = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/korrekturen' }),
  schema: z.object({
    datum: isoDatum,
    seite: z.string().min(1),
    fehler: z.string().min(1),
    korrektur: z.string().min(1),
  }),
});

/**
 * Ergebnis der Kernregel pro Partei: die ersten zehn prüfbaren Versprechen aus Vorspann und
 * Kapitelanfängen. Arbeitsliste für die Redaktion; erscheint nur in der Vorschau.
 */
const kernkandidaten = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/kernkandidaten' }),
  schema: z.object({
    partij: reference('parteien'),
    gezaehlt: z.string().min(1),
    offen: z.string().optional(),
    kandidaten: z
      .array(
        z.object({
          nr: z.number().int().positive(),
          citaat: z.string().min(1),
          pagina: z.number().int().positive(),
          pdfPagina: z.number().int().positive().optional(),
          kapitel: z.string().min(1),
          zweifel: z.string().optional(),
          hinweis: z.string().optional(),
          versprechen: reference('versprechen').optional(),
        }),
      )
      .max(11),
  }),
});

export const collections = { parteien, versprechen, begriffe, korrekturen, kernkandidaten };
