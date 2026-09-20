const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

async function sb(path, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!r.ok) {
    throw new Error(data?.message || data?.hint || text || "Supabase request failed");
  }

  return data;
}

async function currentUser(request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: authorization,
    },
  });

  if (!r.ok) return null;
  return r.json();
}

async function isAdmin(request) {
  const user = await currentUser(request);
  return user && user.app_metadata?.role === "admin";
}

export default async (request) => {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const q = Object.fromEntries(url.searchParams.entries());

    if (method === "GET") {
      if (q.categories === "1") {
        return json(200, await sb("categories?select=*&order=name.asc"));
      }

      let path =
        "articles?select=id,title,slug,excerpt,content,category,tags,status,cover_image,published_at,updated_at,created_at&order=published_at.desc.nullslast";

      if (q.slug) {
        path += `&slug=eq.${encodeURIComponent(q.slug)}`;
      } else if (q.search) {
        const s = encodeURIComponent(`*${q.search}*`);
        path += `&or=(title.ilike.${s},excerpt.ilike.${s},content.ilike.${s})`;
      }

      if (q.category) {
        path += `&category=eq.${encodeURIComponent(q.category)}`;
      }

      if (q.admin === "1") {
        if (!(await isAdmin(request))) {
          return json(401, { error: "Admin authentication required" });
        }
        path = "articles?select=*&order=updated_at.desc";
      } else {
        path += "&status=eq.published";
      }

      path += `&limit=${Math.min(Number(q.limit) || 24, 100)}`;
      return json(200, await sb(path));
    }

    if (method === "POST" || method === "PUT" || method === "DELETE") {
      if (!(await isAdmin(request))) {
        return json(401, { error: "Admin role required" });
      }

      if (method === "DELETE") {
        if (!q.id) return json(400, { error: "Missing id" });
        await sb(`articles?id=eq.${encodeURIComponent(q.id)}`, {
          method: "DELETE",
        });
        return json(200, { ok: true });
      }

      const body = await request.json();
      const status = body.status === "published" ? "published" : "draft";

      const clean = {
        title: String(body.title || "").trim(),
        slug: String(body.slug || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, ""),
        excerpt: String(body.excerpt || "").trim(),
        content: String(body.content || ""),
        category: String(body.category || "").trim(),
        tags: Array.isArray(body.tags)
          ? body.tags.map(String)
          : String(body.tags || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
        status,
        published: status === "published",
        published_at:
          status === "published"
            ? body.published_at || new Date().toISOString()
            : null,
      };

      if (!clean.title || !clean.slug || !clean.content || !clean.category) {
        return json(400, {
          error: "Title, slug, category and content are required",
        });
      }

      if (method === "POST") {
        const data = await sb("articles", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(clean),
        });
        return json(201, data[0]);
      }

      const id = q.id || body.id;
      if (!id) return json(400, { error: "Missing id" });

      const data = await sb(`articles?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(clean),
      });

      return json(200, data[0]);
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(500, { error: error?.message || "Internal server error" });
  }
};

export const config = {
  path: "/api/*",
};
