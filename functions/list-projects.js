import { getDatabase } from "@netlify/database";

export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const productoraId = url.searchParams.get("productora_id");

    const db = getDatabase();

    let query;
    if (productoraId) {
      query = await db.sql`
        SELECT id, productora_id, name, created_at, updated_at
        FROM projects
        WHERE productora_id = ${productoraId}
        ORDER BY updated_at DESC
      `;
    } else {
      query = await db.sql`
        SELECT id, productora_id, name, created_at, updated_at
        FROM projects
        ORDER BY updated_at DESC
      `;
    }

    return new Response(
      JSON.stringify({ projects: query }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing projects:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};