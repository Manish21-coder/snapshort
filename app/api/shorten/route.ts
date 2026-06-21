import { connectDB } from "@/lib/db";
import Link from "@/lib/models/Link";
import { auth } from "@clerk/nextjs/server";
import { getUserDomain } from "@/lib/domainMap";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: Request) {
  console.log("[shorten] POST received");

  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: { originalUrl?: string; prefix?: string; alias?: string; folder?: string };
  try {
    body = await req.json();
    console.log("[shorten] body parsed:", JSON.stringify(body));
  } catch (e) {
    console.error("[shorten] Failed to parse JSON body:", e);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { originalUrl, prefix, alias, folder } = body;

  // ── 2. Validate URL ────────────────────────────────────────────────────────
  if (!originalUrl) {
    console.warn("[shorten] Missing originalUrl");
    return Response.json({ error: "URL required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (e) {
    console.warn("[shorten] Invalid URL format:", originalUrl, e);
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    console.warn("[shorten] Rejected protocol:", parsedUrl.protocol);
    return Response.json({ error: "Only http and https URLs are allowed" }, { status: 400 });
  }

  console.log("[shorten] URL validated:", originalUrl);

  // ── 3. Auth (optional — guests allowed) ───────────────────────────────────
  let userId: string | null = null;
  let shortDomain = "snsh.vercel.app";
  try {
    const authData = await auth();
    userId = authData.userId;
    if (userId) shortDomain = getUserDomain(userId);
    console.log("[shorten] Auth resolved, userId:", userId ?? "guest", "domain:", shortDomain);
  } catch (e) {
    console.log("[shorten] Auth skipped (guest):", e);
  }

  // ── 4. Connect to DB ───────────────────────────────────────────────────────
  try {
    console.log("[shorten] Connecting to DB…");
    await connectDB();
    console.log("[shorten] DB connected");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[shorten] DB connection failed:", msg);
    return Response.json(
      { error: "Database connection failed", ...(isDev && { detail: msg }) },
      { status: 500 }
    );
  }

  // ── 5 & 6. Resolve shortCode + Save ───────────────────────────────────────
  // Alias: check existence first to return a clear error, then insert once.
  // Random: attempt Link.create() directly; catch duplicate-key (code 11000)
  //         and retry with a new random suffix — 1 DB write in the common case,
  //         no pre-flight reads needed.
  try {
    if (alias) {
      const shortCode = alias.trim().toLowerCase().replace(/[^a-z0-9\-]/g, "");
      console.log("[shorten] Using alias shortCode:", shortCode);
      const exists = await Link.findOne({ shortCode });
      if (exists) {
        console.warn("[shorten] Alias already exists:", shortCode);
        return Response.json({ error: "Alias already exists" }, { status: 400 });
      }
      const newLink = await Link.create({
        originalUrl, shortCode, userId: userId || null, folder: folder?.trim() || "",
      });
      console.log("[shorten] Saved alias link, _id:", newLink._id);
      const shortUrl = `https://${shortDomain}/${shortCode}`;
      return Response.json({ data: { ...newLink.toObject(), shortUrl } });

    } else {
      const cleanPrefix =
        prefix?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "mani";
      console.log("[shorten] Generating shortCode with prefix:", cleanPrefix);

      for (let attempt = 0; attempt < 20; attempt++) {
        const shortCode = `${cleanPrefix}-${Math.random().toString(36).substring(2, 6)}`;
        try {
          const newLink = await Link.create({
            originalUrl, shortCode, userId: userId || null, folder: folder?.trim() || "",
          });
          console.log("[shorten] Saved link, shortCode:", shortCode, "attempt:", attempt + 1);
          const shortUrl = `https://${shortDomain}/${shortCode}`;
          return Response.json({ data: { ...newLink.toObject(), shortUrl } });
        } catch (e: any) {
          if (e?.code === 11000) {
            console.log("[shorten] Collision on", shortCode, "retrying…");
            continue;
          }
          throw e;
        }
      }
      throw new Error("Could not generate unique shortCode after 20 attempts");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[shorten] error:", msg);
    if (stack) console.error("[shorten] Stack:", stack);
    return Response.json(
      { error: "Failed to save link", ...(isDev && { detail: msg }) },
      { status: 500 }
    );
  }
}
