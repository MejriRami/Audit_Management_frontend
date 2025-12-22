import { useState, ChangeEvent, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import { Modal } from "../../components/ui/modal";

import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Enum from "../../components/enum/Enum";
import { useDispatch, useSelector } from "react-redux";
import { getAuditsByAuditor } from "../../redux/audit/audit";
import PaginationCalendarCard from "../../components/ui/pagination/PaginationCalendarCard";

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
  status?: string;
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

export default function AuditsCalendar() {
  const dispatch = useDispatch();
  const [mode] = useState<Mode>("myAudits");
  // const [mode, setMode] = useState<Mode>("myAudits");
  const [selectedAuditor, setSelectedAuditor] = useState<string | number>("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const { auditorOptions } = Enum();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { calendarItems, cardsItems } = useSelector(
    (state: any) => state.audit
  );
  const convertToEvent = (audit: any): CalendarEvent => ({
    id: audit.id,
    title: `Audit ${audit.audit_number}`,
    start: new Date(audit.planned_start_date),
    end: new Date(audit.planned_end_date),
    auditor: audit?.auditor
      ? `${audit.auditor.first_name} ${audit.auditor.last_name}`
      : "—",
    auditee: audit.auditees?.join(", ") || "—",
    type: "audit",
    status: audit.status,
  });
  const [page, setPage] = useState(1);
  const per_page = 3;

  const eventStyleGetter = (event: CalendarEvent) => {
    let bgColor = "#579BFC";
    if (event.status === "rescheduled") {
      bgColor = "#FFB347";
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    setSelectedAuditor(auditorOptions.map((opt: any) => opt.value)[0]);
  }, [auditorOptions]);

  useEffect(() => {
    if (!selectedAuditor) return;

    getAuditsByAuditor(
      dispatch,
      selectedAuditor as number,
      "cards",
      page,
      per_page
    );
  }, [dispatch, selectedAuditor, page, per_page]);

  useEffect(() => {
    if (!selectedAuditor) return;

    getAuditsByAuditor(dispatch, selectedAuditor as number, "calendar");
  }, [dispatch, selectedAuditor]);

  return (
    <div className="p-6 space-y-8">
      <PageMeta
        title="Audits Calendar"
        description="Plan audits and see auditee availability"
      />
      <PageBreadcrumb pageTitle="Audits Calendar" />

      {/* MODE SWITCH */}
      {/* <ComponentCard title="Mode">
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
      </ComponentCard> */}

      {/* FILTERS */}
      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Auditors
            </p>
            <Select
              options={auditorOptions}
              defaultValue={selectedAuditor}
              onChange={(value: string | number) => setSelectedAuditor(value)}
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
      </ComponentCard>

      {/* MAIN CALENDAR (MONTH ONLY) */}
      <ComponentCard
        title={
          mode === "myAudits"
            ? "Calendar – My Audits"
            : "Calendar – Auditee Free Slots"
        }
      >
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
            events={
              calendarItems?.items?.map((audit: any) =>
                convertToEvent(audit)
              ) || []
            }
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter as any}
            popup
            views={["month"]}
            defaultView="month"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date as Date)}
            onSelectEvent={(event: any) =>
              setSelectedEvent(event as CalendarEvent)
            }
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#579BFC]" />
            <span>Audit - planned</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#FFB347]" />
            <span>Audit - rescheduled</span>
          </div>
        </div>
      </ComponentCard>

      {/* UPCOMING LIST (audits OR free slots) */}
      {cardsItems?.items?.length > 0 && (
        <ComponentCard
          title={
            mode === "myAudits"
              ? "My Next Audits"
              : "Next Free Slots for this Auditee"
          }
        >
          <ul className="space-y-3">
            {cardsItems?.items?.map((e: any) => (
              <li
                key={e.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {e.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(e.planned_start_date).toLocaleDateString()}{" "}
                    {new Date(e.planned_start_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(e.planned_end_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-1 gap-2">
                    <span>
                      <strong>Auditor:</strong> {e?.auditor.first_name}{" "}
                      {e?.auditor.last_name}
                    </span>

                    <span>
                      <strong>Auditee:</strong> {e.auditees.join(", ")}
                    </span>

                    <span>
                      <strong>Plant:</strong> {e.plant}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    const event = convertToEvent(e);
                    setSelectedEvent(event);
                    setCurrentDate(event.start);
                  }}
                  className="text-xs rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  Show in calendar
                </button>
              </li>
            ))}
          </ul>
          <PaginationCalendarCard
            page={calendarItems?.page}
            totalPages={calendarItems?.total_pages}
            onPageChange={handlePageChange}
          />
        </ComponentCard>
      )}

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
