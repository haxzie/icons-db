import Image from "next/image";
import { renderInline, toIconifyIcon } from "@icons-db/core";
import { getIcon } from "@/lib/db";
import { presetIconFor } from "@/lib/auth/client-logos";
import { LogoInitial, RemoteLogo } from "./RemoteLogo";

/**
 * The two parties to the grant, as a pair of overlapping tilted cards: IconsDB
 * behind on the left, the requesting app in front on the right. Showing both
 * makes it obvious *which* account is being connected to *which* app, which is
 * the one thing a consent screen has to get across at a glance.
 */
export async function ConsentCards({ clientName, logoUrl }: { clientName: string; logoUrl: string | null }) {
  return (
    <div className="flex items-center justify-center">
      <Card className="translate-x-2 -rotate-[9deg]">
        <Image src="/logo.svg" alt="IconsDB" width={40} height={40} priority className="size-10" />
      </Card>
      <Card className="z-10 -translate-x-2 rotate-[9deg]">
        <AppLogo clientName={clientName} logoUrl={logoUrl} />
      </Card>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`grid size-[68px] place-items-center rounded-2xl border border-line bg-bg-elevated shadow-[0_6px_18px_rgba(32,33,36,.16)] dark:shadow-[0_6px_18px_rgba(0,0,0,.5)] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Preset icon for apps we know, the client's own logo otherwise, initial last. */
async function AppLogo({ clientName, logoUrl }: { clientName: string; logoUrl: string | null }) {
  const preset = presetIconFor(clientName);
  if (preset) {
    const icon = await getIcon(preset.prefix, preset.name);
    if (icon) {
      const { viewBox, body } = renderInline(toIconifyIcon(icon));
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          className="size-10"
          role="img"
          aria-label={clientName}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      );
    }
  }
  if (logoUrl) return <RemoteLogo src={logoUrl} name={clientName} />;
  return <LogoInitial name={clientName} />;
}
