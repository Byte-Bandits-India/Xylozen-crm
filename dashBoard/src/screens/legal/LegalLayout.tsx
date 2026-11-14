import type { ReactNode } from "react";

export const LEGAL_UPDATED = "November 14, 2026";
export const LEGAL_EMAIL = "xylozentechnologies@gmail.com";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-muted px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-xl bg-background p-8 shadow-sm space-y-5 text-sm leading-6 text-foreground [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
        <header>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Xylozen CRM · Last updated: {LEGAL_UPDATED}
          </p>
        </header>
        {children}
      </article>
    </div>
  );
}
