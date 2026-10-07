"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import {
  COLORS,
  FINDINGS,
  LEVEL_LABEL,
  findingByCode,
  type Finding,
  type Level,
} from "@/lib/odontogram-catalog";
import type { Tool } from "@/lib/odontogram";

const TABS: (Level | "erase")[] = ["surface", "tooth", "range", "erase"];
const TAB_LABEL: Record<Level | "erase", string> = { ...LEVEL_LABEL, erase: "Borrar" };

const hasCondition = (f: Finding) => f.states.some((s) => s.code.endsWith("BUENO"));

/** Builds the state code for a finding from the current type / condition / explicit choices. */
function stateFor(f: Finding, type: string, cond: "BUENO" | "MALO", explicit: string) {
  if (f.types) return `${type}_${cond}`;
  if (hasCondition(f)) return cond;
  return f.states.some((s) => s.code === explicit) ? explicit : f.states[0].code;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
      {children}
    </Typography>
  );
}

export function OdontogramToolbar({ tool, onChange }: { tool: Tool; onChange: (tool: Tool) => void }) {
  const [tab, setTab] = useState<Level | "erase">("surface");
  const [findingCode, setFindingCode] = useState("CARIES");
  const [type, setType] = useState("");
  const [cond, setCond] = useState<"BUENO" | "MALO">("BUENO");
  const [explicit, setExplicit] = useState("CD");

  const finding = findingByCode(findingCode) ?? FINDINGS[0];
  const activeType = finding.types?.some((t) => t.code === type) ? type : (finding.types?.[0]?.code ?? "");

  function select(next: Finding, nextType = activeType, nextCond = cond, nextExplicit = explicit) {
    const resolvedType = next.types?.some((t) => t.code === nextType) ? nextType : (next.types?.[0]?.code ?? "");
    setFindingCode(next.code);
    setType(resolvedType);
    setCond(nextCond);
    setExplicit(nextExplicit);
    onChange({ kind: "mark", finding: next.code, state: stateFor(next, resolvedType, nextCond, nextExplicit) });
  }

  const list = FINDINGS.filter((f) => f.level === tab);
  const currentState = tool.kind === "mark" ? tool.state : "";

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          if (v === "erase") onChange({ kind: "erase-surface" });
          else {
            const first = FINDINGS.find((f) => f.level === v);
            if (first && findingByCode(findingCode)?.level !== v) select(first);
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}
      >
        {TABS.map((t) => (
          <Tab key={t} value={t} label={TAB_LABEL[t]} sx={{ fontWeight: 600 }} />
        ))}
      </Tabs>

      <Box sx={{ p: 2 }}>
        {tab === "erase" ? (
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {[
                { kind: "erase-surface", label: "Borrar zona" },
                { kind: "erase-tooth", label: "Borrar marcas de la pieza" },
                { kind: "clear", label: "Limpiar pieza completa" },
              ].map((e) => (
                <Chip
                  key={e.kind}
                  label={e.label}
                  color={tool.kind === e.kind ? "primary" : "default"}
                  variant={tool.kind === e.kind ? "filled" : "outlined"}
                  onClick={() => onChange({ kind: e.kind } as Tool)}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
            <Hint>
              &quot;Borrar zona&quot; quita la marca de una superficie. &quot;Borrar marcas&quot; quita las marcas de la pieza o, si no
              tiene, los hallazgos entre piezas que la tocan. &quot;Limpiar&quot; deja la pieza en blanco.
            </Hint>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {list.map((f) => {
                const selected = tool.kind === "mark" && tool.finding === f.code;
                return (
                  <Chip
                    key={f.code}
                    label={f.name}
                    onClick={() => select(f)}
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    sx={{ fontWeight: 600 }}
                  />
                );
              })}
            </Stack>

            {tool.kind === "mark" && findingByCode(tool.finding)?.level === tab && (
              <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {finding.name} · NTS 188 §{finding.section}
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  {finding.types && (
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                      {finding.types.map((t) => (
                        <Chip
                          key={t.code}
                          size="small"
                          label={`${t.name} (${t.acronym})`}
                          color={activeType === t.code ? "primary" : "default"}
                          variant={activeType === t.code ? "filled" : "outlined"}
                          onClick={() => select(finding, t.code)}
                        />
                      ))}
                    </Stack>
                  )}
                  {(finding.types || hasCondition(finding)) && (
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={cond}
                      onChange={(_, v) => v && select(finding, activeType, v)}
                    >
                      <ToggleButton value="BUENO" sx={{ px: 2, color: COLORS.blue, fontWeight: 600 }}>
                        Buen estado (azul)
                      </ToggleButton>
                      <ToggleButton value="MALO" sx={{ px: 2, color: COLORS.red, fontWeight: 600 }}>
                        Mal estado (rojo)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                  {!finding.types && !hasCondition(finding) && finding.states.length > 1 && (
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                      {finding.states.map((s) => (
                        <Chip
                          key={s.code}
                          size="small"
                          label={s.acronym ? `${s.name} (${s.acronym})` : s.name}
                          variant={currentState === s.code ? "filled" : "outlined"}
                          onClick={() => select(finding, activeType, cond, s.code)}
                          sx={{
                            borderColor: COLORS[s.color],
                            color: currentState === s.code ? "#fff" : COLORS[s.color],
                            bgcolor: currentState === s.code ? COLORS[s.color] : undefined,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                  {finding.states.length === 1 && (
                    <Typography variant="body2" sx={{ color: COLORS[finding.states[0].color], fontWeight: 600 }}>
                      Se registra en {finding.states[0].color === "blue" ? "azul" : "rojo"}.
                    </Typography>
                  )}
                </Stack>
                <Hint>
                  {finding.level === "surface" && "Toca la zona del diente que corresponde."}
                  {finding.level === "tooth" &&
                    (finding.temporalOnly ? "Solo en dentición temporal. Toca la pieza." : "Toca la pieza.")}
                  {finding.level === "range" &&
                    (finding.fullArch
                      ? "Toca cualquier pieza de la arcada."
                      : "Toca la primera y la última pieza (misma arcada).")}
                </Hint>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
