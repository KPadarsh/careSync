"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-h2 font-bold text-foreground tracking-tight">Patient Profile</h2>
        <p className="text-body text-muted-foreground mt-1">
          Review and update your personal demographic, insurance, and emergency contact records.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="p-6 border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-h3 font-bold text-primary">
            RK
          </div>
          <div>
            <h3 className="text-h4 font-bold text-foreground">Rahul Kumar</h3>
            <p className="text-caption text-muted-foreground">Patient ID: #PAT-2026-9041 • Registered Since Aug 2023</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-label font-bold text-primary uppercase tracking-wider">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue="Rahul Kumar" />
            <Input label="Date of Birth" defaultValue="1994-08-14" />
            <Input label="Gender" defaultValue="Male" />
            <Input label="Blood Group" defaultValue="O Positive (O+)" />
            <Input label="Primary Phone" defaultValue="+1 (555) 234-8901" />
            <Input label="Email Address" defaultValue="rahul.k@example.com" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="text-label font-bold text-primary uppercase tracking-wider">Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Name" defaultValue="Priya Kumar" />
            <Input label="Relationship" defaultValue="Spouse" />
            <Input label="Emergency Phone" defaultValue="+1 (555) 890-1234" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="text-label font-bold text-primary uppercase tracking-wider">Primary Insurance Policy</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Insurance Provider" defaultValue="BlueCross BlueShield Premier" />
            <Input label="Policy / Member ID" defaultValue="BCBS-8994-201A" />
            <Input label="Group Number" defaultValue="GRP-94021" />
            <Input label="Policy Status" defaultValue="Active / Verified" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
