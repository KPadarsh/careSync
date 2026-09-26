"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  mrn: string;
  gender: string;
  bloodGroup: string;
  dateOfBirth?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    expiryDate: string;
  };
  primaryDoctor?: {
    name: string;
    specialty: string;
  };
}

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Editable fields
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [emergName, setEmergName] = useState("");
  const [emergRel, setEmergRel] = useState("");
  const [emergPhone, setEmergPhone] = useState("");
  const [insProvider, setInsProvider] = useState("");
  const [insPolicy, setInsPolicy] = useState("");
  const [insGroup, setInsGroup] = useState("");

  useEffect(() => {
    fetch("/api/patient/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          const p = data.profile;
          setProfile(p);
          setPhone(p.phone || "");
          setStreet(p.address?.street || "");
          setCity(p.address?.city || "");
          setState(p.address?.state || "");
          setPostalCode(p.address?.postalCode || "");
          setEmergName(p.emergencyContact?.name || "");
          setEmergRel(p.emergencyContact?.relationship || "");
          setEmergPhone(p.emergencyContact?.phone || "");
          setInsProvider(p.insurance?.provider || "");
          setInsPolicy(p.insurance?.policyNumber || "");
          setInsGroup(p.insurance?.groupNumber || "");
        }
      })
      .catch((err) => console.error("Error loading profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          address: { street, city, state, postalCode },
          emergencyContact: { name: emergName, relationship: emergRel, phone: emergPhone },
          insurance: { provider: insProvider, policyNumber: insPolicy, groupNumber: insGroup },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile");
      } else {
        setSuccessMessage("Profile information updated successfully.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Patient Profile</h2>
        <p className="text-sm text-[#45464d] mt-1">
          Review clinical demographic records and manage authorized contact and insurance information.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity & Clinical Header Card */}
        <Card className="p-6 border border-[#e2e8f0] shadow-sm space-y-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#eff4ff] border-2 border-[#131b2e]/20 flex items-center justify-center text-xl font-bold text-[#131b2e]">
                {profile?.name
                  ? profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "RK"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0b1c30]">{profile?.name}</h3>
                <p className="text-xs text-[#45464d]">
                  Medical Record Number: <strong className="font-mono text-[#0b1c30]">{profile?.mrn}</strong>
                </p>
                <p className="text-xs text-[#006a61] font-medium mt-0.5">
                  Primary Physician: {profile?.primaryDoctor?.name || "Dr. Anjali Menon"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#86f2e4]/30 text-[#006f66] rounded-full text-xs font-bold">
                Blood Group: {profile?.bloodGroup}
              </span>
            </div>
          </div>

          {/* Sensitive Identity Fields (Read-Only per Security Rule) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#006a61] uppercase tracking-wider">
                Clinical Identity (Restricted)
              </h4>
              <span className="text-[11px] text-[#45464d] flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Restricted by Medical Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#eff4ff]/60 border border-[#dce9ff] rounded-lg">
                <span className="text-[11px] text-[#45464d] block">Legal Name</span>
                <span className="text-xs font-bold text-[#0b1c30]">{profile?.name}</span>
              </div>
              <div className="p-3 bg-[#eff4ff]/60 border border-[#dce9ff] rounded-lg">
                <span className="text-[11px] text-[#45464d] block">Account Email</span>
                <span className="text-xs font-bold text-[#0b1c30]">{profile?.email}</span>
              </div>
              <div className="p-3 bg-[#eff4ff]/60 border border-[#dce9ff] rounded-lg">
                <span className="text-[11px] text-[#45464d] block">Blood Type</span>
                <span className="text-xs font-bold text-[#0b1c30]">{profile?.bloodGroup}</span>
              </div>
            </div>
          </div>

          {/* Contact Details (Editable) */}
          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
            <h4 className="text-xs font-bold text-[#006a61] uppercase tracking-wider">
              Contact &amp; Residential Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">State &amp; Postal Code</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={state}
                    placeholder="State"
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                  />
                  <input
                    type="text"
                    value={postalCode}
                    placeholder="Zip"
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact (Editable) */}
          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
            <h4 className="text-xs font-bold text-[#006a61] uppercase tracking-wider">
              Emergency Contact Record
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Contact Name</label>
                <input
                  type="text"
                  value={emergName}
                  onChange={(e) => setEmergName(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Relationship</label>
                <input
                  type="text"
                  value={emergRel}
                  onChange={(e) => setEmergRel(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Emergency Phone</label>
                <input
                  type="text"
                  value={emergPhone}
                  onChange={(e) => setEmergPhone(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
            </div>
          </div>

          {/* Primary Health Insurance (Editable) */}
          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
            <h4 className="text-xs font-bold text-[#006a61] uppercase tracking-wider">
              Health Insurance Coverage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={insProvider}
                  onChange={(e) => setInsProvider(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Policy / Member ID</label>
                <input
                  type="text"
                  value={insPolicy}
                  onChange={(e) => setInsPolicy(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0b1c30] mb-1">Group Number</label>
                <input
                  type="text"
                  value={insGroup}
                  onChange={(e) => setInsGroup(e.target.value)}
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2 text-xs text-[#0b1c30]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#131b2e] text-white text-xs font-bold rounded-lg hover:bg-[#213145] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile Updates"}
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
