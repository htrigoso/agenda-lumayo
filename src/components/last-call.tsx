"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AlarmIcon from "@mui/icons-material/AlarmOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import { type CallSummary, formatCallWhen, formatDay, isCallDue, outcomeLabel, outcomeOption, relativeDay } from "@/lib/calls";

type Props = {
  call: Partial<CallSummary>;
  /** staff user_id → full name */
  staffNames: Record<string, string>;
  /** Lima calendar day (YYYY-MM-DD), computed on the server. */
  today: string;
};

/** Small warning shown when the patient's follow-up call is due today or overdue. */
export function CallDueChip({ nextCallOn, today }: { nextCallOn: string; today: string }) {
  const overdue = nextCallOn < today;
  return (
    <Tooltip title={`Seguimiento programado para el ${formatDay(nextCallOn)}`}>
      <Chip
        size="small"
        color="warning"
        variant={overdue ? "filled" : "outlined"}
        icon={<AlarmIcon />}
        label={overdue ? "Llamada atrasada" : "Llamar hoy"}
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  );
}

/** Outcome of the patient's last call with its relative date, plus a "Llamar hoy" flag when due. */
export function LastCall({ call, staffNames, today }: Props) {
  const due = isCallDue(call.next_call_on, today);
  if (!call.last_call_at) {
    return due ? <CallDueChip nextCallOn={call.next_call_on!} today={today} /> : <Typography color="text.secondary">—</Typography>;
  }
  const who = call.last_call_by ? staffNames[call.last_call_by] : undefined;
  // "Volver a llamar el 15/11" shows the follow-up date; other outcomes say when the call happened.
  const label =
    call.last_call_outcome === "call_back" && call.next_call_on
      ? `Volver a llamar el ${formatDay(call.next_call_on).slice(0, 5)}`
      : `${outcomeLabel(call.last_call_outcome)} · llamó ${relativeDay(call.last_call_at, today)}`;
  const tooltip = (
    <>
      {label}
      <br />
      {formatCallWhen(call.last_call_at, today)}
      {who ? ` · ${who}` : ""}
    </>
  );
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
      <Tooltip title={tooltip}>
        <Chip
          size="small"
          color={outcomeOption(call.last_call_outcome)?.color ?? "default"}
          label={label}
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
      {due && <CallDueChip nextCallOn={call.next_call_on!} today={today} />}
    </Stack>
  );
}

/**
 * Compact last-call marker for patient cards: a phone icon tinted with the outcome color plus an
 * alarm when a follow-up is due. Tapping it opens a popover with the details.
 */
export function LastCallIcon({ call, staffNames, today }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const due = isCallDue(call.next_call_on, today);
  if (!call.last_call_at && !due) return null;
  const option = outcomeOption(call.last_call_outcome);
  const color = option?.color ?? "default";
  const who = call.last_call_by ? staffNames[call.last_call_by] : undefined;
  const overdue = due && call.next_call_on! < today;
  const summary = call.last_call_at ? `Última llamada: ${outcomeLabel(call.last_call_outcome)}` : "Llamada pendiente";

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={`${summary}. Ver detalle`}
        sx={{ borderRadius: 4, px: 0.25, py: 0.25, gap: 0.25 }}
      >
        {call.last_call_at && (
          <Box
            component="span"
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              bgcolor: color === "default" ? "grey.500" : `${color}.main`,
            }}
          >
            <PhoneIcon sx={{ fontSize: 13 }} />
          </Box>
        )}
        {due && <AlarmIcon sx={{ fontSize: 20, color: overdue ? "error.main" : "warning.main" }} />}
      </ButtonBase>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 1.5, maxWidth: 280 } } }}
      >
        <Stack spacing={1}>
          {call.last_call_at && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Última llamada
              </Typography>
              <div>
                <Chip size="small" color={color} label={outcomeLabel(call.last_call_outcome)} sx={{ fontWeight: 600 }} />
              </div>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCallWhen(call.last_call_at, today)}
              </Typography>
              {who && (
                <Typography variant="body2" color="text.secondary">
                  Llamó: {who}
                </Typography>
              )}
            </>
          )}
          {call.next_call_on && (
            <Typography variant="body2">
              Volver a llamar el <strong>{formatDay(call.next_call_on)}</strong>
            </Typography>
          )}
          {due && <CallDueChip nextCallOn={call.next_call_on!} today={today} />}
        </Stack>
      </Popover>
    </>
  );
}
