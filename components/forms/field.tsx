import type { ReactNode } from "react";

export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {description ? <span className="text-xs leading-5 text-muted-foreground">{description}</span> : null}
    </label>
  );
}

export const inputClassName =
  "h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export const selectClassName =
  "h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export const checkboxClassName = "size-4 rounded border accent-foreground";
