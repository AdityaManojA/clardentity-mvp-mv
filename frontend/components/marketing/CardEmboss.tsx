/* The small mark in the empty middle of each landing card - phone layout
 * only. One shape per card, drawn as a fine outline in a slightly pink
 * hairline (the card border's colour with a touch of the accent). Nothing else on the card moves; the mark sits behind the
 * text in the space between the name and the blurb, so the card's fonts,
 * spacing and icon are exactly as designed. Colours come from the theme
 * tokens, so light, dark and every accent follow on their own.
 *
 * Shapes after the brief's references: sparkles, an orbit, a crescent, a
 * ringed planet, a flower, a guiding star, a scalloped circle, the faceted
 * compass star, and a sunburst. */

// Fine outline, slightly pink: no fill, a hairline in the card border's
// colour with a little of the accent mixed in - plum in light, pink in dark.
const FILL = "none";
const EDGE = "color-mix(in srgb, var(--border-strong) 60%, var(--brand))";
const CARD = "none";
// the card's own colour, where an outline must hide what passes behind it
const BEHIND = "var(--surface-muted)";
const LINE = 2.4; // in the 100-unit box: about 1.7px at the card's mark size

/** A four-point sparkle with long, thin arms. */
function spark(cx: number, cy: number, r: number): string {
  const a = r * 0.08, b = r * 0.14, w = r * 0.55;
  return `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + w} ${cy} C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - w} ${cy} C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r}Z`;
}

function sunburst(points: number, outer: number, inner: number): string {
  let d = "";
  for (let k = 0; k < points * 2; k++) {
    const angle = -Math.PI / 2 + (Math.PI * k) / points;
    const r = k % 2 ? inner : outer;
    d += `${k ? "L" : "M"}${(50 + Math.cos(angle) * r).toFixed(1)} ${(50 + Math.sin(angle) * r).toFixed(1)}`;
  }
  return d + "Z";
}

function scallop(bumps: number): string {
  let d = "";
  for (let k = 0; k <= bumps; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / bumps;
    const x = (50 + Math.cos(angle) * 34).toFixed(1);
    const y = (50 + Math.sin(angle) * 34).toFixed(1);
    if (k === 0) {
      d = `M${x} ${y}`;
      continue;
    }
    const mid = angle - Math.PI / bumps;
    d += ` Q${(50 + Math.cos(mid) * 50).toFixed(1)} ${(50 + Math.sin(mid) * 50).toFixed(1)} ${x} ${y}`;
  }
  return d + "Z";
}

function Pressed({ d }: { d: string }) {
  return <path d={d} style={{ fill: FILL, stroke: EDGE }} strokeWidth={LINE} strokeLinejoin="round" />;
}

/** An orbit: a soft band with a hairline edge. `front` draws only the near
 *  half, to pass in front of a planet. */
function Orbit({ rx, ry, tilt, front = false }: { rx: number; ry: number; tilt: number; front?: boolean }) {
  const d = front ? `M${50 - rx} 50 A${rx} ${ry} 0 0 0 ${50 + rx} 50` : null;
  return (
    <g transform={`rotate(${tilt} 50 50)`}>
      {d ? (
        <>
                    <path d={d} fill="none" style={{ stroke: EDGE }} strokeWidth={LINE} />
        </>
      ) : (
        <>
                    <ellipse cx={50} cy={50} rx={rx} ry={ry} fill="none" style={{ stroke: EDGE }} strokeWidth={LINE} />
        </>
      )}
    </g>
  );
}

const SHAPES: Record<string, React.ReactNode> = {
  knowing: <Pressed d={spark(50, 50, 46)} />,
  decision: (
    <>
      <Orbit rx={46} ry={13} tilt={-22} />
      <Pressed d={spark(38, 46, 28)} />
      <Pressed d={spark(68, 60, 15)} />
    </>
  ),
  thinking: (
    <>
      <Pressed d="M64 14 A36 36 0 1 0 86 72 A29 29 0 1 1 64 14Z" />
      <Pressed d={spark(38, 38, 15)} />
    </>
  ),
  learning: (
    <>
      <Orbit rx={46} ry={11} tilt={-18} />
      <circle cx={50} cy={50} r={24} style={{ fill: BEHIND, stroke: EDGE }} strokeWidth={LINE} />
      <Orbit rx={46} ry={11} tilt={-18} front />
    </>
  ),
  creative: (
    <>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={50} cy={29} rx={11} ry={20} transform={`rotate(${a} 50 50)`} style={{ fill: FILL, stroke: EDGE }} strokeWidth={LINE} />
      ))}
      <circle cx={50} cy={50} r={12} style={{ fill: BEHIND, stroke: EDGE }} strokeWidth={LINE} />
    </>
  ),
  mentoring: (
    <>
      <circle cx={50} cy={50} r={34} style={{ fill: FILL, stroke: EDGE }} strokeWidth={LINE} />
      <path d={spark(50, 50, 22)} style={{ fill: CARD, stroke: EDGE }} strokeWidth={LINE} strokeLinejoin="round" />
      <circle cx={74} cy={26} r={3.5} style={{ fill: EDGE }} />
    </>
  ),
  therapy: (
    <>
      <Pressed d={scallop(9)} />
      <circle cx={50} cy={50} r={13} style={{ fill: CARD, stroke: EDGE }} strokeWidth={LINE} />
    </>
  ),
  legal: (
    <>
      <Pressed d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39Z" />
      <path d="M50 6 V94 M6 50 H94 M39 39 L61 61 M61 39 L39 61" fill="none" style={{ stroke: EDGE }} strokeWidth={LINE} strokeLinecap="round" />
    </>
  ),
  "Ask.": (
    <>
      <Pressed d={spark(44, 56, 34)} />
      <Pressed d={spark(74, 24, 13)} />
      <circle cx={82} cy={50} r={2.4} style={{ fill: EDGE }} />
    </>
  ),
  "Check.": (
    <>
      <Orbit rx={38} ry={38} tilt={0} />
      <circle cx={77} cy={23} r={4} style={{ fill: FILL, stroke: EDGE }} strokeWidth={LINE} />
      <Pressed d={spark(50, 50, 20)} />
    </>
  ),
  "See.": (
    <>
      <Pressed d={sunburst(16, 47, 35)} />
      <circle cx={50} cy={50} r={17} style={{ fill: CARD, stroke: EDGE }} strokeWidth={LINE} />
    </>
  ),
};

/** `shape`: a mode value ("knowing", "decision"...) or a step word ("Ask.").
 *  `center` / `size`: where the empty middle of that card is, in its own px. */
export function CardEmboss({ shape, center, size }: { shape: string; center: number; size: number }) {
  const art = SHAPES[shape];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      data-testid="card-emboss"
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden"
      style={{ top: center, width: size, height: size }}
    >
      {art}
    </svg>
  );
}
