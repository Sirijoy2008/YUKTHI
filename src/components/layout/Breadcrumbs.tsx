import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#64748B] ${className}`}>
      <ol className="inline-flex items-center space-x-1.5">
        <li>
          <Link href="/dashboard" className="hover:text-[#0F2744] transition-colors">
            Dashboard
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center space-x-1.5">
            <svg
              className="w-3.5 h-3.5 text-[#94A3B8]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href ? (
              <Link href={item.href} className="hover:text-[#0F2744] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#0F2744]" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
