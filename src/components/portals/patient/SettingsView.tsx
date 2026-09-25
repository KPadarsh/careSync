"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function SettingsView() {
  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    reminders: true,
    labAlerts: true,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-h2 font-bold text-foreground tracking-tight">Portal Settings</h2>
        <p className="text-body text-muted-foreground mt-1">
          Manage your notification alerts, security credentials, and account preferences.
        </p>
      </div>

      {/* Notifications Settings */}
      <Card className="p-6 border border-border shadow-sm space-y-4">
        <h3 className="text-h4 font-bold text-foreground">Notification Preferences</h3>
        <p className="text-caption text-muted-foreground">Select how and when you receive automated clinical reminders.</p>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-surface-muted/40 cursor-pointer">
            <div>
              <p className="text-small font-semibold text-foreground">SMS Appointment Alerts</p>
              <p className="text-caption text-muted-foreground">Receive text messages 24 hours prior to scheduled visits.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-surface-muted/40 cursor-pointer">
            <div>
              <p className="text-small font-semibold text-foreground">Immediate Lab Results Notification</p>
              <p className="text-caption text-muted-foreground">Get alerted as soon as laboratory technicians upload verified findings.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.labAlerts}
              onChange={(e) => setNotifications({ ...notifications, labAlerts: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-surface-muted/40 cursor-pointer">
            <div>
              <p className="text-small font-semibold text-foreground">Email Monthly Health Summary</p>
              <p className="text-caption text-muted-foreground">Receive a confidential monthly digital copy of all medical activities.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* Security Credentials */}
      <Card className="p-6 border border-border shadow-sm space-y-4">
        <h3 className="text-h4 font-bold text-foreground">Account Security</h3>
        <p className="text-caption text-muted-foreground">Update your confidential password and two-factor authentication.</p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-small font-semibold text-foreground">Two-Factor Authentication (2FA)</p>
            <p className="text-caption text-muted-foreground">Enabled via Authenticator App</p>
          </div>
          <Button variant="outline" size="sm">
            Configure 2FA
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-small font-semibold text-foreground">Account Password</p>
            <p className="text-caption text-muted-foreground">Last modified 45 days ago</p>
          </div>
          <Button variant="outline" size="sm">
            Change Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
