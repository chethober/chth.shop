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
    margin: 'calc(-1 * var(--chth-space-80)) 0px -40% 0px',
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
  title?: string;
  terms: TermItem[];
  className?: string;
}

/** Long-form sections with a sticky table of contents that tracks the section in view. */
export const TermsScroller = ({
  title = "Terms & Conditions",
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
    <div className={cn("min-h-screen p-4 lg:p-12", className)}>
      <h1 className="pt-[40px] text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:pt-0">
        {title}
      </h1>

      {/* Mobile Active Section Pill (Visible below md) */}
      <div className="sticky top-20 z-20 mt-4 flex items-center justify-between rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 backdrop-blur-md md:hidden">
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

      <div className="relative mb-[50vh] flex gap-12 py-[40px] md:py-[80px]">
        {/* Sticky Sidebar Navigation (Visible on md and above) */}
        <ul className="border-border sticky top-24 hidden h-fit w-full max-w-[280px] space-y-4 border-l md:block shrink-0">
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
        <div className="flex flex-1 flex-col gap-[40px] md:gap-[60px] min-w-0">
          {terms.map((term, index) => (
            <TermSection
              key={term.id}
              term={term}
              index={index}
              setActiveTerm={setActiveTerm}
            >
              <h3 className="text-xl font-bold tracking-tight text-foreground lg:text-3xl">
                {term.title}
              </h3>
              <div className="text-muted-foreground leading-relaxed space-y-4 text-sm sm:text-base">
                {term.content}
              </div>
            </TermSection>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsScroller;
