"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface PatientDetailData {
  patient: {
    _id: string;
    mrn: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      avatar?: string;
      status: string;
      createdAt: string;
    };
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
    insurance?: {
      provider?: string;
      policyNumber?: string;
      groupNumber?: string;
      expiryDate?: string;
    };
    allergies?: string[];
    primaryDoctorId?: {
      _id: string;
      name: string;
      specialty: string;
      roomNumber: string;
    };
  };
  appointments: Array<{
    _id: string;
    date: string;
    timeSlot: string;
    status: string;
    type: string;
    reason: string;
    doctorId?: {
      name: string;
      specialty: string;
      roomNumber: string;
    };
  }>;
  visits: Array<{
    _id: string;
    visitDate: string;
    reason: string;
    status: string;
    doctorId?: {
      name: string;
      specialty: string;
    };
  }>;
  followUps: Array<{
    _id: string;
    recommendedDate: string;
    reason: string;
    clinicalInstructions: string;
    status: string;
    doctorId?: {
      name: string;
      specialty: string;
    };
  }>;
}

export function PatientDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<PatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "visits" | "followups">("overview");

  // Edit demographics modal
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZip, setEditZip] = useState("");
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyRel, setEditEmergencyRel] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editInsuranceProv, setEditInsuranceProv] = useState("");
  const [editInsurancePol, setEditInsurancePol] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPatient = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reception/patients/${id}`);
      if (!res.ok) throw new Error("Failed to load patient record");
      const json = await res.json();
      setData(json);

      // Preload edit states
      const p = json.patient;
      setEditPhone(p.phone || p.userId?.phone || "");
      setEditStreet(p.address?.street || "");
      setEditCity(p.address?.city || "");
      setEditState(p.address?.state || "");
      setEditZip(p.address?.postalCode || "");
      setEditEmergencyName(p.emergencyContact?.name || "");
      setEditEmergencyRel(p.emergencyContact?.relationship || "");
      setEditEmergencyPhone(p.emergencyContact?.phone || "");
      setEditInsuranceProv(p.insurance?.provider || "");
      setEditInsurancePol(p.insurance?.policyNumber || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching patient");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleSaveDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await fetch(`/api/reception/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editPhone,
          address: {
            street: editStreet,
            city: editCity,
            state: editState,
            postalCode: editZip,
          },
          emergencyContact: {
            name: editEmergencyName,
            relationship: editEmergencyRel,
            phone: editEmergencyPhone,
          },
          insurance: {
            provider: editInsuranceProv,
            policyNumber: editInsurancePol,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to update demographics");
      setIsEditing(false);
      await fetchPatient();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update record");
    } finally {
      setSavingEdit(false);
    }
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const diffMs = Date.now() - new Date(dobString).getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading patient chart...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3 max-w-lg mx-auto">
        <Icons.AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Patient Record Not Found</h3>
        <p className="text-xs text-rose-700">{error || "The requested patient chart could not be loaded."}</p>
        <Link
          href="/reception/patients"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          <Icons.ChevronLeft className="w-4 h-4" />
          <span>Return to Directory</span>
        </Link>
      </div>
    );
  }

  const { patient, appointments, visits, followUps } = data;
  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/reception/patients" className="hover:text-teal-700">
            Patients
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{patient.userId?.name || "Patient Record"}</span>
        </div>
        <Link
          href="/reception/patients"
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* PATIENT HERO CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg ring-4 ring-teal-50 shrink-0">
              {patient.userId?.name?.slice(0, 2).toUpperCase() || "PT"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{patient.userId?.name}</h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {patient.mrn}
                </span>
                {patient.bloodGroup && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="capitalize">{patient.gender || "Patient"}</span>
                {age ? ` • ${age} years old` : ""}
                {patient.dateOfBirth ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})` : ""}
                {" • "}Registered {new Date(patient.userId?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <Icons.Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Demographics</span>
            </button>
            <Link
              href={`/reception/appointments/new?patientId=${patient._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center gap-6 border-b border-slate-200 mt-6 -mb-6 px-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === "overview"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Overview &amp; Demographics
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "appointments"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Appointments</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {appointments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("visits")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "visits"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Visit Records</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {visits.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("followups")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "followups"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Follow-up Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              {followUps.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & DEMOGRAPHICS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CONTACT & RESIDENCE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Contact &amp; Residence
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Icons.Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                  <p className="font-semibold text-slate-800">{patient.phone || patient.userId?.phone || "Not recorded"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icons.Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                  <p className="font-semibold text-slate-800">{patient.userId?.email || "Not recorded"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icons.MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Address</span>
                  <p className="text-slate-700">
                    {patient.address?.street ? `${patient.address.street}, ` : ""}
                    {patient.address?.city || ""}
                    {patient.address?.state ? `, ${patient.address.state}` : ""}
                    {patient.address?.postalCode ? ` ${patient.address.postalCode}` : ""}
                    {!patient.address?.city && !patient.address?.street && "No address on file"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* EMERGENCY CONTACT & INSURANCE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Emergency Contact &amp; Payer
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Next of Kin / Contact</span>
                <p className="font-semibold text-slate-800">
                  {patient.emergencyContact?.name || "None designated"}
                  {patient.emergencyContact?.relationship ? ` (${patient.emergencyContact.relationship})` : ""}
                </p>
                {patient.emergencyContact?.phone && (
                  <p className="text-slate-500 font-mono mt-0.5">{patient.emergencyContact.phone}</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Insurance Coverage</span>
                <p className="font-semibold text-slate-800">
                  {patient.insurance?.provider || "Self-Pay / Cash"}
                </p>
                {patient.insurance?.policyNumber && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    Member ID: {patient.insurance.policyNumber}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Allergies Warning</span>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {patient.allergies.map((allergy, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No known allergies flagged</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: APPOINTMENTS */}
      {activeTab === "appointments" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Appointment History</h3>
            <Link
              href={`/reception/appointments/new?patientId=${patient._id}`}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              + Book New Slot
            </Link>
          </div>
          {appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No appointments scheduled for this patient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <div key={appt._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
                      </span>
                      <span className="capitalize px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {appt.doctorId?.name} • {appt.doctorId?.specialty} ({appt.doctorId?.roomNumber})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Reason: {appt.reason}</p>
                  </div>
                  <Link
                    href={`/reception/appointments/${appt._id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: VISITS */}
      {activeTab === "visits" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Past Clinic Encounters</h3>
            <p className="text-[11px] text-slate-500">Read-only encounter timeline</p>
          </div>
          {visits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No clinical visits on file.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visits.map((v) => (
                <div key={v._id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {new Date(v.visitDate).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">{v.doctorId?.name} • {v.doctorId?.specialty}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Encounter Reason: {v.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: FOLLOW-UPS */}
      {activeTab === "followups" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recommended Follow-ups</h3>
              <p className="text-[11px] text-slate-500">Clinical orders scheduled by attending doctors</p>
            </div>
            <Link href="/reception/follow-ups" className="text-xs font-semibold text-teal-700 hover:text-teal-900">
              All Follow-ups
            </Link>
          </div>
          {followUps.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No pending follow-ups for this patient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followUps.map((fu) => (
                <div key={fu._id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        Due: {new Date(fu.recommendedDate).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase">
                        {fu.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">{fu.reason}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 italic">
                      Instructions: &quot;{fu.clinicalInstructions}&quot;
                    </p>
                  </div>
                  <Link
                    href={`/reception/appointments/new?patientId=${patient._id}&followUpId=${fu._id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                  >
                    Schedule Slot
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT DEMOGRAPHICS MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Patient Demographics</h3>
                <p className="text-xs text-slate-500">Update non-clinical contact &amp; emergency info</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDemographics} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editZip}
                    onChange={(e) => setEditZip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editEmergencyRel}
                      onChange={(e) => setEditEmergencyRel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Insurance Payer</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Provider</label>
                    <input
                      type="text"
                      value={editInsuranceProv}
                      onChange={(e) => setEditInsuranceProv(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Policy / ID</label>
                    <input
                      type="text"
                      value={editInsurancePol}
                      onChange={(e) => setEditInsurancePol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 text-white bg-teal-600 hover:bg-teal-700 font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
