'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

const join = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const BUTTONS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-border bg-surface text-foreground hover:bg-raised',
  danger: 'border border-danger bg-danger-soft text-danger hover:opacity-90',
  ghost: 'text-primary hover:bg-primary-soft',
};

export function Button({
  variant = 'secondary',
  small = false,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean }) {
  return (
    <button
      type={type}
      className={join(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        small ? 'px-2.5 py-1 text-sm' : 'px-4 py-2',
        BUTTONS[variant],
        className,
      )}
      {...props}
    />
  );
}

const FIELD =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none';

function Labelled({
  label,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = { label: string; hint?: string; error?: string | null };

export function TextField({
  label,
  hint,
  error,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint} error={error}>
      <input id={id} className={join(FIELD, className)} aria-invalid={!!error} {...props} />
    </Labelled>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint} error={error}>
      <textarea id={id} className={join(FIELD, 'font-mono text-sm', className)} {...props} />
    </Labelled>
  );
}

export function SelectField({
  label,
  hint,
  error,
  options,
  className,
  ...props
}: FieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly { value: string; label: string }[];
  }) {
  const id = useId();
  return (
    <Labelled id={id} label={label} hint={hint} error={error}>
      <select id={id} className={join(FIELD, className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Labelled>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={join(
        'flex flex-col gap-4 rounded-lg border border-border bg-surface p-5',
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-raised text-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={join(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Notice({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={join('rounded-md px-4 py-3 text-sm', TONES[tone])}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      {intro ? <p className="max-w-3xl text-muted">{intro}</p> : null}
    </header>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, numeric = false }: { children?: ReactNode; numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={join(
        'border-b border-border bg-raised px-3 py-2 font-medium text-muted',
        numeric ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric = false,
  className,
}: {
  children?: ReactNode;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={join(
        'border-b border-border px-3 py-2 align-top',
        numeric && 'text-right tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <p className="text-muted" role="status">
      {label}
    </p>
  );
}

export { join };
