import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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

export const config = { path: "/.netlify/functions/r2-serve" };

export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) return new Response("Missing ?key=", { status: 400 });

  try {
    const cmd       = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    // Generar presigned GET URL válida 7 días
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 604800 });
    // Redirigir al browser directamente a R2 (sin proxy de datos por Netlify)
    return Response.redirect(signedUrl, 302);
  } catch (err) {
    console.error("[r2-serve] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
