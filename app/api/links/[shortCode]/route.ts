import { connectDB } from "@/lib/db";
import Link from "@/lib/models/Link";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "Only http/https URLs are allowed";
    return null;
  } catch {
    return "Invalid URL format";
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ shortCode: string }> }
) {
  try {
    await connectDB();
    const { userId } = await auth();
    const { shortCode } = await context.params;

    // userId filter ensures a user can only fetch their own link.
    // Return 404 (not 403) so we don't reveal whether the shortCode exists.
    if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const link = await Link.findOne({ shortCode, userId });
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: link });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ shortCode: string }> }
) {
  await connectDB();
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shortCode } = await context.params;
  const { originalUrl, folder, urls } = await req.json();

  const link = await Link.findOne({ shortCode, userId });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (originalUrl !== undefined) {
    const err = validateUrl(originalUrl);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    link.originalUrl = originalUrl;
  }

  if (folder !== undefined) link.folder = folder;

  if (urls !== undefined) {
    for (const u of urls) {
      const err = validateUrl(u);
      if (err) return NextResponse.json({ error: `${err}: ${u}` }, { status: 400 });
    }
    link.urls = urls;
  }

  await link.save();
  return NextResponse.json({ data: link });
}
