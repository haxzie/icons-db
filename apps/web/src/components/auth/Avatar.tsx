"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * User avatar, falling back to the initial when there's no picture — or when
 * the picture fails to load. Avatars are mirrored into R2, so a key can go
 * missing (a bucket restore, a half-finished mirror); a broken image icon is a
 * worse answer than the initial.
 */
export function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);

  // The <img> is server-rendered, so a load failure usually happens before
  // hydration and React never replays onError. The ref runs after hydration and
  // catches an image that already gave up.
  const checkLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  if (!src || broken) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-accent-soft font-medium text-accent"
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.4) }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      ref={checkLoaded}
      onError={() => setBroken(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
