import { getStore } from "@netlify/blobs";
import { requireApiKey } from "./_utils.js";

export const config = { path: "/.netlify/functions/upload" };

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, X-API-Key, X-File-Name, X-File-Type, X-Chunk-Index, X-Total-Chunks, X-File-Id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: HEADERS });

  const authErr = requireApiKey(req);
  if (authErr) return authErr;

  try {
    const fileName    = req.headers.get("X-File-Name") || "file";
    const fileType    = req.headers.get("X-File-Type")  || "application/octet-stream";
    const chunkIndex  = parseInt(req.headers.get("X-Chunk-Index")   ?? "-1");
    const totalChunks = parseInt(req.headers.get("X-Total-Chunks")  ?? "-1");
    const fileId      = req.headers.get("X-File-Id") || `${Date.now()}_${fileName}`;

    const store = getStore("uploads");

    // ── Archivo pequeño (un solo POST, sin chunking) ────────────
    if (chunkIndex === -1 || totalChunks <= 1) {
      const buffer = await req.arrayBuffer();
      if (buffer.byteLength > 100 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "Archivo demasiado grande. Máx 100MB. Usá chunking." }),
          { status: 413, headers: HEADERS }
        );
      }
      const key = `files/${fileId}`;
      await store.set(key, buffer, { metadata: { fileName, fileType, uploadedAt: Date.now() } });
      const url = `/.netlify/functions/serve?key=${encodeURIComponent(key)}`;
      return new Response(JSON.stringify({ ok: true, assembled: true, url, fileId }), { headers: HEADERS });
    }

    // ── Chunk parcial ──────────────────────────────────────────
    const buffer = await req.arrayBuffer();
    const chunkKey = `chunks/${fileId}/chunk_${String(chunkIndex).padStart(6, "0")}`;
    await store.set(chunkKey, buffer);

    // ── ¿Llegaron todos los chunks? ────────────────────────────
    const { blobs } = await store.list({ prefix: `chunks/${fileId}/` });

    if (blobs.length < totalChunks) {
      // Todavía faltan chunks
      return new Response(
        JSON.stringify({ ok: true, assembled: false, received: blobs.length, total: totalChunks }),
        { headers: HEADERS }
      );
    }

    // ── Ensamblar: ordenar chunks y concatenar ─────────────────
    const sortedKeys = blobs
      .map((b) => b.key)
      .sort(); // chunk_000000, chunk_000001, …

    const parts = [];
    for (const key of sortedKeys) {
      const part = await store.get(key, { type: "arrayBuffer" });
      parts.push(new Uint8Array(part));
    }

    // Calcular tamaño total y concatenar
    const totalSize = parts.reduce((acc, p) => acc + p.byteLength, 0);
    const assembled = new Uint8Array(totalSize);
    let offset = 0;
    for (const part of parts) {
      assembled.set(part, offset);
      offset += part.byteLength;
    }

    // Guardar archivo final
    const finalKey = `files/${fileId}`;
    await store.set(finalKey, assembled.buffer, {
      metadata: { fileName, fileType, uploadedAt: Date.now(), size: totalSize },
    });

    // Limpiar chunks temporales
    await Promise.all(sortedKeys.map((k) => store.delete(k)));

    const url = `/.netlify/functions/serve?key=${encodeURIComponent(finalKey)}`;
    return new Response(
      JSON.stringify({ ok: true, assembled: true, url, fileId, size: totalSize }),
      { headers: HEADERS }
    );
  } catch (err) {
    console.error("upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: HEADERS });
  }
};
