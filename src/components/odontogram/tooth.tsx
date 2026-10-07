import { markAcronym, markColor, markName, findingByCode } from "@/lib/odontogram-catalog";
import { SURFACE_LABEL, quadrantOf, surfaceAt, type Mark, type ToothData, type Zone } from "@/lib/odontogram";

export const TOOTH_W = 46;
export const TOOTH_H = 96;
const CX = TOOTH_W / 2;
const R_OUT = 17;
const R_IN = 7.5;
const GAP = 2.4; // degrees trimmed per side so the 4 outer zones read as separate pieces

type Geometry = { cy: number; rootDir: -1 | 1; numberY: number; acronymY: number };
const upperGeo: Geometry = { cy: 60, rootDir: -1, numberY: 10, acronymY: 90 };
const lowerGeo: Geometry = { cy: 36, rootDir: 1, numberY: 92, acronymY: 9 };

const polar = (cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
};

/** Ring sector (outer zone of the crown) centered on `mid` degrees, 0 = up. */
function sector(cy: number, mid: number) {
  const inner = R_IN + 1.4;
  const [x1, y1] = polar(cy, R_OUT, mid - 45 + GAP);
  const [x2, y2] = polar(cy, R_OUT, mid + 45 - GAP);
  const [x3, y3] = polar(cy, inner, mid + 45 - GAP);
  const [x4, y4] = polar(cy, inner, mid - 45 + GAP);
  return `M${x1} ${y1} A${R_OUT} ${R_OUT} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 0 0 ${x4} ${y4}Z`;
}

const ZONES: { zone: Zone; mid?: number }[] = [
  { zone: "top", mid: 0 },
  { zone: "right", mid: 90 },
  { zone: "bottom", mid: 180 },
  { zone: "left", mid: 270 },
  { zone: "center" },
];

function rootCount(tooth: number, upper: boolean) {
  const pos = tooth % 10;
  if (quadrantOf(tooth) >= 5) return pos <= 3 ? 1 : upper ? 3 : 2; // temporary molars
  if (pos <= 3) return 1;
  if (pos === 4) return upper ? 2 : 1;
  if (pos === 5) return 1;
  return upper ? 3 : 2;
}

function rootPath(x: number, baseY: number, tipY: number, half: number) {
  const mid = (baseY + tipY) / 2;
  return `M${x - half} ${baseY} Q${x - half * 0.55} ${mid} ${x} ${tipY} Q${x + half * 0.55} ${mid} ${x + half} ${baseY}Z`;
}

function Roots({ tooth, geo, upper }: { tooth: number; geo: Geometry; upper: boolean }) {
  const count = rootCount(tooth, upper);
  const base = geo.cy + geo.rootDir * (R_OUT - 4);
  const tip = (len: number) => geo.cy + geo.rootDir * (R_OUT + len);
  const roots =
    count === 1
      ? [{ x: CX, len: 25, half: 8.5 }]
      : count === 2
        ? [
            { x: CX - 8, len: 23, half: 6 },
            { x: CX + 8, len: 23, half: 6 },
          ]
        : [
            { x: CX - 11, len: 21, half: 5 },
            { x: CX, len: 25, half: 5.5 },
            { x: CX + 11, len: 21, half: 5 },
          ];
  return (
    <g fill="url(#rootGrad)" stroke="#d6c4a8" strokeWidth="0.9" strokeLinejoin="round">
      {roots.map((r) => (
        <path key={r.x} d={rootPath(r.x, base, tip(r.len), r.half)} />
      ))}
    </g>
  );
}

type SurfaceStyle = { fill: string; stroke: string; dash?: string };

function surfaceStyle(mark: Mark | undefined): SurfaceStyle | null {
  if (!mark) return null;
  const color = markColor(mark.f, mark.s);
  switch (mark.f) {
    case "RESTAURACION_TEMP":
      return { fill: `${color}26`, stroke: color, dash: "2.5 2" };
    case "DESGASTE":
      return { fill: `${color}55`, stroke: color };
    case "DDE":
      return { fill: `${color}80`, stroke: color };
    case "SELLANTE":
      return { fill: `${color}b3`, stroke: color };
    default:
      return { fill: color, stroke: color };
  }
}

