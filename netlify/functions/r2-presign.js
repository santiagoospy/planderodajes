import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = "b55ca17d3e570f6641f664f1fdc1fc58";
const BUCKET     = "planderodajes";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const config = { path: "/.netlify/functions/r2-presign" };

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")   return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { action, fileName, fileType, fileSize, key: existingKey } = await req.json();

    // ── Generar URL de SUBIDA (PUT presigned) ──────────────────
    if (action === "upload") {
      if (!fileName || !fileType) {
        return new Response(JSON.stringify({ error: "fileName y fileType requeridos" }), { status: 400, headers: CORS });
      }
      const safeKey = `${Date.now()}_${Math.random().toString(36).slice(2)}_${fileName.replace(/[^\w.\-]/g, "_")}`;
      const cmd = new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         safeKey,
        ContentType: fileType,
      });
      // URL de upload válida 15 minutos
      const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 });
      // URL permanente de servicio (pasa por r2-serve que genera presigned GET)
      const serveUrl  = `/.netlify/functions/r2-serve?key=${encodeURIComponent(safeKey)}`;
      return new Response(JSON.stringify({ ok: true, uploadUrl, key: safeKey, serveUrl }), { headers: CORS });
    }

    // ── Generar URL de DESCARGA (GET presigned) ────────────────
    if (action === "download") {
      if (!existingKey) {
        return new Response(JSON.stringify({ error: "key requerida" }), { status: 400, headers: CORS });
      }
      const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: existingKey });
      // URL válida 7 días (máximo de R2)
      const downloadUrl = await getSignedUrl(s3, cmd, { expiresIn: 604800 });
      return new Response(JSON.stringify({ ok: true, downloadUrl }), { headers: CORS });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), { status: 400, headers: CORS });

  } catch (err) {
    console.error("[r2-presign] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
