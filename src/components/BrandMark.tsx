import { motion } from "framer-motion";

/**
 * The Dopamine mark: a D whose counter is a play triangle.
 *
 * Drawn as SVG rather than dropped in as the PNG so it stays sharp at every
 * size and each piece — bowl, counter, gold edge — can be animated on its own
 * for the cold open.
 */
export function BrandMark({
  size = 96,
  animated = false,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  // One gradient id per instance, or two marks on a page share (and fight over)
  // the same definition.
  const gid = `dop-grad-${size}-${animated ? "a" : "s"}`;
  const gold = `dop-gold-${size}-${animated ? "a" : "s"}`;

  const Body = animated ? motion.path : "path";
  const Counter = animated ? motion.path : "path";

  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      className={className}
      role="img"
      aria-label="Dopamine"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF005D" />
          <stop offset="55%" stopColor="#C42BC7" />
          <stop offset="100%" stopColor="#964AE3" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFBF29" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#FFBF29" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* The D: stem on the left, bowl swinging out to the right. The play
          triangle is a second subpath, cut out by the even-odd fill rule. */}
      <Body
        fillRule="evenodd"
        fill={`url(#${gid})`}
        d="M8 6 h44 a58 64 0 0 1 0 128 H8 Z
           M46 40 L92 70 L46 100 Z"
        {...(animated
          ? {
              initial: { opacity: 0, scale: 0.72 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
              style: { transformOrigin: "60px 70px" },
            }
          : {})}
      />

      {/* Gold edge, drawn on after the shape lands */}
      <Counter
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
        d="M8 6 h44 a58 64 0 0 1 0 128 H8 Z"
        {...(animated
          ? {
              initial: { pathLength: 0, opacity: 0 },
              animate: { pathLength: 1, opacity: 1 },
              transition: { duration: 1.1, delay: 0.35, ease: "easeInOut" as const },
            }
          : {})}
      />
    </svg>
  );
}
