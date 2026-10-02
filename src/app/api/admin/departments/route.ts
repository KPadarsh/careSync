import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Department, Doctor, Staff } from "@/models";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { headOfDepartment: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const departments = await Department.find(query).sort({ name: 1 }).lean();

    // Fetch assigned counts for each department
    const [doctors, staff] = await Promise.all([
      Doctor.find({ status: { $in: ["active", "ACTIVE"] } }).select("department").lean(),
      Staff.find({ status: { $in: ["active", "ACTIVE"] } }).select("department").lean(),
    ]);

    const enriched = departments.map((dept) => {
      const docCount = doctors.filter((d) => d.department?.toLowerCase() === dept.name.toLowerCase()).length;
      const staffCount = staff.filter((s) => s.department?.toLowerCase() === dept.name.toLowerCase()).length;
      return {
        ...dept,
        doctorsCount: docCount,
        staffCount: staffCount,
      };
    });

    return NextResponse.json({
      success: true,
      departments: enriched,
      total: enriched.length,
    });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load departments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const { name, code, description, headOfDepartment, location, phone, email, operatingHours } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Department name and code are required." },
        { status: 400 }
      );
    }

    const existing = await Department.findOne({
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A department with this name or code already exists." },
        { status: 400 }
      );
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || "",
      headOfDepartment: headOfDepartment || "",
      location: location || "Main Clinic Building",
      phone: phone || "",
      email: email || "",
      operatingHours: operatingHours || { start: "08:00 AM", end: "08:00 PM" },
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
      action: "DEPARTMENT_CREATED",
      resource: `${department.name} (${department.code})`,
      resourceType: "department",
      metadata: { code, headOfDepartment, location },
    });

    return NextResponse.json({
      success: true,
      department,
      message: "Department created successfully",
    });
  } catch (error: any) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create department" },
      { status: 500 }
    );
  }
}
