import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const storeName = url.searchParams.get("store") || "projects";
  const key = url.searchParams.get("key");
  const list = url.searchParams.get("list");

  const store = getStore(storeName);

  // GET: leer o listar
  if (req.method === "GET") {
    try {
      if (list === "true") {
        const { blobs } = await store.list();
        const items = [];
        for (const blob of blobs) {
          const item = await store.get(blob.key, { type: "json" });
          if (item) items.push(item);
        }
        return Response.json({ items });
      }

      if (!key) {
        return Response.json({ error: "key required" }, { status: 400 });
      }

      const data = await store.get(key, { type: "json" });
      if (!data) {
        return Response.json({ error: "not found" }, { status: 404 });
      }
      return Response.json(data);
    } catch (error) {
      console.error("GET error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // POST: guardar o borrar
  if (req.method === "POST") {
    try {
      const body = await req.json();

      if (body.delete && body.key) {
        await store.delete(body.key);
        return Response.json({ success: true, deleted: body.key });
      }

      if (!body.key || !body.data) {
        return Response.json({ error: "key and data required" }, { status: 400 });
      }

      await store.setJSON(body.key, body.data);
      return Response.json({ success: true, key: body.key });
    } catch (error) {
      console.error("POST error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
