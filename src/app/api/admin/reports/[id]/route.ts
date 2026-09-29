import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Staff, Doctor, Department, Schedule, User, AuditLog } from "@/models";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;

    let reportTitle = "";
    let reportCategory = "";
    let reportDescription = "";
    let summary: Record<string, any> = {};
    let dataTable: any[] = [];
    let columns: { key: string; label: string }[] = [];

    switch (id) {
      case "staff-roster": {
        reportTitle = "Staff Distribution & Workforce Report";
        reportCategory = "Workforce";
        reportDescription = "Operational registry of healthcare staff, assigned departments, and active statuses.";

        const staff = await Staff.find().sort({ department: 1, fullName: 1 }).lean();
        const roleCounts: Record<string, number> = {};
        const deptCounts: Record<string, number> = {};
        let activeCount = 0;

        staff.forEach((s) => {
          roleCounts[s.role] = (roleCounts[s.role] || 0) + 1;
          deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
          if (s.status === "active") activeCount++;
        });

        summary = {
          totalStaff: staff.length,
          activeStaff: activeCount,
          inactiveStaff: staff.length - activeCount,
          byRole: roleCounts,
          byDepartment: deptCounts,
        };

        columns = [
          { key: "employeeId", label: "Employee ID" },
          { key: "fullName", label: "Full Name" },
          { key: "role", label: "Role" },
          { key: "department", label: "Department" },
          { key: "shift", label: "Shift Schedule" },
          { key: "status", label: "Status" },
        ];

        dataTable = staff.map((s) => ({
          employeeId: s.employeeId,
          fullName: s.fullName,
          role: s.role.replace("_", " "),
          department: s.department,
          shift: s.shift,
          status: s.status,
        }));
        break;
      }

      case "doctor-capacity": {
        reportTitle = "Doctor Credential & Specialization Report";
        reportCategory = "Clinical Staffing";
        reportDescription = "Comprehensive directory of active physician credentials, consultation rooms, and operating hours.";

        const doctors = await Doctor.find().sort({ department: 1, name: 1 }).lean();
        const specialtyCounts: Record<string, number> = {};
        doctors.forEach((d) => {
          specialtyCounts[d.specialty] = (specialtyCounts[d.specialty] || 0) + 1;
        });

        summary = {
          totalDoctors: doctors.length,
          activeDoctors: doctors.filter((d) => d.status === "active").length,
          specialtiesCount: Object.keys(specialtyCounts).length,
          bySpecialty: specialtyCounts,
        };

        columns = [
          { key: "name", label: "Doctor Name" },
          { key: "specialty", label: "Specialty" },
          { key: "department", label: "Department" },
          { key: "qualification", label: "Qualifications" },
          { key: "roomNumber", label: "Room / Suite" },
          { key: "workingHours", label: "Hours" },
          { key: "status", label: "Status" },
        ];

        dataTable = doctors.map((d) => ({
          name: d.name,
          specialty: d.specialty,
          department: d.department,
          qualification: d.qualification,
          roomNumber: d.roomNumber,
          workingHours: `${d.workingHours?.start || "09:00 AM"} - ${d.workingHours?.end || "05:00 PM"}`,
          status: d.status,
        }));
        break;
      }

      case "department-allocation": {
        reportTitle = "Department Operational Status Report";
        reportCategory = "Operations";
        reportDescription = "Overview of facility divisions, operating hours, and location assignments.";

        const departments = await Department.find().sort({ name: 1 }).lean();

        summary = {
          totalDepartments: departments.length,
          activeDepartments: departments.filter((d) => d.status === "active").length,
        };

        columns = [
          { key: "code", label: "Code" },
          { key: "name", label: "Department Name" },
          { key: "headOfDepartment", label: "Head of Dept" },
          { key: "location", label: "Facility Location" },
          { key: "operatingHours", label: "Operating Hours" },
          { key: "status", label: "Status" },
        ];

        dataTable = departments.map((d) => ({
          code: d.code,
          name: d.name,
          headOfDepartment: d.headOfDepartment || "Not Assigned",
          location: d.location,
          operatingHours: `${d.operatingHours?.start} - ${d.operatingHours?.end}`,
          status: d.status,
        }));
        break;
      }

      case "duty-availability": {
        reportTitle = "Shift Roster & Facility Coverage Report";
        reportCategory = "Scheduling";
        reportDescription = "Weekly duty shifts across personnel, stations, and time slots.";

        const schedules = await Schedule.find().sort({ dayOfWeek: 1, startTime: 1 }).lean();
        const shiftCounts: Record<string, number> = {};
        schedules.forEach((s) => {
          shiftCounts[s.shiftType] = (shiftCounts[s.shiftType] || 0) + 1;
        });

        summary = {
          totalShiftsAssigned: schedules.length,
          activeShifts: schedules.filter((s) => s.status === "active").length,
          byShiftType: shiftCounts,
        };

        columns = [
          { key: "personName", label: "Staff / Doctor" },
          { key: "role", label: "Role" },
          { key: "department", label: "Department" },
          { key: "dayOfWeek", label: "Day" },
          { key: "timeWindow", label: "Time Window" },
          { key: "station", label: "Station" },
          { key: "status", label: "Status" },
        ];

        dataTable = schedules.map((s) => ({
          personName: s.personName,
          role: s.role,
          department: s.department,
          dayOfWeek: s.dayOfWeek,
          timeWindow: `${s.startTime} - ${s.endTime}`,
          station: s.station,
          status: s.status,
        }));
        break;
      }

      case "user-accounts": {
        reportTitle = "User Role & Account Security Report";
        reportCategory = "Identity & Access";
        reportDescription = "Authentication directory, system roles distribution, and account activation states.";

        const users = await User.find().select("-passwordHash").sort({ role: 1, name: 1 }).lean();
        const roleCounts: Record<string, number> = {};
        let activeUsers = 0;

        users.forEach((u) => {
          roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
          if (u.status === "active") activeUsers++;
        });

        summary = {
          totalAccounts: users.length,
          activeAccounts: activeUsers,
          inactiveAccounts: users.length - activeUsers,
          byRole: roleCounts,
        };

        columns = [
          { key: "name", label: "Name" },
          { key: "email", label: "Email Address" },
          { key: "role", label: "Assigned Role" },
          { key: "status", label: "Account Status" },
          { key: "createdAt", label: "Created Date" },
        ];

        dataTable = users.map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: new Date(u.createdAt).toLocaleDateString(),
        }));
        break;
      }

      case "system-audit": {
        reportTitle = "Administrative System Activity & Audit Report";
        reportCategory = "Compliance";
        reportDescription = "Chronological audit ledger of administrative actions and privileged operations.";

        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();

        summary = {
          totalAuditEntries: logs.length,
          successfulActions: logs.filter((l) => l.status === "success").length,
          warningActions: logs.filter((l) => l.status === "warning").length,
          failedActions: logs.filter((l) => l.status === "failure").length,
        };

        columns = [
          { key: "action", label: "Action" },
          { key: "actor", label: "Actor" },
          { key: "resource", label: "Resource" },
          { key: "resourceType", label: "Category" },
          { key: "status", label: "Status" },
          { key: "timestamp", label: "Timestamp" },
        ];

        dataTable = logs.map((l) => ({
          action: l.action,
          actor: `${l.actor?.name} (${l.actor?.email})`,
          resource: l.resource,
          resourceType: l.resourceType,
          status: l.status,
          timestamp: new Date(l.createdAt).toLocaleString(),
        }));
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id,
        title: reportTitle,
        category: reportCategory,
        description: reportDescription,
        summary,
        columns,
        data: dataTable,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
