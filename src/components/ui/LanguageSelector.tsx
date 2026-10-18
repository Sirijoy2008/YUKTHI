'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n';

interface LanguageSelectorProps {
  variant?: 'compact' | 'expanded' | 'minimal';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = languages.find((l) => l.code === language) || languages[0];

  if (variant === 'expanded') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
              language === lang.code
                ? 'bg-[#0F2744] text-white shadow-xs'
                : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F0F7FF] hover:border-[#93C5FD] hover:text-[#0F2744]'
            }`}
          >
            <span>{lang.nativeName}</span>
            <span className="text-[10px] opacity-75">({lang.label})</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F2744] hover:bg-[#F0F7FF] hover:border-[#93C5FD] transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4 text-[#0284C7]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span className="font-bold">{currentOption.nativeName}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                language === lang.code
                  ? 'bg-[#F0F7FF] font-bold text-[#0F2744] border-l-2 border-[#0284C7]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F2744]'
              }`}
            >
              <div>
                <span className="block font-medium">{lang.nativeName}</span>
                <span className="text-[10px] text-[#94A3B8]">{lang.label}</span>
              </div>
              {language === lang.code && (
                <svg className="w-4 h-4 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
