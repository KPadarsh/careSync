import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession, hashPassword } from "@/lib/auth";
import { Staff, User } from "@/models";
import { logAuditEvent } from "@/lib/audit";
import { ROLES, Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const role = searchParams.get("role") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};

    if (role && role !== "all") {
      query.role = role;
    }
    if (department && department !== "all") {
      query.department = department;
    }
    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }

    const staffList = await Staff.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      staff: staffList,
      total: staffList.length,
    });
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load staff list" },
      { status: error.message === "UNAUTHORIZED_ADMIN" ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      role,
      department,
      designation,
      shift,
      emergencyContact,
      qualifications,
      notes,
    } = body;

    if (!fullName || !email || !role || !department) {
      return NextResponse.json(
        { success: false, error: "Full name, email, role, and department are required." },
        { status: 400 }
      );
    }

    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: "A staff profile with this email already exists." },
        { status: 400 }
      );
    }

    // Auto-generate employeeId
    const count = await Staff.countDocuments();
    const employeeId = `STF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    // Map staff role to system user role
    const roleMapping: Record<string, Role> = {
      receptionist: ROLES.RECEPTION,
      nurse: ROLES.NURSE,
      lab_technician: ROLES.LAB_TECHNICIAN,
      pathologist: ROLES.PATHOLOGIST,
      pharmacist: ROLES.PHARMACY,
      billing_staff: ROLES.BILLING,
      administrator: ROLES.ADMIN,
      other: ROLES.PATIENT,
    };
    const userRole = roleMapping[role] || ROLES.RECEPTION;

    // Create or link User account
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(body.password || "CareSync2026!"),
        role: userRole,
        phone: phone || "",
        status: "active",
      });
    }

    const newStaff = await Staff.create({
      employeeId,
      userId: user._id,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "+1 (555) 000-0000",
      role,
      department: department.trim(),
      designation: designation?.trim() || role.replace("_", " "),
      shift: shift || "Morning (08:00 - 16:00)",
      status: "active",
      joinedDate: new Date(),
      emergencyContact: emergencyContact || "",
      qualifications: qualifications || "",
      notes: notes || "",
    });

    // Server-side Audit Log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "STAFF_CREATED",
      resource: `${fullName} (${employeeId})`,
      resourceType: "staff",
      metadata: { role, department, employeeId, email },
    });

    return NextResponse.json({
      success: true,
      staff: newStaff,
      message: "Staff member created successfully",
    });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff member" },
      { status: 500 }
    );
  }
}
