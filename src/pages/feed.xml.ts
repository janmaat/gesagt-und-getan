import type { APIRoute } from 'astro';
import { versprechen } from '../lib/daten';
import { STATUS_LABEL } from '../lib/begriffe';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** RSS-Feed: neue und geänderte Bewertungen. Kein Tracking, keine Weiterleitung. */
export const GET: APIRoute = async ({ site }) => {
  const vs = (await versprechen()).sort((a, b) => b.data.bijgewerkt.localeCompare(a.data.bijgewerkt)).slice(0, 50);
  const items = vs.map((v) => {
    const url = new URL(`/versprechen/${v.id}/`, site).href;
    return `<item><title>${esc(`${v.data.titel}: ${STATUS_LABEL[v.data.status]}`)}</title><link>${url}</link><guid isPermaLink="false">${v.id}-${v.data.bijgewerkt}</guid><pubDate>${new Date(v.data.bijgewerkt).toUTCString()}</pubDate><description>${esc(v.data.samenvatting)}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Gesagt und getan?</title><link>${site}</link><description>Neue und geänderte Bewertungen von Wahlversprechen</description><language>de-de</language>${items.join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
