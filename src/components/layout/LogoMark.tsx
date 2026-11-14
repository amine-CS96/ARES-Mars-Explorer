/** ARES brand mark — Mars disc with an orbital ring. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="17" fill="var(--color-accent)" />
      <path
        d="M22 26.5c2.2-1.1 4.4-1.6 6.6-1.4 3 .3 5.4 1.8 8.6 1.6 1.9-.1 3.7-.7 5.5-1.8"
        stroke="var(--color-space)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M24.5 36c2.8-.9 5.4-1 7.9-.3 2.4.7 4.7 1 7-.1"
        stroke="var(--color-space)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="10"
        fill="none"
        stroke="var(--color-cyan)"
        strokeWidth="1.6"
        opacity="0.85"
        transform="rotate(-18 32 32)"
      />
      <circle cx="52.5" cy="25.5" r="2.6" fill="var(--color-cyan)" />
    </svg>
  )
}
