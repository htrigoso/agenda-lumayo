"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AlarmIcon from "@mui/icons-material/AlarmOutlined";
import InfoIcon from "@mui/icons-material/Info";
import { type CallSummary, formatCallDateTime, formatDay, isCallDue, outcomeLabel, outcomeOption, relativeDay } from "@/lib/calls";

type Props = {
  call: Partial<CallSummary>;
  /** staff user_id → full name */
  staffNames: Record<string, string>;
  /** Lima calendar day (YYYY-MM-DD), computed on the server. */
  today: string;
  /** Clips the outcome chip beyond this width and adds an info icon whose tooltip shows the full text. */
  maxWidth?: number;
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
export function LastCall({ call, staffNames, today, maxWidth }: Props) {
  const due = isCallDue(call.next_call_on, today);
  if (!call.last_call_at) {
    return due ? <CallDueChip nextCallOn={call.next_call_on!} today={today} /> : <Typography color="text.secondary">—</Typography>;
  }
  const who = call.last_call_by ? staffNames[call.last_call_by] : undefined;
  const label = `${outcomeLabel(call.last_call_outcome)} · ${relativeDay(call.last_call_at, today)}`;
  const tooltip = (
    <>
      {label}
      <br />
      {formatCallDateTime(call.last_call_at)}
      {who ? ` · ${who}` : ""}
    </>
  );
  // Rough fit: a small bold chip renders ~7.5px per character plus its padding.
  const clipped = maxWidth !== undefined && label.length * 7.5 + 24 > maxWidth;
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
      <Tooltip title={tooltip}>
        <Chip
          size="small"
          color={outcomeOption(call.last_call_outcome)?.color ?? "default"}
          label={label}
          sx={{ fontWeight: 600, maxWidth, "& .MuiChip-label": { textOverflow: "clip" } }}
        />
      </Tooltip>
      {clipped && (
        <Tooltip title={tooltip}>
          <InfoIcon
            aria-label="Ver descripción completa"
            sx={{ fontSize: 14, borderRadius: "50%", color: "info.main", flexShrink: 0, cursor: "help" }}
          />
        </Tooltip>
      )}
      {due && <CallDueChip nextCallOn={call.next_call_on!} today={today} />}
    </Stack>
  );
}
