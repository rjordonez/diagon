import React from "react";
import { useAuth } from "@/lib/AuthContext";

export const AuthSettingsPage = () => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="max-w-[640px] mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences</p>
      </div>

      <div className="bg-background rounded-lg border border-border p-4 md:p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold mb-4">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">First Name</label>
              <input type="text" defaultValue={firstName} className="form-input" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Last Name</label>
              <input type="text" defaultValue={lastName} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Email</label>
              <input type="email" defaultValue={user?.email || ""} className="form-input" disabled />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-base font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {["New document uploaded", "AI flag raised", "Speed to Lead reply received", "Stage changed", "Campaign status updated"].map((pref) => (
              <label key={pref} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-foreground rounded" />
                <span className="text-sm">{pref}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-base font-semibold mb-4">Speed to Lead Defaults</h3>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Default Mode</label>
            <select className="form-input max-w-xs">
              <option>Fully Automatic</option>
              <option>LO Approves</option>
              <option>LO Sends Manually</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="h-11 px-6 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
