"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { rasterUrl, type CollectionMeta, type IconRecord } from "@icons-db/core";
import { primeIcon } from "@/lib/icon-store";
import { replaySmil } from "../IconGlyph";
import { IconDetail } from "./IconDetail";

export function IconPage({
  icon,
  collection,
  svg,
  variants,
  label,
}: {
  icon: IconRecord;
  collection: CollectionMeta;
  svg: string;
  variants: { name: string; style: string }[];
  label?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    if (icon.raster) {
      primeIcon(icon.prefix, icon.name, {
        raster: true,
        width: icon.width,
        height: icon.height,
        png: rasterUrl(icon.prefix, icon.name),
      });
      return;
    }
    primeIcon(icon.prefix, icon.name, {
      body: icon.body,
      width: icon.width,
      height: icon.height,
      left: icon.left,
      top: icon.top,
      rotate: icon.rotate,
      hFlip: icon.hFlip,
      vFlip: icon.vFlip,
    });
  }, [icon]);
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_420px]">
      <div>
        {icon.raster ? (
          <div className="flex aspect-square max-h-[420px] items-center justify-center rounded-2xl border bg-bg-elevated md:max-h-[520px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 PNG at a fixed size */}
            <img
              src={rasterUrl(icon.prefix, icon.name, { size: 512 })}
              alt={`${label ?? icon.name} app icon`}
              width={512}
              height={512}
              className="size-56 object-contain md:size-72"
            />
          </div>
        ) : (
          <div
            className="flex aspect-square max-h-[420px] items-center justify-center rounded-2xl border bg-bg-elevated [&>svg]:size-40 md:max-h-[520px]"
            onMouseEnter={(e) => replaySmil(e.currentTarget.querySelector("svg"))}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-subtle">Name</dt>
          <dd className="font-mono">{icon.name}</dd>
          <dt className="text-fg-subtle">Set</dt>
          <dd>{collection.name}</dd>
          <dt className="text-fg-subtle">Style</dt>
          <dd>{icon.style}</dd>
          {icon.category && (
            <>
              <dt className="text-fg-subtle">Category</dt>
              <dd>{icon.category}</dd>
            </>
          )}
          {icon.animated && (
            <>
              <dt className="text-fg-subtle">Animation</dt>
              <dd>Animated SVG (SMIL)</dd>
            </>
          )}
          <dt className="text-fg-subtle">{icon.raster ? "Format" : "Viewbox"}</dt>
          <dd className="font-mono">{icon.raster ? "PNG · 128/256/512/1024" : `${icon.width}×${icon.height}`}</dd>
          <dt className="text-fg-subtle">License</dt>
          <dd>{collection.license.title}</dd>
          {icon.aliases.length > 0 && (
            <>
              <dt className="text-fg-subtle">Aliases</dt>
              <dd className="font-mono text-xs">{icon.aliases.join(", ")}</dd>
            </>
          )}
        </dl>
      </div>
      <IconDetail
        variant="page"
        prefix={icon.prefix}
        name={icon.name}
        index={null}
        variants={variants}
        collection={collection}
        label={label}
        onSelect={(p, n) => router.push(`/icon/${p}/${n}`)}
      />
    </div>
  );
}
