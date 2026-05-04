import { connectDB } from "@/lib/db";
import UTMLink from "@/lib/models/UTMLink";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { baseUrl, utmParams, customParams, finalUrl, shortUrl } = body;

    if (!baseUrl || !finalUrl) {
      return Response.json({ error: "baseUrl and finalUrl are required" }, { status: 400 });
    }

    const doc = await UTMLink.create({
      userId,
      baseUrl,
      utmParams: utmParams || {},
      customParams: customParams || [],
      finalUrl,
      shortUrl: shortUrl || "",
    });

    return Response.json({ data: doc });
  } catch (error) {
    console.error("UTM POST error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const range = searchParams.get("range") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const query: Record<string, unknown> = { userId };

    if (search) {
      query.$or = [
        { baseUrl: { $regex: search, $options: "i" } },
        { "utmParams.utm_campaign": { $regex: search, $options: "i" } },
        { finalUrl: { $regex: search, $options: "i" } },
      ];
    }

    if (source) {
      query["utmParams.utm_source"] = { $regex: source, $options: "i" };
    }

    if (range || startDate || endDate) {
      const now = new Date();
      let from: Date | null = null;
      let to: Date | null = null;

      if (range === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (range === "7days") {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === "30days") {
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        if (startDate) from = new Date(startDate);
        if (endDate) {
          to = new Date(endDate);
          to.setDate(to.getDate() + 1);
        }
      }

      if (from || to) {
        const dateQuery: Record<string, Date> = {};
        if (from) dateQuery.$gte = from;
        if (to) dateQuery.$lte = to;
        query.createdAt = dateQuery;
      }
    }

    const docs = await UTMLink.find(query).sort({ createdAt: -1 }).limit(20);
    return Response.json({ data: docs });
  } catch (error) {
    console.error("UTM GET error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await UTMLink.deleteMany({ userId });
    return Response.json({ success: true });
  } catch (error) {
    console.error("UTM DELETE error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
