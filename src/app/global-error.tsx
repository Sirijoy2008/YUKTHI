'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[YUKTHI Root Global Error]:', error);
    }
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#F8FAFC] text-[#0F2744] flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-3xl">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#0F2744]">
              Application Error
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              A critical display issue occurred. Your account information and transactions remain completely safe.
            </p>
          </div>

          {error.digest && (
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 text-xs font-mono text-[#64748B]">
              Ref: {error.digest}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F2744] text-white text-xs font-bold hover:bg-[#1E3A8A] transition-colors cursor-pointer"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="text-xs text-[#0284C7] font-semibold hover:underline"
            >
              Return to YUKTHI Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
