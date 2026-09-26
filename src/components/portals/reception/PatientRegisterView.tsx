"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icons } from "./ReceptionIcons";

const PatientFormSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid contact phone number"),
  mrn: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRel: z.string().optional(),
  emergencyPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergiesText: z.string().optional(),
});

type PatientFormData = z.infer<typeof PatientFormSchema>;

export function PatientRegisterView() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ mrn: string; id: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      gender: "male",
      bloodGroup: "O+",
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const allergies = data.allergiesText
        ? data.allergiesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/reception/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          allergies,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to register patient");
      }

      setSuccessInfo({
        mrn: json.patient.mrn,
        id: json.patient._id,
      });

      // Auto redirect to new patient profile after 1.5 seconds
      setTimeout(() => {
        router.push(`/reception/patients/${json.patient._id}`);
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/reception/patients" className="hover:text-teal-700">
              Patients
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">New Registration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Register Patient
          </h1>
          <p className="text-xs text-slate-500">
            Create an official electronic clinic record and medical record number (MRN).
          </p>
        </div>

        <Link
          href="/reception/patients"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors self-start"
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* SUCCESS BANNER */}
      {successInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
          <Icons.CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Patient Registered Successfully!</p>
            <p className="text-emerald-700 mt-0.5">
              Assigned Medical Record Number: <strong className="font-mono">{successInfo.mrn}</strong>. Redirecting to patient chart...
            </p>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900 text-xs">
          <Icons.AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Registration Error</p>
            <p className="text-rose-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* FORM CONTAINER */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Johnathan Doe"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                MRN (Leave blank to auto-generate)
              </label>
              <input
                type="text"
                {...register("mrn")}
                placeholder="e.g. MRN-84930"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("gender")}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Blood Group <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("bloodGroup")}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT & ADDRESS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="text-sm font-bold text-slate-900">Contact &amp; Residence</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="patient@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                {...register("street")}
                placeholder="e.g. 742 Evergreen Terrace"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  {...register("city")}
                  placeholder="Springfield"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  {...register("state")}
                  placeholder="OR"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...register("postalCode")}
                  placeholder="97477"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: EMERGENCY CONTACT */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h2 className="text-sm font-bold text-slate-900">Emergency Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Full Name
              </label>
              <input
                type="text"
                {...register("emergencyName")}
                placeholder="e.g. Mary Doe"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                {...register("emergencyRel")}
                placeholder="e.g. Spouse / Sibling / Parent"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                {...register("emergencyPhone")}
                placeholder="+1 (555) 987-6543"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: INSURANCE & ALLERGIES */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
              4
            </div>
            <h2 className="text-sm font-bold text-slate-900">Insurance &amp; Allergies</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                {...register("insuranceProvider")}
                placeholder="e.g. Blue Cross Blue Shield"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Policy / Member ID
              </label>
              <input
                type="text"
                {...register("insurancePolicyNumber")}
                placeholder="e.g. BC-98234-X"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Known Drug / Environmental Allergies (comma separated)
              </label>
              <input
                type="text"
                {...register("allergiesText")}
                placeholder="e.g. Penicillin, Peanuts, Latex, Codeine"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/reception/patients"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !!successInfo}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Record...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-4 h-4" />
                <span>Complete Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
