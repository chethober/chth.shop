'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Trash2, Check, Undo2 } from 'lucide-react';
import './inline-confirm.css';

export type InlineConfirmProps = {
  /* corner — 0 to 22px */
  corner?: number;
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  deletedLabel?: string;
  undoLabel?: string;
  undoDuration?: number;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  onUndo?: () => void;
  className?: string;
  disabled?: boolean;
};

const DEFAULT_CORNER = 22;
const DEFAULT_UNDO_MS = 4000;

export function InlineConfirm({
  corner = DEFAULT_CORNER,
  label = 'Delete file',
  confirmLabel = 'Delete',
  cancelLabel = 'Keep',
  deletedLabel = 'Deleted',
  undoLabel = 'Undo',
  undoDuration = DEFAULT_UNDO_MS,
  onConfirm,
  onCancel,
  onUndo,
  className = '',
  disabled = false,
}: InlineConfirmProps) {
  const [phase, setPhase] = useState<'idle' | 'asking' | 'done'>('idle');
  const [idleWidth, setIdleWidth] = useState<number>(148);
  const timerRef = useRef<number | undefined>(undefined);
  const measureRef = useRef<HTMLSpanElement>(null);
  const isExecutingRef = useRef<boolean>(false);

  // Measure label dynamically so arbitrary texts like "Delete Artist Store" fit seamlessly
  useLayoutEffect(() => {
    if (measureRef.current) {
      // 16px left pad + 15px icon + 8px gap + text width + 16px right pad + 6px buffer
      const measured = Math.ceil(measureRef.current.getBoundingClientRect().width) + 55;
      setIdleWidth(Math.max(148, measured));
    }
  }, [label]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const clampedCorner = Math.min(22, Math.max(0, corner ?? DEFAULT_CORNER));

  const handleStartAsking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setPhase('asking');
  };

  const handleKeep = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase('idle');
    onCancel?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    setPhase('done');

    // Start fuse timer for undo
    timerRef.current = window.setTimeout(async () => {
      if (isExecutingRef.current) return;
      isExecutingRef.current = true;
      try {
        await onConfirm?.();
      } catch (err) {
        console.error('Error during confirmed action:', err);
      } finally {
        isExecutingRef.current = false;
        setPhase('idle');
      }
    }, undoDuration);
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setPhase('idle');
    onUndo?.();
  };

  const styleVariables = {
    '--say-r': `${clampedCorner}px`,
    '--idle-w': `${idleWidth}px`,
  } as React.CSSProperties;

  return (
    <div className={`say-well ${className}`.trim()} style={styleVariables}>
      {/* Hidden element for measuring custom label width */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          font: 'inherit',
          fontSize: '13px',
          fontWeight: 500,
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>

      <div className="say-shell gpane" data-phase={phase}>
        <div className="say-clip">
          {phase === 'idle' && (
            <button
              type="button"
              className="say-face"
              onClick={handleStartAsking}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={disabled}
              title={label}
            >
              <Trash2 size={15} strokeWidth={2} />
              <span>{label}</span>
            </button>
          )}

          {phase === 'asking' && (
            <>
              <button
                type="button"
                className="say-half"
                onClick={handleKeep}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {cancelLabel}
              </button>
              <span className="say-seam" />
              <button
                type="button"
                className="say-half"
                data-danger="true"
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {confirmLabel}
              </button>
            </>
          )}

          {phase === 'done' && (
            <>
              <span className="say-done">
                <Check size={14} strokeWidth={2} />
                <span>{deletedLabel}</span>
              </span>
              <button
                type="button"
                className="say-undo"
                onClick={handleUndo}
                onPointerDown={(e) => e.stopPropagation()}
                title="Undo deletion"
              >
                <Undo2 size={13} strokeWidth={2} />
                <span>{undoLabel}</span>
                <i
                  className="say-fuse"
                  style={{ animationDuration: `${undoDuration}ms` }}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


export default InlineConfirm;
