import { getStore } from "@netlify/blobs";

export const config = { path: "/.netlify/functions/serve" };

export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  try {
    const store = getStore("uploads");
    const { data, metadata } = await store.getWithMetadata(key, { type: "arrayBuffer" });

    if (!data) {
      return new Response("File not found", { status: 404 });
    }

    const contentType = metadata?.fileType || "application/octet-stream";
    const fileName    = metadata?.fileName || key.split("/").pop();

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("serve error:", err);
    return new Response("Error al obtener el archivo", { status: 500 });
  }
};
