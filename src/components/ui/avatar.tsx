"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { avatarColorFromId, initialsOf } from "@/lib/avatar";

interface AvatarProps {
  readonly src: string | null | undefined;
  readonly name: string;
  /** Identifier used to derive a deterministic fallback color. */
  readonly id: string;
  readonly size?: number;
  readonly className?: string;
}

/**
 * Avatar with graceful fallback:
 * - Renders the provided image when available.
 * - On missing/broken image, falls back to a colored circle with the user's
 *   first two initials. The color is derived deterministically from `id`,
 *   so the same lead always gets the same color.
 */
export function Avatar({
  src,
  name,
  id,
  size = 40,
  className,
}: AvatarProps) {
  const initials = initialsOf(name);
  const color = avatarColorFromId(id);

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src && (
        <AvatarPrimitive.Image
          alt={name}
          className="h-full w-full object-cover"
          src={src}
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-semibold text-white"
        style={{
          backgroundColor: color,
          fontSize: Math.max(10, Math.round(size * 0.38)),
        }}
        delayMs={src ? 300 : 0}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
