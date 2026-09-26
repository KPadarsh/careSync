"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface PatientOption {
  _id: string;
  mrn: string;
  user: { name: string; email: string; phone: string };
}

interface DoctorOption {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  roomNumber: string;
  waitingCount: number;
}

interface CreatedTicket {
  ticketNumber: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  specialty: string;
  roomNumber: string;
  department: string;
  priority: string;
  positionInQueue: number;
  estimatedWaitMinutes: number;
  checkedInTime: string;
}

export function WalkInView() {
  const router = useRouter();

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Mode: "existing" vs "new"
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");

  // New patient fields
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGender, setNewGender] = useState<"male" | "female" | "other">("male");

  // Clinical assignment
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent" | "vip">("normal");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<CreatedTicket | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [patRes, docRes] = await Promise.all([
          fetch("/api/reception/patients?limit=50"),
          fetch("/api/reception/doctors"),
        ]);
        if (patRes.ok) {
          const patData = await patRes.json();
          setPatients(patData.patients || []);
        }
        if (docRes.ok) {
          const docData = await docRes.json();
          setDoctors(docData.doctors || []);
          if (docData.doctors?.length > 0) {
            setSelectedDoctorId(docData.doctors[0]._id);
          }
        }
      } catch {
        // silently fallback
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (!patientQuery.trim()) return true;
    const q = patientQuery.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(q) ||
      p.mrn?.toLowerCase().includes(q) ||
      p.user?.phone?.includes(q)
    );
  });

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientMode === "existing" && !selectedPatientId) {
      setErrorMessage("Please select an existing patient.");
      return;
    }
    if (patientMode === "new" && (!newName.trim() || !newPhone.trim())) {
      setErrorMessage("Patient full name and phone number are required.");
      return;
    }
    if (!selectedDoctorId) {
      setErrorMessage("Please select an attending physician.");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Please enter chief complaint or reason for visit.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: Record<string, unknown> = {
        doctorId: selectedDoctorId,
        department: selectedDoctor?.department || "General Medicine",
        reason: reason.trim(),
        priority,
        notes: notes.trim(),
      };

      if (patientMode === "existing") {
        payload.patientId = selectedPatientId;
      } else {
        payload.newPatient = {
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          gender: newGender,
        };
      }

      const res = await fetch("/api/reception/walk-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to process walk-in intake");
      }

      setTicketResult(json.ticket);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating walk-in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setTicketResult(null);
    setSelectedPatientId("");
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setReason("");
    setNotes("");
    setPriority("normal");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Walk-in Patient Intake
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid registration and live queue insertion for unscheduled arrivals
          </p>
        </div>

        <Link
          href="/reception/queue"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs self-start"
        >
          <Icons.Queue className="w-4 h-4" />
          <span>View Queue Board</span>
        </Link>
      </div>

      {/* RESULT TICKET CONFIRMATION (MATCHES STITCH 258eb2feaac546b193afea648927258a) */}
      {ticketResult ? (
        <div className="bg-white border border-teal-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center mx-auto">
            <Icons.CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block">
              Walk-in Queued Successfully
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Clinic Token
            </p>
            <div className="mt-3 inline-block">
              <span className="font-mono text-4xl sm:text-5xl font-black px-6 py-2 bg-slate-900 text-white rounded-xl shadow-inner tracking-wider">
                {ticketResult.ticketNumber}
              </span>
            </div>
          </div>

          {/* TICKET DETAILS BOX */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{ticketResult.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">MRN:</span>
              <span className="font-mono font-medium text-slate-800">{ticketResult.mrn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned Physician:</span>
              <span className="font-bold text-teal-900">{ticketResult.doctorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-slate-800">
                {ticketResult.department} • {ticketResult.roomNumber}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Queue Position:</span>
              <span className="font-bold text-slate-900">#{ticketResult.positionInQueue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estimated Wait:</span>
              <span className="font-bold text-amber-700">~{ticketResult.estimatedWaitMinutes} minutes</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
            >
              <Icons.Printer className="w-4 h-4" />
              <span>Print Token Slip</span>
            </button>
            <button
              onClick={handleResetForNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>Next Walk-in</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900 text-xs">
              <Icons.AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {/* PATIENT SELECTION / REGISTRATION TOGGLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">1. Patient Identification</h2>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPatientMode("existing")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    patientMode === "existing"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode("new")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    patientMode === "new"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  + Rapid New Patient
                </button>
              </div>
            </div>

            {patientMode === "existing" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Search existing patients by name, MRN, or phone..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching patient found. Switch to &quot;Rapid New Patient&quot; above.
                    </div>
                  ) : (
                    filteredPatients.slice(0, 6).map((p) => {
                      const isSelected = selectedPatientId === p._id;
                      return (
                        <div
                          key={p._id}
                          onClick={() => setSelectedPatientId(p._id)}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer ${
                            isSelected ? "bg-teal-50 text-teal-900 font-semibold" : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800">{p.user?.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {p.mrn} • {p.user?.phone}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded bg-teal-600 text-white text-[10px]">
                              Selected
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Select</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as "male" | "female" | "other")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* DOCTOR & SPECIALTY SELECTION */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Attending Physician &amp; Room
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoctorId(doc._id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/40 ring-1 ring-teal-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {doc.roomNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-700 font-medium">{doc.specialty}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {doc.waitingCount} currently in queue
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISIT COMPLAINT & TRIAGE PRIORITY */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Triage &amp; Reason for Visit
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Chief Complaint / Symptoms <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Acute knee pain, sudden skin flare-up, high fever"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Triage Priority</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("normal")}
                    className={`flex-1 py-2 px-3 rounded-lg border font-semibold ${
                      priority === "normal"
                        ? "bg-[#00355f] text-white border-[#00355f]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("urgent")}
                    className={`flex-1 py-2 px-3 rounded-lg border font-semibold ${
                      priority === "urgent"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-rose-700 border-slate-200"
                    }`}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("vip")}
                    className={`flex-1 py-2 px-3 rounded-lg border font-semibold ${
                      priority === "vip"
                        ? "bg-purple-700 text-white border-purple-700"
                        : "bg-slate-50 text-purple-700 border-slate-200"
                    }`}
                  >
                    VIP
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Desk Intake Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal comments..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/reception/queue"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Assigning Token...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4" />
                  <span>Generate Walk-in Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
