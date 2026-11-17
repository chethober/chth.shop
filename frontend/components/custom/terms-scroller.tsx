'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TermItem = {
  id: string; // Unique identifier for the section
  title: string; // Section title displayed in sidebar and content
  content: React.ReactNode; // React component or JSX for the content
};

interface TermSectionProps {
  term: TermItem;
  index: number;
  children: React.ReactNode;
  setActiveTerm: (index: number) => void;
}

const TermSection = ({
  term,
  index,
  children,
  setActiveTerm,
}: TermSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: 0.2,
    margin: '-80px 0px -40% 0px',
  });

  useEffect(() => {
    if (isInView) {
      setActiveTerm(index);
    }
  }, [isInView, index, setActiveTerm]);

  return (
    <div ref={ref} id={term.id} className="space-y-4 md:space-y-6 scroll-mt-28">
      {children}
    </div>
  );
};

export interface TermsScrollerProps {
  terms: TermItem[];
  className?: string;
}

/**
 * Long-form sections with a sticky table of contents that tracks the section in view, a reading
 * progress bar under the navbar, and sections that settle in as they scroll up (CSS scroll
 * timelines in app/globals.css: no script, and still where a browser lacks them). The page
 * gives the title (PageHeader).
 */
export const TermsScroller = ({
  terms,
  className,
}: TermsScrollerProps) => {
  const [activeTerm, setActiveTerm] = useState(0);

  const scrollToTerm = (id: string, index: number) => {
    setActiveTerm(index);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn("min-h-screen", className)}>
      {/* Reading progress, a hairline across the top of the window. */}
      <div aria-hidden className="read-progress fixed inset-x-0 top-0 z-[60] h-0.5 bg-foreground" />

      {/* Phones: the section in view, on the kit's glass, under the navbar. */}
      <div className="chth-glass sticky top-20 z-20 flex items-center justify-between rounded-full px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="h-2 w-2 rounded-full bg-foreground shrink-0 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground truncate">
            {terms[activeTerm]?.title || 'Section'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {activeTerm + 1}/{terms.length}
        </span>
      </div>

      <div className="relative mb-[30vh] flex gap-12 py-8 md:py-10">
        {/* Sticky table of contents (md and up): a hairline track with a marker on the section in view. */}
        <ul className="sticky top-24 hidden h-fit w-full max-w-[240px] shrink-0 space-y-3 border-l border-border md:block">
          {terms.map((term, index) => {
            const isActive = activeTerm === index;
            return (
              <li key={term.id} className="relative cursor-pointer pl-4">
                {/* Active Indicator Bar */}
                {isActive && (
                  <motion.span
                    layoutId="active-term"
                    className="bg-foreground absolute -left-[1.5px] top-1/2 inline-block h-6 w-[3px] -translate-y-1/2 rounded-full z-10 shadow-xs"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <a
                  href={`#${term.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTerm(term.id, index);
                  }}
                  className="block"
                >
                  <p
                    className={cn(
                      'text-sm transition-all duration-200 select-none',
                      isActive
                        ? 'font-semibold text-foreground opacity-100 translate-x-0.5'
                        : 'text-muted-foreground opacity-55 hover:opacity-100 hover:text-foreground'
                    )}
                  >
                    {term.title}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Content Sections */}
        <div className="flex min-w-0 flex-1 flex-col gap-12 md:gap-14">
          {terms.map((term, index) => (
            <TermSection
              key={term.id}
              term={term}
              index={index}
              setActiveTerm={setActiveTerm}
            >
              <div className="settle-in space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
                  {term.title}
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {term.content}
                </div>
              </div>
            </TermSection>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsScroller;
