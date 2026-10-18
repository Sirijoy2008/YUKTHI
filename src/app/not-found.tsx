import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#BAE6FD]/40 selection:text-[#0F2744]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-3xl shadow-xs">
          🔍
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
            HTTP 404 — Not Found
          </span>
          <h1 className="text-2xl font-black text-[#0F2744]">
            Page Not Found
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            The page or record you are looking for doesn&rsquo;t exist, was moved, or requires authentication.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left text-xs text-[#475569] space-y-2">
          <span className="font-bold text-[#0F2744] block">What you can do next:</span>
          <ul className="list-disc pl-4 space-y-1 text-[#64748B]">
            <li>Verify the web address you entered</li>
            <li>Return to your Dashboard to view active items</li>
            <li>Use the Scam Checker or Payment Help tools</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:flex-1">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center shadow-xs cursor-pointer"
            >
              Go to Dashboard
            </Button>
          </Link>

          <Link href="/" className="w-full sm:flex-1">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center cursor-pointer"
            >
              Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
