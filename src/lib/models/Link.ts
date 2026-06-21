import mongoose, { Schema, model, models } from "mongoose";

const LinkSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    urls: [{ type: String }],
    shortCode: { type: String, required: true, unique: true },
    userId: { type: String, default: null },
    folder: { type: String, default: "" },
    clicks: { type: Number, default: 0 },
    clickHistory: [
      {
        timestamp: { type: String, required: true },
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Speeds up the distinct("folder") query in /api/folders and any
// userId-scoped list queries that sort by folder.
LinkSchema.index({ userId: 1, folder: 1 });

const Link = models.Link || model("Link", LinkSchema);

export default Link;
