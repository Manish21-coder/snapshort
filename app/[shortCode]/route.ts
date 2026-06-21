import { NextResponse, after } from "next/server";
import { connectDB } from "@/lib/db";
import Link from "@/lib/models/Link";
import { getCached, setCached } from "@/lib/shortcodeCache";

export async function GET(
  req: Request,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;
  console.log("Incoming shortcode:", shortCode);

  // ── 1. In-memory cache lookup (no DB, no network) ─────────────────────────
  let originalUrl: string;
  let urls: string[];

  const hit = getCached(shortCode);
  if (hit) {
    originalUrl = hit.originalUrl;
    urls = hit.urls;
    console.log("Cache hit for shortcode:", shortCode);
  } else {
    // ── 2. Cache miss — query MongoDB once, then populate cache ─────────────
    await connectDB();
    const link = await Link.findOne({ shortCode });
    console.log("DB result:", link);

    if (!link) {
      return NextResponse.json({ error: "Short link not found" }, { status: 404 });
    }

    originalUrl = link.originalUrl;
    urls = link.urls ?? [];
    setCached(shortCode, originalUrl, urls);
  }

  // ── 3. Round-robin pool (same logic as before) ────────────────────────────
  const pool = urls.length > 0 ? urls : [originalUrl];
  const targetUrl = pool[Math.floor(Math.random() * pool.length)];

  // ── 4. Capture analytics headers before response leaves ───────────────────
  const userAgent = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "";

  // ── 5. Defer DB write until after the redirect is sent ────────────────────
  // `after()` schedules work post-response so the client gets the 307
  // immediately — the DB write no longer contributes to Active CPU time.
  after(async () => {
    try {
      await connectDB();
      await Link.updateOne(
        { shortCode },
        {
          $inc: { clicks: 1 },
          $push: { clickHistory: { timestamp: new Date().toISOString(), userAgent, ip } },
        }
      );
    } catch (e) {
      console.error("[redirect] analytics write failed:", e);
    }
  });

  return NextResponse.redirect(targetUrl);
}
