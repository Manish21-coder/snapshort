// src/app/api/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// 1️⃣ Define a simple User schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

// 2️⃣ Use model if it exists, otherwise create it
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 3️⃣ Fetch all users from the collection
    const users = await User.find({});
    return NextResponse.json({ message: "Database Connected Successfully", 

      "users": [
    {
      "_id": "643c1b9f7c8f1a23e4567890",
      "name": "Manish Kumar",
      "email": "manish@example.com",
      "__v": 0
    }
  ]

     });
  } catch (err) {
    console.error("DB GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // 4️⃣ Create a new user
    const newUser = await User.create({
      name: body.name,
      email: body.email,
    });

    return NextResponse.json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error("DB POST Error:", err);
    return NextResponse.json(
      { error: "Failed to create user", details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}