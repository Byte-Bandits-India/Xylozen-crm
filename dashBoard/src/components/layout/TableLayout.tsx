import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TableLayoutProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onExport?: () => void;
  className?: string;
};

export function TableLayout({
  title,
  children,
  actions,
  onExport,
  className,
}: TableLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Export
            </button>
          )}
          {actions}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background">
        {children}
      </div>
    </div>
  );
}
