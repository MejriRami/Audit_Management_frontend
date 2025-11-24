import { useMemo, useState, ChangeEvent } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import { Modal } from "../../components/ui/modal";

import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

type CalendarEventType = "audit" | "auditee-free";

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  auditor: string;
  auditee: string;
  type: CalendarEventType;
  location?: string;
};

type Mode = "myAudits" | "auditeeAvailability";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

// ---------------------------------------------------
// BIG FAKE DATASET: audits + auditee free slots
// NOTE: dates are in Nov/Dec 2025 and Jan 2026
// so they are in the future from 18 Nov 2025.
// ---------------------------------------------------
const RAW_EVENTS: CalendarEvent[] = [
  // -------------------------
  // 15 FAKE AUDITS (FUTURE)
  //  Month index: 10 = Nov, 11 = Dec, 0 = Jan (next year)
  // -------------------------
  {
    id: 1,
    title: "Audit – Packaging Line 1",
    auditor: "auditor1@company.com",
    auditee: "plant-manager@site-a.com",
    start: new Date(2025, 10, 20, 9, 0), // 20 Nov 2025
    end: new Date(2025, 10, 20, 12, 0),
    type: "audit",
    location: "Site A",
  },
  {
    id: 2,
    title: "Audit – Storage Area",
    auditor: "auditor1@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2025, 10, 22, 13, 0),
    end: new Date(2025, 10, 22, 16, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 3,
    title: "Audit – Production Line 3",
    auditor: "auditor2@company.com",
    auditee: "production@site-c.com",
    start: new Date(2025, 10, 25, 8, 0),
    end: new Date(2025, 10, 25, 11, 0),
    type: "audit",
    location: "Site C",
  },
  {
    id: 4,
    title: "Audit – Warehouse",
    auditor: "auditor3@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2025, 10, 27, 10, 0),
    end: new Date(2025, 10, 27, 13, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 5,
    title: "Audit – Safety Procedures",
    auditor: "auditor3@company.com",
    auditee: "plant-manager@site-a.com",
    start: new Date(2025, 11, 2, 9, 0), // 2 Dec 2025
    end: new Date(2025, 11, 2, 12, 0),
    type: "audit",
    location: "Site A",
  },
  {
    id: 6,
    title: "Audit – Chemical Storage",
    auditor: "auditor2@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2025, 11, 4, 14, 0),
    end: new Date(2025, 11, 4, 17, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 7,
    title: "Audit – Equipment Calibration",
    auditor: "auditor1@company.com",
    auditee: "production@site-c.com",
    start: new Date(2025, 11, 6, 8, 30),
    end: new Date(2025, 11, 6, 11, 30),
    type: "audit",
    location: "Site C",
  },
  {
    id: 8,
    title: "Audit – Quality Lab",
    auditor: "auditor3@company.com",
    auditee: "plant-manager@site-a.com",
    start: new Date(2025, 11, 9, 9, 0),
    end: new Date(2025, 11, 9, 12, 0),
    type: "audit",
    location: "Site A",
  },
  {
    id: 9,
    title: "Audit – Incoming Materials",
    auditor: "auditor2@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2025, 11, 11, 13, 0),
    end: new Date(2025, 11, 11, 16, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 10,
    title: "Audit – Dispatch Process",
    auditor: "auditor1@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2025, 11, 15, 9, 30),
    end: new Date(2025, 11, 15, 12, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 11,
    title: "Audit – Machine Safety",
    auditor: "auditor3@company.com",
    auditee: "production@site-c.com",
    start: new Date(2026, 0, 5, 10, 0), // 5 Jan 2026
    end: new Date(2026, 0, 5, 13, 0),
    type: "audit",
    location: "Site C",
  },
  {
    id: 12,
    title: "Audit – Environmental Compliance",
    auditor: "auditor2@company.com",
    auditee: "plant-manager@site-a.com",
    start: new Date(2026, 0, 8, 9, 0),
    end: new Date(2026, 0, 8, 12, 0),
    type: "audit",
    location: "Site A",
  },
  {
    id: 13,
    title: "Audit – Storage Safety",
    auditor: "auditor1@company.com",
    auditee: "logistics@site-b.com",
    start: new Date(2026, 0, 12, 13, 0),
    end: new Date(2026, 0, 12, 16, 0),
    type: "audit",
    location: "Site B",
  },
  {
    id: 14,
    title: "Audit – Process Validation",
    auditor: "auditor3@company.com",
    auditee: "production@site-c.com",
    start: new Date(2026, 0, 15, 8, 0),
    end: new Date(2026, 0, 15, 11, 0),
    type: "audit",
    location: "Site C",
  },
  {
    id: 15,
    title: "Audit – Document Control",
    auditor: "auditor2@company.com",
    auditee: "plant-manager@site-a.com",
    start: new Date(2026, 0, 20, 9, 0),
    end: new Date(2026, 0, 20, 12, 0),
    type: "audit",
    location: "HQ",
  },

  // -------------------------
  // FAKE AUDITEE FREE SLOTS (also future)
  //  Spread across Dec 2025 and Jan 2026
  // -------------------------
  ...[
    "plant-manager@site-a.com",
    "logistics@site-b.com",
    "production@site-c.com",
  ].flatMap((auditee, idx) =>
    Array.from({ length: 7 }).map((_, i) => {
      const day = 3 + i * 3 + idx; // spread days
      return {
        id: 200 + idx * 50 + i,
        title: "Auditee Free Slot",
        auditor: "",
        auditee,
        start: new Date(2025, 11, day, 9, 0), // December 2025
        end: new Date(2025, 11, day, 11, 0),
        type: "auditee-free" as CalendarEventType,
      } as CalendarEvent;
    })
  ),
];

export default function AuditsCalendar() {
  const [mode, setMode] = useState<Mode>("myAudits");
  const [selectedAuditor, setSelectedAuditor] = useState<string>(
    "auditor1@company.com"
  );
  const [selectedAuditee, setSelectedAuditee] = useState<string>("all");

  // 🔹 Start the calendar on the first fake event date
  const [currentDate, setCurrentDate] = useState<Date>(
    RAW_EVENTS[0]?.start ?? new Date()
  );

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // Auditor options
  const auditorOptions = useMemo(
    () =>
      Array.from(new Set(RAW_EVENTS.map((e) => e.auditor)))
        .filter((a) => a !== "")
        .map((email) => ({ value: email, label: email })),
    []
  );

  // Auditee options
  const auditeeOptions = useMemo(
    () => [
      { value: "all", label: "Select an auditee" },
      ...Array.from(new Set(RAW_EVENTS.map((e) => e.auditee))).map((email) => ({
        value: email,
        label: email,
      })),
    ],
    []
  );

  // Events shown in calendar (only ONE type depending on mode)
  const filteredEvents = useMemo(() => {
    if (mode === "myAudits") {
      // Only audits for this auditor
      return RAW_EVENTS.filter(
        (e) => e.type === "audit" && e.auditor === selectedAuditor
      );
    } else {
      // Only free slots for the selected auditee
      if (selectedAuditee === "all") return [];
      return RAW_EVENTS.filter(
        (e) => e.type === "auditee-free" && e.auditee === selectedAuditee
      );
    }
  }, [mode, selectedAuditor, selectedAuditee]);

  // Upcoming items (next audits OR next free slots)
  const upcomingItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (mode === "myAudits") {
      // next audits for this auditor
      return RAW_EVENTS.filter(
        (e) =>
          e.type === "audit" &&
          e.auditor === selectedAuditor &&
          e.start >= today
      )
        .slice()
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 5);
    } else {
      // next free slots for this auditee
      if (selectedAuditee === "all") return [];
      return RAW_EVENTS.filter(
        (e) =>
          e.type === "auditee-free" &&
          e.auditee === selectedAuditee &&
          e.start >= today
      )
        .slice()
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 5);
    }
  }, [mode, selectedAuditor, selectedAuditee]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let bgColor = "#579BFC"; // audits = blue
    if (event.type === "auditee-free") {
      bgColor = "#00C875"; // free slot = green
    }

    const style: any = {
      backgroundColor: bgColor,
      borderRadius: "6px",
      border: "none",
      color: "#ffffff",
      display: "block",
      padding: "2px 4px",
      fontSize: "0.75rem",
    };

    return { style };
  };

  const handleMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as string; // "YYYY-MM"
    if (!value) return;
    const [yearStr, monthStr] = value.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-based
    if (!isNaN(year) && !isNaN(month)) {
      setCurrentDate(new Date(year, month, 1));
    }
  };

  const monthValue = format(currentDate, "yyyy-MM");

  return (
    <div className="p-6 space-y-8">
      <PageMeta
        title="Audits Calendar"
        description="Plan audits and see auditee availability"
      />
      <PageBreadcrumb pageTitle="Audits Calendar" />

      {/* MODE SWITCH */}
      <ComponentCard title="Mode">
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setMode("myAudits")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              mode === "myAudits"
                ? "bg-indigo-600 text-white  "
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            }`}
          >
            My Upcoming Audits
          </button>
          <button
            type="button"
            onClick={() => setMode("auditeeAvailability")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              mode === "auditeeAvailability"
                ? "bg-indigo-600  text-white border-[#0584CE]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            }`}
          >
            Auditee Availability
          </button>
        </div>
      </ComponentCard>

      {/* FILTERS */}
      <ComponentCard title="Filters">
        {mode === "myAudits" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                I am (Auditor)
              </p>
              <Select
                options={auditorOptions}
                defaultValue={selectedAuditor}
                onChange={(value: string) => setSelectedAuditor(value)}
                className="dark:bg-dark-900"
              />
            </div>
            <div className="space-y-2 flex items-end">
              <button
                onClick={() => {
                  if (auditorOptions.length > 0) {
                    setSelectedAuditor(auditorOptions[0].value);
                  }
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg:white/[0.04]"
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Auditee
              </p>
              <Select
                options={auditeeOptions}
                defaultValue={selectedAuditee}
                onChange={(value: string) => setSelectedAuditee(value)}
                className="dark:bg-dark-900"
              />
            </div>
            <div className="space-y-2 flex items-end">
              <button
                onClick={() => {
                  setSelectedAuditee("all");
                }}
                className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 bg:white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg:white/[0.04]"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* MAIN CALENDAR (MONTH ONLY) */}
      <ComponentCard
        title={
          mode === "myAudits"
            ? "Calendar – My Audits"
            : "Calendar – Auditee Free Slots"
        }
      >
        {/* Month navigation + jump */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentDate(addMonths(currentDate, -1))}
              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              ◀ Previous month
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              Next month ▶
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Go to month:</span>
            <input
              type="month"
              value={monthValue}
              onChange={handleMonthChange}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="h-[650px]">
          <BigCalendar
            localizer={localizer}
            events={filteredEvents as any}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter as any}
            popup
            views={["month"]} // only month view
            defaultView="month"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date as Date)}
            onSelectEvent={(event: any) =>
              setSelectedEvent(event as CalendarEvent)
            }
          />
        </div>

        {/* Legend depends on mode */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
          {mode === "myAudits" ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#579BFC]" />
              <span>Audit</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#00C875]" />
              <span>Auditee free slot (available)</span>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* UPCOMING LIST (audits OR free slots) */}
      <ComponentCard
        title={
          mode === "myAudits"
            ? "My Next Audits"
            : "Next Free Slots for this Auditee"
        }
      >
        {mode === "auditeeAvailability" && selectedAuditee === "all" ? (
          <p className="text-sm text-gray-500">
            Select an auditee above to see their free time slots.
          </p>
        ) : upcomingItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming items for the current selection.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcomingItems.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {e.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {e.start.toLocaleDateString()}{" "}
                    {e.start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {e.end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Auditor: {e.auditor || "—"} • Auditee: {e.auditee}
                    {e.location && ` • ${e.location}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(e);
                    setCurrentDate(e.start);
                  }}
                  className="text-xs rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  Show in calendar
                </button>
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>

      {/* EVENT DETAILS POPUP */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        className="max-w-[600px] p-6 lg:p-8"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              {selectedEvent.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Type:</span>{" "}
              {selectedEvent.type === "audit" ? "Audit" : "Auditee free slot"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Auditor:</span>{" "}
              {selectedEvent.auditor || "—"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Auditee:</span>{" "}
              {selectedEvent.auditee}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">When:</span>{" "}
              {selectedEvent.start.toLocaleDateString()}{" "}
              {selectedEvent.start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {selectedEvent.end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {selectedEvent.location && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Location:</span>{" "}
                {selectedEvent.location}
              </p>
            )}

            {selectedEvent.type === "auditee-free" && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
                This is a free time slot for the auditee. You can plan a new
                audit here.
              </p>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
