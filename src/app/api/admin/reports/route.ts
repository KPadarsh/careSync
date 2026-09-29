import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Staff, Doctor, Department, Schedule, User, AuditLog } from "@/models";

export async function GET() {
  try {
    await requireAdminSession();
    await connectToDatabase();

    // STRICT: Only administrative infrastructure reports.
    // Zero patient analytics, zero clinical records, zero appointment counts, zero revenue.

    const [staffCount, doctorCount, departmentCount, userCount, scheduleCount, auditCount] =
      await Promise.all([
        Staff.countDocuments(),
        Doctor.countDocuments(),
        Department.countDocuments(),
        User.countDocuments(),
        Schedule.countDocuments(),
        AuditLog.countDocuments(),
      ]);

    const availableReports = [
      {
        id: "staff-roster",
        title: "Staff Distribution & Workforce Report",
        category: "Workforce",
        description: "Comprehensive headcount and role breakdown of all active clinical and support personnel.",
        totalRecords: staffCount,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "doctor-capacity",
        title: "Doctor Credential & Specialization Report",
        category: "Clinical Staffing",
        description: "Registry of medical staff, departmental allocations, room assignments, and available working hours.",
        totalRecords: doctorCount,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "department-allocation",
        title: "Department Operational Status Report",
        category: "Operations",
        description: "Facility locations, operating hours, assigned heads of department, and active staff ratios.",
        totalRecords: departmentCount,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "duty-availability",
        title: "Shift Roster & Facility Coverage Report",
        category: "Scheduling",
        description: "Weekly staff duty rosters, shift coverage distributions, and station assignment status.",
        totalRecords: scheduleCount,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "user-accounts",
        title: "User Role & Account Security Report",
        category: "Identity & Access",
        description: "System authentication registry, role segregation status, and active vs inactive credential states.",
        totalRecords: userCount,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "system-audit",
        title: "Administrative System Activity & Audit Report",
        category: "Compliance",
        description: "Immutable server-side audit logs of administrative actions, role modifications, and system events.",
        totalRecords: auditCount,
        lastGenerated: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      reports: availableReports,
    });
  } catch (error: any) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load reports" },
      { status: 500 }
    );
  }
}
