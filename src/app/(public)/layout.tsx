import { getDashboard } from "@/lib/data";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { goals, config } = await getDashboard();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader
        title={config.site_title}
        subtitle={config.site_subtitle}
        colors={goals.map((g) => g.color)}
        lastUpdated={config.last_updated}
      />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      <footer className="border-t bg-background">
        <div className="flex w-full flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {config.framework_name && <span className="font-medium text-foreground">{config.framework_name}</span>}
            {config.org_name && <span>{config.org_name}</span>}
            {config.contact && <span>{config.contact}</span>}
            {config.last_updated && <span>최종 갱신 {config.last_updated}</span>}
          </div>
          {config.footer_note && <p>{config.footer_note}</p>}
        </div>
      </footer>
    </div>
  );
}
