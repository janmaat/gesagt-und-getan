import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Vorschau-Modus (PUBLIC_VORSCHAU=1) zeigt auch Versprechen „In Prüfung“.
 * Auf der Live-Seite erscheint nur, was bewertet und von einem Menschen freigegeben ist.
 */
export const VORSCHAU = import.meta.env.PUBLIC_VORSCHAU === '1';

export type Versprechen = CollectionEntry<'versprechen'>;
export type Partei = CollectionEntry<'parteien'>;

export function istSichtbar(v: Versprechen): boolean {
  if (VORSCHAU) return true;
  return v.data.status !== 'onderzoek' && v.data.freigabe !== null;
}

export async function parteien(): Promise<Partei[]> {
  const alle = await getCollection('parteien');
  return alle.sort(
    (a, b) => b.data.zetelsVerkiezing - a.data.zetelsVerkiezing || a.data.naam.localeCompare(b.data.naam),
  );
}

export async function versprechen(): Promise<Versprechen[]> {
  const ps = await parteien();
  const rang = new Map(ps.map((p, i) => [p.id, i]));
  const alle = (await getCollection('versprechen')).filter(istSichtbar);
  return alle.sort(
    (a, b) =>
      (rang.get(a.data.partij.id) ?? 99) - (rang.get(b.data.partij.id) ?? 99) ||
      Number(b.data.kern) - Number(a.data.kern) ||
      a.data.titel.localeCompare(b.data.titel, 'de'),
  );
}

export function zaehle(liste: Versprechen[]): Record<string, number> {
  const z: Record<string, number> = {};
  for (const v of liste) z[v.data.status] = (z[v.data.status] ?? 0) + 1;
  return z;
}
