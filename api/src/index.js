// GPsaver API: buzón de pagos del wallet.
// El atajo del móvil deja aquí el importe de cada pago y la app lo recoge al abrirse.
//   POST /g/:clave            {importe, nota?}  (o ?importe=&nota=)  -> guarda un pago pendiente
//   GET  /p/:clave                                                  -> pagos pendientes
//   POST /ack/:clave          {ids: [...]}                          -> borra los ya recogidos
// La clave la genera cada móvil al azar; quien no la tenga no puede leer ni escribir en su buzón.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const MAX_PENDIENTES = 500;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

// "12,50 €" / "€12.50" / "1.234,56" -> 12.5 / 1234.56 (misma lógica que la app)
function parseImporte(raw) {
  let s = String(raw ?? '').replace(/[^\d.,-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const n = Math.abs(parseFloat(s));
  return isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

async function leerCuerpo(req) {
  const tipo = req.headers.get('Content-Type') || '';
  try {
    if (tipo.includes('application/json')) return await req.json();
    if (tipo.includes('form')) return Object.fromEntries(await req.formData());
    const t = await req.text();
    return t ? { importe: t } : {};
  } catch { return {}; }
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    const [, ruta, clave] = url.pathname.split('/');
    if (!/^[A-Za-z0-9]{24,64}$/.test(clave || '')) return json({ error: 'clave no válida' }, 400);

    if (ruta === 'g' && req.method === 'POST') {
      const body = await leerCuerpo(req);
      const importe = parseImporte(body.importe ?? body.amount ?? url.searchParams.get('importe'));
      if (!(importe > 0 && importe < 100000)) return json({ error: 'importe no válido' }, 400);
      const nota = String(body.nota ?? url.searchParams.get('nota') ?? '').slice(0, 80);
      const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM pendientes WHERE clave = ?').bind(clave).first();
      if (n >= MAX_PENDIENTES) return json({ error: 'demasiados pagos pendientes' }, 429);
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO pendientes (id, clave, importe, nota, ts) VALUES (?, ?, ?, ?, ?)')
        .bind(id, clave, importe, nota, Date.now()).run();
      return json({ ok: true, importe });
    }

    if (ruta === 'p' && req.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, importe, nota, ts FROM pendientes WHERE clave = ? ORDER BY ts')
        .bind(clave).all();
      return json({ pagos: results });
    }

    if (ruta === 'ack' && req.method === 'POST') {
      const body = await leerCuerpo(req);
      const ids = Array.isArray(body.ids) ? body.ids.slice(0, MAX_PENDIENTES).map(String) : [];
      if (ids.length) {
        await env.DB.batch(ids.map(id => env.DB.prepare('DELETE FROM pendientes WHERE clave = ? AND id = ?').bind(clave, id)));
      }
      return json({ ok: true, borrados: ids.length });
    }

    return json({ error: 'no encontrado' }, 404);
  },
};
