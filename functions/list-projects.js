import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const store = getStore("projects");
    const { blobs } = await store.list();

    const projects = [];
    for (const blob of blobs) {
      const project = await store.get(blob.key, { type: "json" });
      if (project) {
        projects.push({ ...project, _blobKey: blob.key });
      }
    }

    return new Response(
      JSON.stringify({ projects }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
