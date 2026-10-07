"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { OdontogramToolbar } from "@/components/odontogram/odontogram-toolbar";
import { TOOTH_H, TOOTH_W, Tooth, ToothDefs } from "@/components/odontogram/tooth";
import { findingByCode, markColor } from "@/lib/odontogram-catalog";
import {
  ROWS,
  applyMark,
  applyRange,
  clearTooth,
  eraseSurface,
  eraseTooth,
  type OdontogramData,
  type RangeMark,
  type Tool,
  type ToothRow,
  type Zone,
} from "@/lib/odontogram";

const MID_GAP = 16;
const SLOTS = 16;
const LEVEL_H = 15;
export const ROW_WIDTH = SLOTS * TOOTH_W + MID_GAP;

const slotX = (i: number) => i * TOOTH_W + (i >= SLOTS / 2 ? MID_GAP : 0);
const centerX = (i: number) => slotX(i) + TOOTH_W / 2;

const FULL_LABEL: Record<string, string> = {
  EDENTULO_TOTAL: "Edéntulo total",
  PROTESIS_COMPLETA: "Prótesis completa",
};

/** Greedy lane assignment so overlapping range findings do not draw on top of each other. */
function assignLevels(ranges: { r: RangeMark; a: number; z: number }[]) {
  const lanes: number[] = [];
  return ranges
    .slice()
    .sort((x, y) => x.a - y.a)
    .map((item) => {
      let level = lanes.findIndex((end) => end < item.a);
      if (level === -1) level = lanes.length;
      lanes[level] = item.z;
      return { ...item, level };
    });
}

