import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { fieldClasses, Label } from "./Input";

/** Accessible native select with custom styling. options: [{ value, label }] or strings */
export default function Select({ label, error, options = [], placeholder, className, selectClassName, id, required, ...props }) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={!!error}
          className={cn(fieldClasses, "h-10 cursor-pointer appearance-none pr-10", error && "border-red-400", selectClassName)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
