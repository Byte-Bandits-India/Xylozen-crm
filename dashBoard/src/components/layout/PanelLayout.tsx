import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelLayoutProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function PanelLayout({ title, children, className }: PanelLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <div className="rounded-lg border border-border bg-background p-6">
        {children}
      </div>
    </div>
  );
}
