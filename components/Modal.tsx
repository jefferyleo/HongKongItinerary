"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const w = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-[#14161b]/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`glass relative w-full ${w} max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-[20px]`}
      >
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-line)]">
          <h2 id="modal-title" className="text-[15px] sm:text-base font-semibold tracking-tight truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="t-faint hover:text-[var(--color-ink)] transition rounded-full p-1 -mr-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--color-line)] flex-wrap">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/* —— form primitives —— */

const labelCls = "block text-[11px] uppercase tracking-[0.16em] t-faint mb-1";
const inputCls =
  "w-full rounded-lg border border-[var(--color-line)] bg-white/70 px-3 py-2 text-[14px] " +
  "outline-none transition focus:border-[#14161b]/40 focus:bg-white focus:ring-2 focus:ring-[#14161b]/8";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 2} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Btn({
  variant = "ghost",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base = "rounded-full px-4 py-2 text-[13px] font-medium transition";
  const v =
    variant === "primary"
      ? "bg-[#14161b] text-white hover:bg-[#000] active:scale-[0.98]"
      : variant === "danger"
      ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
      : "bg-white/60 t-soft border border-[var(--color-line)] hover:bg-white";
  return <button {...props} className={`${base} ${v} ${props.className ?? ""}`} />;
}
