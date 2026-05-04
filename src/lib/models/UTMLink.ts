import mongoose, { Schema, model, models } from "mongoose";

const UTMLinkSchema = new Schema(
  {
    userId: { type: String, required: true },
    baseUrl: { type: String, required: true },
    utmParams: {
      utm_source: { type: String, default: "" },
      utm_medium: { type: String, default: "" },
      utm_campaign: { type: String, default: "" },
      utm_term: { type: String, default: "" },
      utm_content: { type: String, default: "" },
      utm_id: { type: String, default: "" },
      coupon: { type: String, default: "" },
    },
    customParams: [{ key: String, value: String }],
    finalUrl: { type: String, required: true },
    shortUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

UTMLinkSchema.index({ userId: 1, createdAt: -1 });

const UTMLink = models.UTMLink || model("UTMLink", UTMLinkSchema);

export default UTMLink;
