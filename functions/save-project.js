import { getStore } from "@netlify/blobs";
import { getUser, isAdmin } from "./_supabase.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Endpoint legacy sin modelo de membresía: restringido a admin.
  const user = await getUser(req);
  if (!user || !isAdmin(user)) {
    return new Response(JSON.stringify({ error: "Solo admin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const store = getStore("projects");
    await store.setJSON(id, body);

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
