import { connectDB } from "@/lib/db";
import Link from "@/lib/models/Link";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  await connectDB();

  // 🔥 FIXED CLERK USAGE
  const authData = await auth();
  const userId = authData.userId;

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  let query: any = {};

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  query.userId = userId;

  // 🔍 Search
  if (search) {
    query.$or = [
      { originalUrl: { $regex: search, $options: "i" } },
      { shortCode: { $regex: search, $options: "i" } },
    ];
  }

  // 📅 Date filter
  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [links, total] = await Promise.all([
    Link.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Link.countDocuments(query),
  ]);

  return Response.json({
    data: links,
    pagination: { page, limit, total, hasMore: skip + links.length < total },
  });
}