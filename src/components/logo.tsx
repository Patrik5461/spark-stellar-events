type LogoProps = {
  className?: string;
  title?: string;
};

/**
 * NU-U brand mark. Uses currentColor so it can inherit from the surrounding
 * text color (dark on light surfaces, light on dark surfaces).
 */
export function Logo({ className, title = "NU-U" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      width="100%"
      height="100%"
      role="img"
      aria-label={title}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <title>{title}</title>
      <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.7}>
        <line x1="400" y1="90" x2="400" y2="250" />
        <line x1="400" y1="550" x2="400" y2="710" />
      </g>
      <text
        x="400"
        y="455"
        textAnchor="middle"
        fontFamily="'Playfair Display', 'Cormorant Garamond', Didot, Baskerville, 'Times New Roman', serif"
        fontSize={170}
        fill="currentColor"
        letterSpacing={6}
      >
        nu-u
      </text>
    </svg>
  );
}
