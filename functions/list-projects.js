import { getStore } from "@netlify/blobs";
import { requireApiKey, handleOptions } from "./_utils.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export default async (req) => {
  if (req.method === "OPTIONS") return handleOptions();
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
  }

  const authErr = requireApiKey(req);
  if (authErr) return authErr;

  try {
    const store = getStore("projects");
    const { blobs } = await store.list();

    // Parallel fetch — faster than sequential and avoids timeouts on large stores
    const results = await Promise.allSettled(
      blobs.map(blob => store.get(blob.key, { type: "json" }).then(p => p ? { ...p, _blobKey: blob.key } : null))
    );

    const projects = results
      .filter(r => r.status === "fulfilled" && r.value !== null)
      .map(r => r.value);

    return new Response(JSON.stringify({ projects }), { status: 200, headers: CORS });
  } catch (err) {
    console.error("[list-projects] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