function WholeMark({ mark, cy, rootDir }: { mark: Mark; cy: number; rootDir: -1 | 1 }) {
  const color = markColor(mark.f, mark.s);
  const finding = findingByCode(mark.f);
  const lineEnd = cy + rootDir * (R_OUT + 24);
  const common = { stroke: color, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (mark.f) {
    case "AUSENTE":
      return (
        <g {...common} strokeWidth="2.6">
          <line x1={CX - R_OUT} y1={cy - R_OUT} x2={CX + R_OUT} y2={cy + R_OUT} />
          <line x1={CX + R_OUT} y1={cy - R_OUT} x2={CX - R_OUT} y2={cy + R_OUT} />
        </g>
      );
    case "CORONA":
      return <circle cx={CX} cy={cy} r={R_OUT + 3} {...common} strokeWidth="2.4" />;
    case "CORONA_TEMPORAL":
      return <circle cx={CX} cy={cy} r={R_OUT + 3} {...common} strokeWidth="2.2" strokeDasharray="4 3" />;
    case "TRATAMIENTO_CONDUCTO":
      return (
        <g {...common} strokeWidth="2.4">
          <line x1={CX} y1={cy - rootDir * 2} x2={CX} y2={lineEnd} strokeDasharray={mark.s.startsWith("PC") ? "4 2.5" : undefined} />
        </g>
      );
    case "PULPOTOMIA":
      return (
        <g {...common} strokeWidth="2.4">
          <line x1={CX} y1={cy} x2={CX} y2={cy + rootDir * (R_OUT + 4)} />
        </g>
      );
    case "ESPIGO_MUNON":
      return (
        <g {...common} strokeWidth="2.4">
          <line x1={CX} y1={cy} x2={CX} y2={lineEnd - rootDir * 4} />
          <line x1={CX - 7} y1={cy} x2={CX + 7} y2={cy} />
        </g>
      );
    case "IMPLANTE": {
      const base = cy + rootDir * (R_OUT - 2);
      return (
        <g {...common} strokeWidth="1.8">
          <line x1={CX} y1={base} x2={CX} y2={lineEnd} strokeWidth="2.4" />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={CX - 6} x2={CX + 6} y1={base + rootDir * (5 + k * 5)} y2={base + rootDir * (5 + k * 5)} />
          ))}
        </g>
      );
    }
    case "FRACTURA":
      return (
        <polyline
          {...common}
          strokeWidth="2.2"
          points={`${CX - 15},${cy - 8} ${CX - 6},${cy + 2} ${CX + 1},${cy - 6} ${CX + 8},${cy + 4} ${CX + 15},${cy - 3}`}
        />
      );
    case "FOSAS_FISURAS_PROF":
      return <path {...common} strokeWidth="2" d={`M${CX - 11} ${cy} q4 -6 7 0 t7 0 t7 0`} />;
    case "REMANENTE_RADICULAR":
      return (
        <text x={CX} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>
          RR
        </text>
      );
    default:
      if (finding?.glyph) {
        return (
          <text x={CX} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={color}>
            {finding.glyph}
          </text>
        );
      }
      return null;
  }
}

export function Tooth({
  number,
  data,
  upper,
  highlighted,
  interactive,
  onZoneClick,
}: {
  number: number;
  data: ToothData | undefined;
  upper: boolean;
  highlighted: boolean;
  interactive: boolean;
  onZoneClick: (tooth: number, zone: Zone) => void;
}) {
  const geo = upper ? upperGeo : lowerGeo;
  const whole = data?.W ?? [];
  const faded = whole.some((m) => m.f === "AUSENTE" || m.f === "REMANENTE_RADICULAR");

  const labels = [
    ...Object.values(data?.S ?? {}),
    ...whole,
  ]
    .map((m) => (m ? { text: markAcronym(m.f, m.s), color: markColor(m.f, m.s) } : null))
    .filter((l): l is { text: string; color: string } => !!l && l.text !== "");

  return (
    <g>
      <text
        x={CX}
        y={geo.numberY}
        textAnchor="middle"
        fontSize="11"
        fontWeight={highlighted ? 800 : 600}
        fill={highlighted ? "#0b3c6e" : "#64748b"}
      >
        {number}
      </text>

      {highlighted && <circle cx={CX} cy={geo.cy} r={R_OUT + 6} fill="none" stroke="#19b4d8" strokeWidth="2.2" opacity="0.8" />}

      <g opacity={faded ? 0.35 : 1}>
        <Roots tooth={number} geo={geo} upper={upper} />
        <circle cx={CX} cy={geo.cy} r={R_OUT + 1.5} fill="#fff" filter="url(#toothShadow)" />
        {ZONES.map(({ zone, mid }) => {
          const surface = surfaceAt(number, zone);
          const mark = data?.S?.[surface];
          const style = surfaceStyle(mark);
          const props = {
            fill: style?.fill ?? "url(#crownGrad)",
            stroke: style?.stroke ?? "#c3cedd",
            strokeWidth: 1,
            strokeDasharray: style?.dash,
            className: interactive && !mark ? "tooth-zone" : undefined,
            style: { cursor: interactive ? "pointer" : "default", transition: "fill 0.15s ease" },
            onClick: () => interactive && onZoneClick(number, zone),
          };
          const tip = mark ? `${SURFACE_LABEL[surface]}: ${markName(mark.f, mark.s)}` : SURFACE_LABEL[surface];
          return zone === "center" ? (
            <circle key={zone} cx={CX} cy={geo.cy} r={R_IN} {...props}>
              <title>{tip}</title>
            </circle>
          ) : (
            <path key={zone} d={sector(geo.cy, mid ?? 0)} {...props}>
              <title>{tip}</title>
            </path>
          );
        })}
      </g>

      <g style={{ pointerEvents: "none" }}>
        {whole.map((m) => (
          <WholeMark key={m.f} mark={m} cy={geo.cy} rootDir={geo.rootDir} />
        ))}
      </g>

      {labels.length > 0 && (
        <text x={CX} y={geo.acronymY} textAnchor="middle" fontSize="8.5" fontWeight="700" style={{ pointerEvents: "none" }}>
          {labels.slice(0, 3).map((l, i) => (
            <tspan key={i} fill={l.color} dx={i === 0 ? 0 : 3}>
              {l.text}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

/** Gradients and shadow shared by every tooth of an arch row. */
export function ToothDefs() {
  return (
    <defs>
      <radialGradient id="crownGrad" cx="35%" cy="30%" r="85%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e6edf6" />
      </radialGradient>
      <linearGradient id="rootGrad" x1="0" x2="1">
        <stop offset="0%" stopColor="#f6eee1" />
        <stop offset="100%" stopColor="#eadbc3" />
      </linearGradient>
      <filter id="toothShadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#0b2545" floodOpacity="0.16" />
      </filter>
    </defs>
  );
}
