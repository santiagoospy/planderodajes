import { getStore } from "@netlify/blobs";
import { getUser, isAdmin } from "./_supabase.js";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Endpoint legacy sin modelo de membresía: restringido a admin.
  const user = await getUser(req);
  if (!user || !isAdmin(user)) {
    return new Response(JSON.stringify({ error: "Solo admin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("id");

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Project ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const store = getStore("projects");
    const project = await store.get(projectId, { type: "json" });

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(project),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error loading:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
