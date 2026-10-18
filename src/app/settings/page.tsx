'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useUserSession } from '@/hooks/useUserSession';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function SettingsPage() {
  const { userId, userName, changeUserId, changeUserName } = useUserSession();
  const [inputUserId, setInputUserId] = useState(userId);
  const [inputUserName, setInputUserName] = useState(userName);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  useEffect(() => {
    setInputUserId(userId);
    setInputUserName(userName);
  }, [userId, userName]);

  useEffect(() => {
    apiClient.health
      .check()
      .then((res) => {
        if (res.success && res.data?.status) {
          setHealthStatus(res.data.status);
        } else {
          setHealthStatus('Degraded / Offline');
        }
      })
      .catch(() => {
        setHealthStatus('Offline');
      });
  }, []);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUserId.trim()) {
      changeUserId(inputUserId.trim());
    }
    if (inputUserName.trim()) {
      changeUserName(inputUserName.trim());
    }
    setStatusMessage(
      `Session updated: Greeting set to "${inputUserName.trim() || userName}" (${inputUserId.trim() || userId}).`
    );
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <PageHeader
          title="My Account"
          description="Manage your profile and account preferences."
          breadcrumbs={[{ label: 'My Account' }]}
        />

        {statusMessage && (
          <Alert variant="success" onClose={() => setStatusMessage(null)}>
            {statusMessage}
          </Alert>
        )}

        {/* User Identity Session Management */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs hover:border-[#93C5FD] transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-base font-bold text-[#0F2744]">Active Session Identity & Greeting</h2>
              <p className="text-xs text-[#64748B]">
                Your display name is greeted on the dashboard and shown in the top navigation bar.
              </p>
            </div>
            <Badge variant="info">Active User: {userName}</Badge>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Greeting Display Name"
                description="The name greeted on the dashboard (e.g. Sirijoy, Rahul)."
              >
                <Input
                  value={inputUserName}
                  onChange={(e) => setInputUserName(e.target.value)}
                  placeholder="Enter User Name"
                />
              </FormField>

              <FormField
                label="Session User ID"
                description="Passed as x-user-id for tenant & backend data isolation."
              >
                <Input
                  value={inputUserId}
                  onChange={(e) => setInputUserId(e.target.value)}
                  placeholder="Enter User ID"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit">
                Save & Update Greeting
              </Button>
            </div>
          </form>
        </div>

        {/* Language & Identity Verification Settings */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs hover:border-[#93C5FD] transition-all duration-200 space-y-4">
          <h2 className="text-base font-bold text-[#0F2744] pb-3 border-b border-[#F1F5F9]">
            Language & Identity Verification
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-xs text-[#0F2744] block">
                  Interface Language
                </span>
                <span className="text-xs text-[#64748B]">
                  Select your preferred language across Yukthi forms, prompts, and navigation.
                </span>
              </div>
              <LanguageSelector variant="expanded" />
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-xs text-[#0F2744] block">
                  Aadhaar Identity Verification (KYC)
                </span>
                <span className="text-xs text-[#64748B]">
                  Verify your identity via authorized DigiLocker / UIDAI ASA provider gateway.
                </span>
              </div>
              <Link href="/verify-aadhaar">
                <Button variant="outline" size="sm">
                  View KYC Status &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Regional & Financial Preferences */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
            Market & Regulatory Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Target Market</span>
              <span className="text-[#64748B]">India (IN) · RBI & NPCI Guidelines</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Currency & Precision</span>
              <span className="text-[#64748B]">Indian Rupee (INR ₹) · Integer Minor Units (Paise)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Timezone</span>
              <span className="text-[#64748B]">Asia/Kolkata (IST · UTC+5:30)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="font-semibold text-[#0F172A] block">API Health Status</span>
              <span className="flex items-center gap-1.5 font-medium text-[#059669]">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                {healthStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy & Security Disclosures */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#334155]">
            Security & Compliance Safeguards
          </h2>
          <ul className="text-xs text-[#475569] space-y-2 list-disc pl-4 leading-relaxed">
            <li>
              <strong>No Credential Ingestion:</strong> YUKTHI never requests, logs, or stores banking passwords, debit card PINs, or SMS OTPs.
            </li>
            <li>
              <strong>Safe Error Boundary:</strong> Database connection strings and PostgreSQL internal traces are sanitized before sending API responses.
            </li>
            <li>
              <strong>Zero False Solvency:</strong> Unconfirmed incoming receipts are kept strictly segregated from primary available balances in calculations.
            </li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
