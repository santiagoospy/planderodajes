import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const url = new URL(req.url);

    // ── POST ─────────────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      // El frontend manda store, key y data en el body
      const storeName = body.store;
      const itemKey   = body.key;

      if (!storeName) return new Response("Missing store in body", { status: 400 });
      if (!itemKey)   return new Response("Missing key in body",   { status: 400 });

      const store = getStore(storeName);

      if (body.delete) {
        await store.delete(itemKey);
        return Response.json({ ok: true });
      }

      await store.setJSON(itemKey, body.data);
      return Response.json({ ok: true });
    }

    // ── GET ──────────────────────────────────────────────────────
    if (req.method === "GET") {
      const storeName = url.searchParams.get("store");
      const key       = url.searchParams.get("key");
      const isList    = url.searchParams.get("list") === "true";

      if (!storeName) return new Response("Missing store", { status: 400 });

      const store = getStore(storeName);

      if (isList) {
        const { blobs } = await store.list();
        const items = await Promise.all(
          blobs.map(async ({ key: k }) => {
            try { return await store.get(k, { type: "json" }); }
            catch { return null; }
          })
        );
        return Response.json({ items: items.filter(Boolean) });
      }

      if (!key) return new Response("Missing key", { status: 400 });
      try {
        const val = await store.get(key, { type: "json" });
        if (val === null) return new Response("Not found", { status: 404 });
        return Response.json(val);
      } catch {
        return new Response("Not found", { status: 404 });
      }
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (err) {
    console.error("data function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};