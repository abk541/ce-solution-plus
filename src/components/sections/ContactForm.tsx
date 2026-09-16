'use client';

import { useRef, useState } from 'react';

import { MagneticAction } from '@/components/ui/MagneticAction';
import { company, contact } from '@/content/site';
import { cn } from '@/lib/cn';

type Status = 'idle' | 'sending' | 'sent' | 'draft' | 'error';

type Fields = {
  name: string;
  organization: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
};

const EMPTY: Fields = {
  name: '',
  organization: '',
  email: '',
  phone: '',
  interest: contact.interests[0],
  message: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

const fieldClass =
  'peer w-full border-b border-ink-600 bg-transparent pb-3 pt-2 text-[0.95rem] text-paper outline-none transition-[border-color,box-shadow] duration-[var(--motion-micro)] placeholder:text-steel-400/70 hover:border-ink-500 focus:border-accent focus:shadow-[0_1px_0_var(--color-accent)]';

export function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  // Bots fill hidden inputs; humans never see this one.
  const honeypotRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Fields) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    if (status === 'error') setStatus('idle');
  };

  const validate = () => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = 'Required';
    if (!fields.email.trim()) next.email = 'Required';
    else if (!EMAIL_RE.test(fields.email.trim())) next.email = 'Enter a valid email address';
    if (fields.message.trim().length < 10) next.message = 'Tell us a little more (10+ characters)';
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
    }
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypotRef.current?.value) return;
    if (!validate()) return;

    setStatus('sending');

    if (!ENDPOINT) {
      // Static-host fallback: hand off to the user's mail client, pre-filled.
      const body = [
        `Name: ${fields.name}`,
        `Organization: ${fields.organization || '—'}`,
        `Email: ${fields.email}`,
        `Phone: ${fields.phone || '—'}`,
        `Interest: ${fields.interest}`,
        '',
        fields.message,
      ].join('\n');
      window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(
        `Inquiry — ${fields.interest}`,
      )}&body=${encodeURIComponent(body)}`;
      setStatus('draft');
      return;
    }

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('sent');
      setFields(EMPTY);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent' || status === 'draft') {
    return (
      <div
        role="status"
        className="relative flex min-h-[26rem] flex-col justify-center border border-ink-700 bg-ink-900/60 p-10"
      >
        <span className="label-mono text-[0.62rem] text-accent">
          {status === 'sent' ? 'Transmission logged' : 'Email draft ready'}
        </span>
        <p className="mt-6 font-grotesk text-2xl font-bold tracking-tight text-paper">
          {status === 'sent' ? 'Your requirement is with us.' : 'Review, then send.'}
        </p>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-steel-300">
          {status === 'sent'
            ? 'A member of the team will respond directly. If it is time-critical, call the number listed and say so.'
            : 'Your email draft is ready. Review it in your mail app, then send it.'}
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 self-start label-mono text-[0.62rem] text-steel-400 underline underline-offset-8 transition-colors duration-[var(--motion-micro)] hover:text-accent"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="relative">
      {Object.values(errors).some(Boolean) ? (
        <p role="alert" className="mb-7 border-l-2 border-signal-bright pl-4 text-sm text-signal-bright">
          Check the highlighted fields before continuing.
        </p>
      ) : null}
      <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
        <Field
          index="01"
          label="Name"
          required
          value={fields.name}
          onChange={set('name')}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          index="02"
          label="Organization"
          value={fields.organization}
          onChange={set('organization')}
          autoComplete="organization"
        />
        <Field
          index="03"
          label="Email"
          type="email"
          required
          value={fields.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          index="04"
          label="Phone"
          type="tel"
          value={fields.phone}
          onChange={set('phone')}
          autoComplete="tel"
        />

        <div data-contact-field className="group/field sm:col-span-2">
          <FieldLabel index="05" htmlFor="interest">
            Area of interest
          </FieldLabel>
          <select
            id="interest"
            name="interest"
            value={fields.interest}
            onChange={(event) => set('interest')(event.target.value)}
            className={cn(fieldClass, 'appearance-none')}
          >
            {contact.interests.map((option) => (
              <option key={option} value={option} className="bg-ink-900 text-paper">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div data-contact-field className="group/field sm:col-span-2">
          <FieldLabel index="06" htmlFor="message" required>
            Requirement
          </FieldLabel>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={fields.message}
            onChange={(event) => set('message')(event.target.value)}
            aria-invalid={errors.message ? 'true' : undefined}
            aria-describedby={errors.message ? 'message-error' : undefined}
            placeholder="Scope, location, timeline, contract vehicle — whatever you have."
            className={cn(fieldClass, 'resize-y', errors.message && 'border-signal')}
          />
          {errors.message ? (
            <p id="message-error" className="mt-2 label-mono text-[0.58rem] text-signal-bright">
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={honeypotRef}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
      />

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <MagneticAction type="submit" variant="solid" disabled={status === 'sending'}>
          {status === 'sending'
            ? 'Sending'
            : ENDPOINT
              ? 'Send requirement'
              : 'Open email draft'}
        </MagneticAction>
        <p className="max-w-xs label-mono text-[0.58rem] leading-relaxed text-steel-400">
          {ENDPOINT ? 'Encrypted in transit' : 'Opens your mail client'} — no sensitive or
          classified information.
        </p>
      </div>

      {status === 'error' ? (
        <p role="alert" className="mt-6 label-mono text-[0.6rem] text-signal-bright">
          Send failed. Email {company.email} directly.
        </p>
      ) : null}
    </form>
  );
}

function FieldLabel({
  index,
  htmlFor,
  required,
  children,
}: {
  index: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-3 flex items-center gap-3 label-mono text-[0.58rem] text-steel-400 transition-colors duration-[var(--motion-micro)] group-focus-within/field:text-paper"
    >
      <span className="text-accent tabular-nums">{index}</span>
      {children}
      {required ? <span className="text-signal-bright">*</span> : null}
    </label>
  );
}

function Field({
  index,
  label,
  value,
  onChange,
  error,
  type = 'text',
  required,
  autoComplete,
}: {
  index: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div data-contact-field className="group/field">
      <FieldLabel index={index} htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(fieldClass, error && 'border-signal')}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 label-mono text-[0.58rem] text-signal-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}
