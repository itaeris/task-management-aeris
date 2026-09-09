export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="brand-pipe" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
      </defs>
      <rect x="4.2" y="3.4" width="9.2" height="25.2" rx="4.6" stroke="url(#brand-pipe)" strokeWidth="2.5" />
      <rect x="18.6" y="3.4" width="9.2" height="14.6" rx="4.6" stroke="url(#brand-pipe)" strokeWidth="2.5" />
    </svg>
  );
}
