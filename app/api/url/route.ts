import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Url } from "@/lib/models/Url";


function generateShortCode(prefix = "Mani", length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + randomPart;
}

// Example usage:
const shortCode = generateShortCode();
console.log(shortCode); // e.g., "ManiA1b2C3"

export async function POST(req: Request) {
  await connectDB();
  const { originalUrl } = await req.json();

  if (!originalUrl) {
    return NextResponse.json({ error: "originalUrl is required" }, { status: 400 });
  }

  const shortCode = generateShortCode();

  const newUrl = await Url.create({ originalUrl, shortCode });

  return NextResponse.json({
    message: "URL shortened successfully",
    data: newUrl,
  });
}