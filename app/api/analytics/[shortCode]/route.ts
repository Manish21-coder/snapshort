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
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

  // Single aggregation:
  //   windowStart = max(0, clicks - page*limit)  → offset from array start
  //   $slice the window, then $reverseArray       → newest-first output
  //   hasMore = windowStart > 0                   → older entries exist
  const [result] = await Link.aggregate([
    { $match: { shortCode } },
    {
      $addFields: {
        windowStart: { $max: [0, { $subtract: ["$clicks", page * limit] }] },
      },
    },
    {
      $project: {
        totalClicks: "$clicks",
        hasMore: { $gt: ["$windowStart", 0] },
        data: { $reverseArray: { $slice: ["$clickHistory", "$windowStart", limit] } },
      },
    },
  ]);

  if (!result) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({
    totalClicks: result.totalClicks,
    data: result.data,
    pagination: { page, limit, hasMore: result.hasMore },
  });
}