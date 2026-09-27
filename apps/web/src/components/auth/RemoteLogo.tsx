"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * A client's registered `logo_uri`. Only used for apps missing from the preset
 * in lib/auth/client-logos.ts, because the URL is whatever the client put in its
 * registration: it can be stale or dead, and it points at a host we don't
 * control. `unoptimized` keeps it away from the image optimizer and
 * `no-referrer` stops that host from learning who is authorizing.
 */
export function RemoteLogo({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false);

  // onError alone isn't enough: the server renders the <img>, so a load failure
  // usually happens before hydration and React never replays that event. The
  // ref runs after hydration and catches an image that already gave up.
  const checkLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  if (broken) return <LogoInitial name={name} />;

  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      unoptimized
      // First thing on a page the user must read before acting — lazy-loading
      // leaves an empty card during the decision.
      priority
      referrerPolicy="no-referrer"
      ref={checkLoaded}
      onError={() => setBroken(true)}
      className="size-10 object-contain"
    />
  );
}

export function LogoInitial({ name }: { name: string }) {
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-lg font-medium text-accent">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
