"use client";

/**
 * Skeleton placeholder for the live bulletin masthead + tabs.
 * Matches the final layout's column heights so swapping in the real content
 * (when /platform/pulse goes live) does not cause layout shift (CLS).
 *
 * Uses the global `.skeleton` utility from globals.css.
 */
export function BulletinSkeleton() {
  return (
    <>
      <div className="auth-ed-masthead" aria-hidden>
        <div className="skeleton h-3 w-32" style={{ borderRadius: 4 }} />
        <div
          className="skeleton mt-3 h-9 w-[80%]"
          style={{ borderRadius: 6 }}
        />
        <div
          className="skeleton mt-2 h-9 w-[55%]"
          style={{ borderRadius: 6 }}
        />
      </div>

      <div className="auth-ed-tabs" aria-hidden>
        <div className="auth-ed-tabnav">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton mb-3 h-5 w-20"
              style={{ borderRadius: 4 }}
            />
          ))}
        </div>
        <div className="auth-ed-tabpanel flex flex-col gap-2 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton h-9 w-full"
              style={{ borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
