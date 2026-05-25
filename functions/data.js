// functions/data.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const url = new URL(req.url);
  const storeName = url.searchParams.get("store");
  const key       = url.searchParams.get("key");
  const isList    = url.searchParams.get("list") === "true";

  if (!storeName) {
    return new Response("Missing store", { status: 400 });
  }

  const store = getStore({ name: storeName, consistency: "strong" });

  // GET
  if (req.method === "GET") {
    if (isList) {
      const { blobs } = await store.list();
      const items = await Promise.all(
        blobs.map(async ({ key }) => {
          const val = await store.get(key, { type: "json" });
          return val;
        })
      );
      return Response.json({ items: items.filter(Boolean) });
    }
    if (!key) return new Response("Missing key", { status: 400 });
    const val = await store.get(key, { type: "json" });
    if (!val) return new Response("Not found", { status: 404 });
    return Response.json(val);
  }

  // POST
  if (req.method === "POST") {
    const body = await req.json();
    if (body.delete) {
      await store.delete(body.key);
      return Response.json({ ok: true });
    }
    await store.set(body.key, JSON.stringify(body.data));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/data"   // ← Netlify lo expone en /.netlify/functions/data automáticamente
};
