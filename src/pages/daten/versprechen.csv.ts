import type { APIRoute } from 'astro';
import { exportDaten } from '../../lib/export';

const SPALTEN = ['id', 'url', 'partij', 'partijId', 'thema', 'themaLabel', 'status', 'statusLabel', 'titel', 'citaat', 'criterium', 'kern', 'bijgewerkt', 'bronnen'] as const;

function zelle(w: unknown): string {
  const s = typeof w === 'string' ? w : JSON.stringify(w ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = async () => {
  const { versprechen } = await exportDaten();
  const zeilen = [SPALTEN.join(';'), ...versprechen.map((v) => SPALTEN.map((k) => zelle((v as Record<string, unknown>)[k])).join(';'))];
  // Semikolon als Trennzeichen, damit die Datei in deutschem Excel richtig öffnet. BOM für Umlaute.
  return new Response('﻿' + zeilen.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
};
