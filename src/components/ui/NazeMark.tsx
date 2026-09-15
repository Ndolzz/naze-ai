/**
 * The Naze identity mark: two offset arcs orbiting a core dot, rendered in
 * the two-tone accent gradient. Used as the AI avatar in chat, the sidebar
 * mark, and loading/thinking states (spec §25) — never as a decorative
 * sticker, always as a stand-in for "Naze is here / Naze is speaking".
 */
export default function NazeMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="naze-mark-grad" x1="4" y1="4" x2="28" y2="28">
          <stop offset="0" stopColor="var(--naze-accent)" />
          <stop offset="1" stopColor="var(--naze-accent-2)" />
        </linearGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="url(#naze-mark-grad)"
        strokeWidth="2"
        strokeDasharray="52 30"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4.5" fill="url(#naze-mark-grad)" />
    </svg>
  );
}
