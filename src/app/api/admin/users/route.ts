import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession, hashPassword } from "@/lib/auth";
import { User } from "@/models";
import { logAuditEvent } from "@/lib/audit";
import { ROLES, Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (role && role !== "all") query.role = role;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-passwordHash").sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load users" },
      { status: error.message === "UNAUTHORIZED_ADMIN" ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email, and role are required." },
        { status: 400 }
      );
    }

    const validRoles = Object.values(ROLES);
    if (!(validRoles as string[]).includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role specified. Valid roles are: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user account with this email address already exists." },
        { status: 400 }
      );
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password || "CareSync2026!"),
      role,
      phone: phone?.trim() || "",
      status: "active",
    });

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "USER_ACCOUNT_CREATED",
      resource: `${newUser.name} (${newUser.email})`,
      resourceType: "user",
      metadata: { role, email: newUser.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
      message: "User account created successfully",
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
