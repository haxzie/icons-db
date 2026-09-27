"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { submitSetAction } from "@/app/library/actions";
import { validateSubmission, type SubmissionErrors } from "@/lib/submissions";

const EMPTY = { repo: "", website: "", twitter: "" };

/**
 * "Submit a set", next to the library search box. Signed-out visitors are sent
 * to sign in and returned here; signed-in ones get the form, which posts to our
 * Slack channel for a manual look before anything is published.
 */
export function SubmitSetButton() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function onClick() {
    if (session) setOpen(true);
    else router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Submit a set
      </button>
      {open && <SubmitSetDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SubmitSetDialog({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<SubmissionErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // The dialog owns the screen; don't let the page scroll behind it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  function set(field: keyof typeof EMPTY, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    // Check here too, so an obvious typo never costs a round trip.
    const parsed = validateSubmission(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setPending(true);
    setFormError("");
    try {
      const result = await submitSetAction(values);
      if (result.ok) setDone(true);
      else {
        if (result.errors) setErrors(result.errors);
        if (result.error) setFormError(result.error);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="submit-set-title" className="w-full max-w-md rounded-2xl border bg-bg-elevated p-6 shadow-lg">
        {done ? (
          <>
            <h2 id="submit-set-title" className="text-lg font-medium">Thanks — we got it</h2>
            <p className="mt-2 text-sm text-fg-muted">
              We look at every submission by hand and add the ones that fit. Sets need a permissive licence (MIT, Apache-2.0, ISC or CC0).
            </p>
            <button type="button" onClick={onClose} className="mt-6 h-10 w-full rounded-full bg-accent text-sm font-medium text-white transition hover:opacity-90">
              Done
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <h2 id="submit-set-title" className="text-lg font-medium">Submit an icon set</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Tell us where to find it and we&apos;ll take a look. Open source sets only, with a permissive licence.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <Field ref={firstField} label="GitHub repository" required placeholder="https://github.com/owner/repo" value={values.repo} error={errors.repo} onChange={(v) => set("repo", v)} />
              <Field label="Website" hint="Optional" placeholder="https://example.com" value={values.website} error={errors.website} onChange={(v) => set("website", v)} />
              <Field label="Author on X" hint="Optional" placeholder="@handle" value={values.twitter} error={errors.twitter} onChange={(v) => set("twitter", v)} />
            </div>

            {formError && (
              <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={onClose} className="h-10 flex-1 rounded-full border text-sm font-medium transition hover:bg-bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="h-10 flex-1 rounded-full bg-accent text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
                {pending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  ref,
  label,
  hint,
  required,
  placeholder,
  value,
  error,
  onChange,
}: {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
  hint?: string;
  required?: boolean;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `submit-set-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-fg-subtle">{hint}</span>}
      </label>
      <input
        ref={ref}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 h-10 w-full rounded-lg border bg-bg px-3 text-sm outline-none transition focus:border-accent ${error ? "border-red-500" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
