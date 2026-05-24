import { getDatabase } from "@netlify/database";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { id, productora_id, name, data } = await req.json();

    if (!id || !name || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Guardar o actualizar proyecto
    await db.sql`
      INSERT INTO projects (id, productora_id, name, data, updated_at)
      VALUES (${id}, ${productora_id || null}, ${name}, ${JSON.stringify(data)}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        productora_id = EXCLUDED.productora_id,
        name = EXCLUDED.name,
        data = EXCLUDED.data,
        updated_at = NOW()
    `;

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving project:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};