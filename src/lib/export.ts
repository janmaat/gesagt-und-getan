import { versprechen, parteien } from './daten';
import { STATUS_LABEL, THEMA_LABEL, GRUND_LABEL } from './begriffe';

/** Öffentliche Daten: niederländische Schlüssel wie bei Beloftewijzer, dazu deutsche Bezeichnungen. */
export async function exportDaten() {
  const ps = await parteien();
  const name = new Map(ps.map((p) => [p.id, p.data.naam]));
  const vs = await versprechen();
  return {
    exportdatum: new Date().toISOString().slice(0, 10),
    bron: 'Gesagt und getan? (gesagtundgetan.de)',
    licentie: {
      naam: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/deed.de',
      uitleg: 'Eigene Texte und Daten. Zitate aus Wahlprogrammen und dem Koalitionsvertrag bleiben Werke ihrer Urheber.',
    },
    versprechen: vs.map((v) => {
      const { partij, ...rest } = v.data;
      return {
        id: v.id,
        url: `https://gesagtundgetan.de/versprechen/${v.id}/`,
        partij: name.get(partij.id),
        partijId: partij.id,
        ...rest,
        statusLabel: STATUS_LABEL[v.data.status],
        themaLabel: THEMA_LABEL[v.data.thema],
        redenLabel: v.data.waaromAnders ? GRUND_LABEL[v.data.waaromAnders.reden] : null,
      };
    }),
  };
}
