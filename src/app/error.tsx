'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Technical log kept exclusively on server console/log collectors
    if (process.env.NODE_ENV !== 'production') {
      console.error('[YUKTHI Global Route Error]:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#BAE6FD]/40 selection:text-[#0F2744]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-3xl shadow-xs">
          ⚠️
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-[#0F2744]">
            Something went wrong
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            We encountered an unexpected problem loading this page. Your account data, transactions, and session are safe.
          </p>
        </div>

        {error.digest && (
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-[11px] font-mono text-[#64748B] break-all">
            Reference Code: <span className="text-[#0F2744] font-semibold">{error.digest}</span>
          </div>
        )}

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left text-xs text-[#475569] space-y-2">
          <span className="font-bold text-[#0F2744] block">What you can do next:</span>
          <ul className="list-disc pl-4 space-y-1 text-[#64748B]">
            <li>Click &ldquo;Try Again&rdquo; below to re-render the view</li>
            <li>Check your internet connection</li>
            <li>Return to your Dashboard to continue other tasks</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:flex-1 justify-center shadow-xs cursor-pointer"
          >
            Try Again
          </Button>

          <Link href="/dashboard" className="w-full sm:flex-1">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center cursor-pointer"
            >
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-2 text-[11px] text-[#94A3B8]">
          <Link href="/" className="text-[#0284C7] hover:underline">
            &larr; Return to YUKTHI Home
          </Link>
        </div>
      </div>
    </div>
  );
}
