"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventInput } from "@fullcalendar/core";
import { EASE, MotionPaper } from "@/components/motion";
import { listAppointments, moveAppointment } from "@/app/(app)/agenda/actions";
import { STATUS, clientName, endsAt, type Appointment } from "@/lib/appointments";

type Props = {
  refreshKey: number;
  onCreate: (startsAt: Date) => void;
  onSelect: (appointment: Appointment) => void;
};

export default function CalendarDesktop({ refreshKey, onCreate, onSelect }: Props) {
  const calendar = useRef<FullCalendar>(null);
  // Stable fetcher + lookup of the appointments currently on screen.
  const [{ events, loaded }] = useState(() => {
    const loaded = new Map<string, Appointment>();
    const events = (
      info: { startStr: string; endStr: string },
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      listAppointments(info.startStr, info.endStr)
        .then((list) => {
          loaded.clear();
          list.forEach((a) => loaded.set(a.id, a));
          success(
            list.map((a) => ({
              id: a.id,
              title: `${clientName(a)}${a.reason ? ` · ${a.reason}` : ""}`,
              start: a.starts_at,
              end: endsAt(a).toISOString(),
              backgroundColor: STATUS[a.status].color,
              borderColor: STATUS[a.status].color,
              textColor: "#fff",
              classNames: a.status === "cancelled" ? ["fc-cancelled"] : [],
            })),
          );
        })
        .catch(failure);
    };
    return { events, loaded };
  });

  useEffect(() => {
    calendar.current?.getApi().refetchEvents();
  }, [refreshKey]);

  return (
    <MotionPaper
      variant="outlined"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      sx={{ p: 2, borderRadius: 3, borderColor: "#dadce0" }}
    >
      <FullCalendar
        ref={calendar}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        headerToolbar={{
          left: "today prev,next title",
          center: "",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="76vh"
        scrollTime="08:00:00"
        slotLabelInterval="01:00:00"
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        eventDisplay="block"
        dayMaxEvents={3}
        slotEventOverlap={false}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        dayHeaderContent={(arg) => {
          if (arg.view.type === "dayGridMonth") return undefined;
          const weekday = arg.date.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "");
          return (
            <div className={`gc-head${arg.isToday ? " is-today" : ""}`}>
              <span className="gc-dow">{weekday}</span>
              <span className="gc-num">{arg.date.getDate()}</span>
            </div>
          );
        }}
        eventContent={(arg) => (
          <div className="appt">
            <span className="appt-time">{arg.timeText}</span>
            <span className="appt-title">{arg.event.title}</span>
          </div>
        )}
        nowIndicator
        selectable
        editable
        events={events}
        dateClick={(info) => {
          const date = new Date(info.date);
          if (info.allDay) date.setHours(9, 0, 0, 0);
          onCreate(date);
        }}
        eventClick={(info) => {
          const appointment = loaded.get(info.event.id);
          if (appointment) onSelect(appointment);
        }}
        eventDrop={(info) => {
          if (!info.event.start) return info.revert();
          moveAppointment(info.event.id, info.event.start.toISOString()).catch(() => info.revert());
        }}
        eventResize={(info) => {
          const { start, end } = info.event;
          if (!start || !end) return info.revert();
          const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
          moveAppointment(info.event.id, start.toISOString(), minutes).catch(() => info.revert());
        }}
      />
    </MotionPaper>
  );
}
