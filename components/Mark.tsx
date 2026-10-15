/** Logo Arus: kotak grafit dengan garis arus naik berujung aksen. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="var(--color-graphite)" />
      <path d="M7 21.5c3.2 0 3.6-7 7-7s3.8 5 7 5c1.6 0 2.7-1.2 4-3.5" fill="none" stroke="var(--color-on-graphite)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="16" r="2.6" fill="var(--color-accent-on-graphite)" />
    </svg>
  )
}
