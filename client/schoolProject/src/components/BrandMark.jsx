/**
 * BrandMark: the BrightPath Academy logo symbol.
 * An open book on a rounded tile, with a lime spark. Colours come from CSS
 * variables in index.css, so a new palette only needs changes there.
 *
 * variant "on-dark" inverts the tile for use on plum or charcoal backgrounds.
 */
export default function BrandMark({ variant = "default", className = "" }) {
  const classes = ["brand-mark", variant === "on-dark" ? "brand-mark--on-dark" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <rect className="brand-mark__tile" x="0" y="0" width="32" height="32" rx="9" />
        <path className="brand-mark__page-left" d="M16 11.2C13.3 9.5 10 9 7.2 9.6v12.6c2.8-.6 6.1-.1 8.8 1.6V11.2z" />
        <path className="brand-mark__page-right" d="M16 11.2c2.7-1.7 6-2.2 8.8-1.6v12.6c-2.8-.6-6.1-.1-8.8 1.6V11.2z" />
        <circle className="brand-mark__spark" cx="24.6" cy="6.6" r="2.4" />
      </svg>
    </span>
  );
}
