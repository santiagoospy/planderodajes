import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const url = new URL(req.url);

    // ── POST ─────────────────────────────────────────────────────
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch (e) {
        console.error("Invalid JSON body:", e.message);
        return new Response(JSON.stringify({ error: "Invalid JSON in body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const storeName = body.store;
      const itemKey   = body.key;
      const data      = body.data;

      if (!storeName) return new Response(JSON.stringify({ error: "Missing store" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
      if (!itemKey) return new Response(JSON.stringify({ error: "Missing key" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });

      try {
        const store = getStore(storeName);

        if (body.delete) {
          await store.delete(itemKey);
          return Response.json({ ok: true });
        }

        if (!data) {
          return new Response(JSON.stringify({ error: "Missing data in body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Validar que sea serializable
        try {
          JSON.stringify(data);
        } catch (e) {
          console.error("Data not JSON serializable:", e.message);
          return new Response(JSON.stringify({ error: "Data is not JSON serializable" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Validar tamaño (máximo 1MB por item)
        const dataSize = JSON.stringify(data).length;
        if (dataSize > 1024 * 1024) {
          console.warn(`Data too large: ${dataSize} bytes for key ${itemKey}`);
          return new Response(JSON.stringify({ error: `Data too large (${Math.round(dataSize / 1024)}KB), max 1MB` }), {
            status: 413,
            headers: { "Content-Type": "application/json" }
          });
        }

        await store.setJSON(itemKey, data);
        return Response.json({ ok: true, stored: itemKey });

      } catch (storeErr) {
        console.error(`Blob store error (${storeName}/${itemKey}):`, storeErr.message);
        return new Response(JSON.stringify({ 
          error: "Failed to store data",
          details: storeErr.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ── GET ──────────────────────────────────────────────────────
    if (req.method === "GET") {
      const storeName = url.searchParams.get("store");
      const key       = url.searchParams.get("key");
      const isList    = url.searchParams.get("list") === "true";

      if (!storeName) return new Response(JSON.stringify({ error: "Missing store param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });

      try {
        const store = getStore(storeName);

        if (isList) {
          try {
            const { blobs } = await store.list();
            const items = await Promise.all(
              blobs.map(async ({ key: k }) => {
                try { 
                  const val = await store.get(k, { type: "json" });
                  return val !== null ? val : null;
                } catch (e) { 
                  console.warn(`Failed to read blob ${k}:`, e.message);
                  return null;
                }
              })
            );
            return Response.json({ items: items.filter(Boolean) });
          } catch (listErr) {
            console.error("Failed to list blobs:", listErr.message);
            return new Response(JSON.stringify({ error: "Failed to list data" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }
        }

        if (!key) return new Response(JSON.stringify({ error: "Missing key param" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });

        try {
          const val = await store.get(key, { type: "json" });
          if (val === null) {
            return new Response(JSON.stringify({ error: "Not found" }), { 
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          return Response.json(val);
        } catch (getErr) {
          console.error(`Failed to get blob ${key}:`, getErr.message);
          return new Response(JSON.stringify({ error: "Not found" }), { 
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

      } catch (storeErr) {
        console.error(`Blob store error (${storeName}):`, storeErr.message);
        return new Response(JSON.stringify({ error: "Store access failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Unhandled error in data function:", err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
