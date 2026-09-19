"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { CollectionMeta, IconRecord } from "@icons-db/core";
import { primeIcon } from "@/lib/icon-store";
import { useKeywordIndex } from "@/lib/use-search-index";
import { IconDetail } from "./IconDetail";

export function IconPage({ icon, collection, svg }: { icon: IconRecord; collection: CollectionMeta; svg: string }) {
  const router = useRouter();
  const index = useKeywordIndex();
  useEffect(() => {
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
        <div
          className="flex aspect-square max-h-[420px] items-center justify-center rounded-2xl border bg-bg-elevated [&>svg]:size-40 md:max-h-[520px]"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
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
          <dt className="text-fg-subtle">Viewbox</dt>
          <dd className="font-mono">
            {icon.width}×{icon.height}
          </dd>
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
        index={index}
        collection={collection}
        onSelect={(p, n) => router.push(`/icon/${p}/${n}`)}
      />
    </div>
  );
}
