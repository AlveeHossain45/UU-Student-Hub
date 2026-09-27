import { useId } from "react";
import { cn } from "../../utils/cn";

export const fieldClasses =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-600 dark:bg-ink-850 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-400 dark:focus:ring-brand-400/15";

export function Label({ htmlFor, children, required, className }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300", className)}>
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function FieldMessage({ id, error, hint }) {
  if (error)
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={id} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {hint}
      </p>
    );
  return null;
}

export default function Input({ label, error, hint, icon: Icon, rightElement, className, inputClassName, id, required, ref, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error || hint ? msgId : undefined}
          className={cn(
            fieldClasses,
            "h-10",
            Icon && "pl-10",
            rightElement && "pr-11",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/60",
            inputClassName
          )}
          {...props}
        />
        {rightElement && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  );
}

export function Textarea({ label, error, hint, className, id, required, rows = 3, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(fieldClasses, "resize-none py-2.5", error && "border-red-400")}
        {...props}
      />
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  );
}
