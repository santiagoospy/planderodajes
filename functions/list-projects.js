import { getStore } from "@netlify/blobs";
import { handleOptions } from "./_utils.js";
import { getUser, isAdmin, userProductoraIds } from "./_supabase.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEMO_PROJECT_ID = "proj_demo";

export default async (req) => {
  if (req.method === "OPTIONS") return handleOptions();
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
  }

  const user = await getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: CORS });

  try {
    const admin = isAdmin(user);
    const allowed = admin ? null : await userProductoraIds(user.id);

    const store = getStore("projects");
    const { blobs } = await store.list();

    const results = await Promise.allSettled(
      blobs.map(blob => store.get(blob.key, { type: "json" }).then(p => p ? { ...p, _blobKey: blob.key } : null))
    );

    const projects = results
      .filter(r => r.status === "fulfilled" && r.value !== null)
      .map(r => r.value)
      // Filtrar a las productoras del usuario (admin ve todo). El demo siempre visible.
      .filter(p => admin || p.id === DEMO_PROJECT_ID || p._blobKey === DEMO_PROJECT_ID || (p.productoraId && allowed.has(p.productoraId)));

    return new Response(JSON.stringify({ projects }), { status: 200, headers: CORS });
  } catch (err) {
    console.error("[list-projects] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
