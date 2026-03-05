import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Url } from "@/lib/models/Url";

export async function GET(req: Request, { params }: { params: { shortCode: string } }) {
  await connectDB();
  const { shortCode } = params;

  const url = await Url.findOne({ shortCode });

  if (!url) return NextResponse.json({ error: "URL not found" }, { status: 404 });

  // Increase click count
  url.clicks += 1;
  await url.save();

  // Redirect
  return NextResponse.redirect(url.originalUrl);
}