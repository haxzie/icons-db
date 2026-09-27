import Image from "next/image";

/** User avatar, falling back to the initial when there's no picture. */
export function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  if (!src) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-medium text-accent"
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.4) }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <Image src={src} alt="" width={size} height={size} className="shrink-0 rounded-full" unoptimized />;
}
