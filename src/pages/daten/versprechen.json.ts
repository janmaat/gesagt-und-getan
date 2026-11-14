import type { APIRoute } from 'astro';
import { exportDaten } from '../../lib/export';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await exportDaten(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