function RangeShape({ r, x1, x2, y, upper }: { r: RangeMark; x1: number; x2: number; y: number; upper: boolean }) {
  const color = markColor(r.f, r.s);
  const tick = upper ? 5 : -5;
  const stroke = { stroke: color, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const mid = (x1 + x2) / 2;

  switch (r.f) {
    case "PROTESIS_FIJA":
      return <path d={`M${x1} ${y + tick} V${y} H${x2} V${y + tick}`} {...stroke} strokeWidth="2.6" />;
    case "PROTESIS_REMOVIBLE":
      return <path d={`M${x1} ${y + tick} V${y} H${x2} V${y + tick}`} {...stroke} strokeWidth="2.4" strokeDasharray="6 4" />;
    case "ORTODONCIA_REMOVIBLE": {
      const pts: string[] = [];
      for (let x = x1, i = 0; x <= x2; x += 7, i++) pts.push(`${x},${y + (i % 2 ? 4 : -4)}`);
      return <polyline points={pts.join(" ")} {...stroke} strokeWidth="2" />;
    }
    case "ORTODONCIA_FIJA": {
      const squares: number[] = [];
      for (let x = x1; x <= x2 + 1; x += TOOTH_W) squares.push(x);
      return (
        <g {...stroke} strokeWidth="2">
          <line x1={x1} y1={y} x2={x2} y2={y} />
          {squares.map((x) => (
            <rect key={x} x={x - 3.5} y={y - 3.5} width="7" height="7" rx="1.5" fill="#fff" />
          ))}
        </g>
      );
    }
    case "EDENTULO_TOTAL":
    case "PROTESIS_COMPLETA":
      return (
        <g>
          <path d={`M${x1} ${y + tick} V${y} H${x2} V${y + tick}`} {...stroke} strokeWidth="3" />
          <text x={mid} y={y + (upper ? -4 : 11)} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>
            {FULL_LABEL[r.f]}
          </text>
        </g>
      );
    default: {
      const glyph = findingByCode(r.f)?.glyph ?? "•";
      return (
        <g>
          <line x1={x1} y1={y} x2={x2} y2={y} {...stroke} strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
          <circle cx={mid} cy={y} r="8.5" fill="#fff" stroke={color} strokeWidth="1.4" />
          <text x={mid} y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>
            {glyph}
          </text>
        </g>
      );
    }
  }
}

function Row({
  row,
  data,
  pending,
  readOnly,
  onZoneClick,
}: {
  row: ToothRow;
  data: OdontogramData;
  pending: number | null;
  readOnly: boolean;
  onZoneClick: (tooth: number, zone: Zone, row: ToothRow) => void;
}) {
  const upper = row.arch === "upper";
  const placed = data.ranges
    .map((r) => ({ r, a: row.teeth.indexOf(Number(r.from)), z: row.teeth.indexOf(Number(r.to)) }))
    .filter((p) => p.a >= 0 && p.z >= 0)
    .map((p) => ({ ...p, a: Math.min(p.a, p.z), z: Math.max(p.a, p.z) }));
  const laid = assignLevels(placed);
  const levels = laid.reduce((max, p) => Math.max(max, p.level + 1), 0);
  const band = levels > 0 ? levels * LEVEL_H + 8 : 6;
  const toothY = upper ? band : 0;
  const height = TOOTH_H + band;

  return (
    <svg
      viewBox={`0 0 ${ROW_WIDTH} ${height}`}
      width="100%"
      style={{ minWidth: 720, display: "block" }}
      role="img"
      aria-label={`Arcada ${row.label}`}
    >
      <ToothDefs />
      <line
        x1={(SLOTS / 2) * TOOTH_W + MID_GAP / 2}
        x2={(SLOTS / 2) * TOOTH_W + MID_GAP / 2}
        y1={0}
        y2={height}
        stroke="#cbd5e1"
        strokeDasharray="3 4"
      />
      {row.teeth.map((n, i) =>
        n === null ? null : (
          <g key={n} transform={`translate(${slotX(i)} ${toothY})`}>
            <Tooth
              number={n}
              data={data.teeth[String(n)]}
              upper={upper}
              highlighted={pending === n}
              interactive={!readOnly}
              onZoneClick={(tooth, zone) => onZoneClick(tooth, zone, row)}
            />
          </g>
        ),
      )}
      {laid.map(({ r, a, z, level }) => {
        const y = upper ? band - 8 - level * LEVEL_H : TOOTH_H + 10 + level * LEVEL_H;
        return <RangeShape key={`${r.f}-${r.from}-${r.to}`} r={r} x1={centerX(a)} x2={centerX(z)} y={y} upper={upper} />;
      })}
    </svg>
  );
}

export function OdontogramEditor({
  data,
  onChange,
  readOnly = false,
}: {
  data: OdontogramData;
  onChange: (next: OdontogramData) => void;
  readOnly?: boolean;
}) {
  const [tool, setTool] = useState<Tool>({ kind: "mark", finding: "CARIES", state: "CD" });
  const [pending, setPending] = useState<number | null>(null);
  const hasTemporary = useMemo(
    () => Object.keys(data.teeth).some((k) => Number(k) >= 51 && Number(k) <= 85),
    [data.teeth],
  );
  const [showTemporary, setShowTemporary] = useState(hasTemporary);

  function pickTool(next: Tool) {
    setTool(next);
    setPending(null);
  }

  function handleZone(tooth: number, zone: Zone, row: ToothRow) {
    if (readOnly) return;
    if (tool.kind === "erase-surface") return onChange(eraseSurface(data, tooth, zone));
    if (tool.kind === "erase-tooth") return onChange(eraseTooth(data, tooth));
    if (tool.kind === "clear") return onChange(clearTooth(data, tooth));

    const finding = findingByCode(tool.finding);
    if (!finding) return;
    if (finding.level !== "range") return onChange(applyMark(data, finding, tool.state, tooth, zone));

    const present = row.teeth.filter((t): t is number => t !== null);
    if (finding.fullArch) {
      return onChange(applyRange(data, finding, tool.state, present[0], present[present.length - 1]));
    }
    if (pending === null) return setPending(tooth);
    if (pending === tooth || !row.teeth.includes(pending)) return setPending(null);
    const [from, to] = [pending, tooth].sort((a, b) => row.teeth.indexOf(a) - row.teeth.indexOf(b));
    onChange(applyRange(data, finding, tool.state, from, to));
    setPending(null);
  }

  const rows = ROWS.filter((r) => !r.temporary || showTemporary);
  const rangeFinding = tool.kind === "mark" ? findingByCode(tool.finding) : undefined;

  return (
    <Stack spacing={2}>
      {!readOnly && <OdontogramToolbar tool={tool} onChange={pickTool} />}

      {!readOnly && rangeFinding?.level === "range" && !rangeFinding.fullArch && (
        <Alert severity="info">
          {pending === null
            ? `${rangeFinding.name}: toca la primera pieza.`
            : `Pieza ${pending} elegida. Toca la última pieza (misma arcada).`}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3, borderColor: "#e3e8ef" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Numeración FDI (ISO 3950) · NTS 188-MINSA/DGIESP-2022 · <span style={{ color: "#2563eb", fontWeight: 700 }}>azul</span>: buen
            estado o característica no patológica · <span style={{ color: "#dc2626", fontWeight: 700 }}>rojo</span>: mal estado, temporal o
            patológico
          </Typography>
          <FormControlLabel
            sx={{ m: 0, flexShrink: 0 }}
            control={<Switch size="small" checked={showTemporary} onChange={(e) => setShowTemporary(e.target.checked)} />}
            label={<Typography variant="caption">Dentición temporal</Typography>}
          />
        </Stack>
        <Box sx={{ overflowX: "auto" }}>
          <Stack spacing={1} sx={{ minWidth: 720 }}>
            {rows.map((row) => (
              <Row key={row.id} row={row} data={data} pending={pending} readOnly={readOnly} onZoneClick={handleZone} />
            ))}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", md: "none" }, mt: 1 }}>
          Desliza horizontalmente para ver todas las piezas.
        </Typography>
      </Paper>
    </Stack>
  );
}
