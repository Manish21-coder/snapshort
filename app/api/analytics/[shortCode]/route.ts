import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Link from "@/lib/models/Link";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  await connectDB();

  const { shortCode } = await context.params;
  const { searchParams } = req.nextUrl;

  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1",  10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip  = (page - 1) * limit;

  // $slice on the projection reads only the requested window from MongoDB —
  // the full clickHistory array is never loaded into memory.
  const link = await Link.findOne(
    { shortCode },
    { clicks: 1, clickHistory: { $slice: [skip, limit] } }
  );

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const history = link.clickHistory || [];

  return NextResponse.json({
    totalClicks: link.clicks,
    data: history,
    pagination: { page, limit, hasMore: history.length === limit },
  });
}