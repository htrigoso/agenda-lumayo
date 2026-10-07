"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { EASE, MotionBox } from "@/components/motion";
import { niceScale, type Series } from "@/lib/reports";

// Chart ink. Gridlines/axes recede; text uses text tokens, never the series color.
const BAR = "#0b3c6e";
const BAR_HOVER = "#19b4d8";
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#6b6a66";
const INK = "#0b2545";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })}K` : String(n));

/** Column chart over time: one thin bar per bucket, readout line above that follows hover/tap. */
export function ColumnChart({
  series,
  format,
  ariaLabel,
}: {
  series: Series;
  format: (value: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 230;
  const m = { top: 14, right: 8, bottom: 30, left: 44 };
  const n = series.values.length;
  const max = Math.max(...series.values, 0);
  const { top, step } = niceScale(max);
  const innerW = Math.max(width - m.left - m.right, 10);
  const innerH = height - m.top - m.bottom;
  const slot = innerW / Math.max(n, 1);
  const barW = Math.min(24, Math.max(slot * 0.7, 2));
  const y = (v: number) => m.top + innerH - (v / top) * innerH;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(Math.floor(innerW / 64), 1)));
  const maxIndex = max > 0 ? series.values.indexOf(max) : -1;
  const shown = hover ?? maxIndex;

  return (
    <Box>
      <Typography variant="body2" sx={{ minHeight: 24, color: INK }}>
        {shown >= 0 && (
          <>
            <b>{series.labels[shown]}</b> · {format(series.values[shown])}
          </>
        )}
      </Typography>
      <Box ref={ref} sx={{ width: "100%" }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
            {Array.from({ length: 5 }, (_, i) => i * step).map((tick) => (
              <g key={tick}>
                <line x1={m.left} x2={width - m.right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? AXIS : GRID} strokeWidth="1" />
                <text x={m.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
                  {compact(tick)}
                </text>
              </g>
            ))}
            {series.values.map((v, i) => {
              const cx = m.left + slot * i + slot / 2;
              const h = (v / top) * innerH;
              const x = cx - barW / 2;
              const r = Math.min(4, barW / 2, h);
              const active = hover === i;
              return (
                <g key={series.keys[i]}>
                  {v > 0 && (
                    <motion.path
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.015, 0.4) }}
                      style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                      // Rounded data end, square at the baseline.
                      d={`M${x} ${y(0)} V${y(v) + r} Q${x} ${y(v)} ${x + r} ${y(v)} H${x + barW - r} Q${x + barW} ${y(v)} ${x + barW} ${y(v) + r} V${y(0)}Z`}
                      fill={active ? BAR_HOVER : BAR}
                    />
                  )}
                  {i % labelEvery === 0 && (
                    <text x={cx} y={height - 10} textAnchor="middle" fontSize="11" fill={MUTED}>
                      {series.labels[i]}
                    </text>
                  )}
                  {/* Hit target wider than the mark, full height of the plot. */}
                  <rect
                    x={m.left + slot * i}
                    y={m.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setHover(i)}
                    onTouchStart={() => setHover(i)}
                  />
                </g>
              );
            })}
          </svg>
        )}
      </Box>
    </Box>
  );
}

export type BarDatum = { label: string; value: number; display: string; color?: string };

/** Horizontal bars with the label on the left and the value at the bar tip. */
export function HorizontalBars({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <Box role="img" aria-label={ariaLabel} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {data.map((d) => (
        <Box
          key={d.label}
          title={`${d.label}: ${d.display}`}
          sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(70px, 110px) 1fr", sm: "minmax(110px, 170px) 1fr" }, alignItems: "center", gap: 1.5 }}
        >
          <Typography variant="body2" sx={{ color: INK, overflowWrap: "anywhere" }}>
            {d.label}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <MotionBox
              initial={{ width: 0 }}
              animate={{ width: max > 0 ? `${Math.max((d.value / max) * 78, d.value > 0 ? 1 : 0)}%` : 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              sx={{
                height: 14,
                // Rounded data end only; flat at the baseline.
                borderRadius: "0 4px 4px 0",
                bgcolor: d.color ?? BAR,
                minWidth: d.value > 0 ? 4 : 0,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>
              {d.display}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
