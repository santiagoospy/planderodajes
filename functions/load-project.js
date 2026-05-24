import { getDatabase } from "@netlify/database";

export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("id");

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Project ID required" }),
        { status: 400 }
      );
    }

    const db = getDatabase();

    const result = await db.sql`
      SELECT id, productora_id, name, data, created_at, updated_at
      FROM projects
      WHERE id = ${projectId}
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404 }
      );
    }

    const project = result[0];
    return new Response(
      JSON.stringify({
        ...project,
        data: typeof project.data === "string" ? JSON.parse(project.data) : project.data
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error loading project:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};