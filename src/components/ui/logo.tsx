interface LogoProps {
  readonly className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={`font-display text-2xl font-bold tracking-tight text-primary ${className ?? ""}`}
    >
      Olympus
    </span>
  );
}
