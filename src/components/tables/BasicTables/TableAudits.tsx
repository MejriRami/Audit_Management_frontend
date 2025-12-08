import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge, { BadgeColor } from "../../ui/badge/Badge";
import AuditDetailsModal from "../../modals/AuditDetailsModal";
import { Audit } from "../../../types";

import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import RescheduleAuditModal from "../../modals/RescheduleModal";
import AuditHistoryModal from "../../modals/AuditHistoryModal";
import { useSelector } from "react-redux";

export default function TableAudits({ audits }: { audits: Audit[] }) {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const normalizedStatus = (s?: string) => (s ?? "").toLowerCase();
  const displayStatus = (s?: string) =>
    (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // FILTER GROUPS
  const ongoingAudits = audits.filter(
    (a) => normalizedStatus(a.status) !== "completed"
  );
  const completedAudits = audits.filter(
    (a) => normalizedStatus(a.status) === "completed"
  );

  // BADGE COLOR LOGIC
  const badgeColorForStatus = (status?: string): BadgeColor => {
    const s = normalizedStatus(status);
    switch (s) {
      case "planned":
        return "info";
      case "completed":
        return "success";
      case "rescheduled":
        return "warning";
      case "waiting_for_corrective_actions":
        return "error";
      case "cancelled":
        return "info";
      default:
        return "light";
    }
  };
  const [rescheduleAudit, setRescheduleAudit] = useState<Audit | null>(null);

  const onReschedule = (audit: Audit) => {
    setRescheduleAudit(audit);
  };
  const [historyAudit, setHistoryAudit] = useState<Audit | null>(null);
  const user = useSelector((state: any) => state.auth.user);

  // -------------------- add new header --------------------
  const ONGOING_HEADERS: string[] = [
    "#Audit Identifer",
    "Auditor",
    "Auditee",
    "Plant",
    "Sector",
    "Planned Start",
    "Planned End",
    "Status",
    "Event Created",
    "Action",
    "History",
    "Details",
  ];

  const COMPLETED_HEADERS = [
    "#Audit ID",
    "Auditor",
    "Auditee",
    "Plant",
    "Sector",
    "Planned Start",
    "Planned End",
    "Final Score",
    "Event Created", // <--- new column
    "Action",
  ];

  // -------------------- update row renderers --------------------
  const renderOngoingRow = (audit: Audit) => (
    <TableRow key={audit.id}>
      <TableCell className="text-gray-500 text-xs px-4">
        {audit.audit_number}
      </TableCell>

      {/* Auditor */}
      <TableCell className="px-5 py-4">
        <div className="text-sm">
          <div className="font-medium">
            {audit.auditor?.first_name} {audit.auditor?.last_name}
          </div>
          <div className="text-gray-500 text-xs">{audit.auditor?.email}</div>
        </div>
      </TableCell>

      {/* Auditees */}
      <TableCell className="px-5 py-4">
        <div className="text-sm">
          {audit.auditees?.map((email, index) => (
            <div key={index} className="text-gray-500 text-xs">
              {email}
            </div>
          ))}
        </div>
      </TableCell>

      <TableCell className="text-sm px-4 py-3">{audit.plant || "-"}</TableCell>
      <TableCell className="text-sm px-4 py-3">{audit.sector || "-"}</TableCell>

      <TableCell className="text-xs px-4 py-3">
        {audit.planned_start_date || "-"}
      </TableCell>
      <TableCell className="text-xs px-4 py-3">
        {audit.planned_end_date || "-"}
      </TableCell>

      {/* STATUS BADGE */}
      <TableCell className="px-4 py-3">
        <Badge size="sm" color={badgeColorForStatus(audit.status)}>
          {displayStatus(audit.status)}
        </Badge>
      </TableCell>

      {/* EVENT CREATED */}
      <TableCell className="px-4 py-3">
        <Badge size="sm" color={audit.event_created ? "success" : "light"}>
          {audit.event_created ? "Yes" : "No"}
        </Badge>
      </TableCell>
      {/* RESCHEDULE BUTTON */}
      <TableCell className="px-4 py-3">
        <button
          disabled={user?.email !== audit?.auditor?.email}
          onClick={() =>
            user?.email === audit?.auditor?.email && onReschedule(audit)
          }
          className={`rounded-full text-white text-xs font-medium px-3 py-1 transition
    ${
      user?.email === audit?.auditor?.email
        ? "bg-yellow-500 hover:bg-yellow-600"
        : "bg-gray-400 cursor-not-allowed"
    }`}
        >
          Reschedule
        </button>
      </TableCell>

      <TableCell className="px-4 py-3">
        <button
          onClick={() => setHistoryAudit(audit)}
          className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold 
               hover:bg-purple-200 transition shadow-sm"
        >
          History
        </button>
      </TableCell>

      <TableCell className="px-4 py-3">
        <button
          onClick={() => setSelectedAudit(audit)}
          className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold
               hover:bg-blue-200 transition shadow-sm"
        >
          View
        </button>
      </TableCell>
    </TableRow>
  );

  const renderCompletedRow = (audit: Audit) => (
    <TableRow key={audit.id}>
      <TableCell className="px-4 py-3">{audit.audit_number}</TableCell>

      {/* Auditor */}
      <TableCell className="px-5 py-4">
        <div className="text-sm">
          <div className="font-medium">
            {audit.auditor?.first_name} {audit.auditor?.last_name}
          </div>
          <div className="text-gray-500 text-xs">{audit.auditor?.email}</div>
        </div>
      </TableCell>

      {/* Auditees */}
      <TableCell className="px-5 py-4">
        <div className="text-sm">
          {audit.auditees?.map((email, index) => (
            <div key={index} className="text-gray-500 text-xs">
              {email}
            </div>
          ))}
        </div>
      </TableCell>

      <TableCell className="text-sm px-4 py-3">{audit.plant || "-"}</TableCell>
      <TableCell className="text-sm px-4 py-3">{audit.sector || "-"}</TableCell>

      <TableCell className="text-xs px-4 py-3">
        {audit.planned_start_date || "-"}
      </TableCell>
      <TableCell className="text-xs px-4 py-3">
        {audit.planned_end_date || "-"}
      </TableCell>

      {/* Final Score */}
      <TableCell className="px-4 py-3 font-semibold text-green-600">
        {audit.finalScore ?? "-"}
      </TableCell>

      {/* EVENT CREATED */}
      <TableCell className="px-4 py-3">
        <Badge size="sm" color={audit.event_created ? "success" : "light"}>
          {audit.event_created ? "Yes" : "No"}
        </Badge>
      </TableCell>

      <TableCell className="px-4 py-3 font-semibold text-gray-600">
        <button className="rounded-lg bg-yellow-400 text-white text-xs font-small hover:bg-yellow-700 transition">
          generate a report
        </button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* -------------------- ONGOING AUDITS -------------------- */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b bg-gray-50 dark:bg-zinc-900 dark:border-white/10">
              <TableRow>
                {ONGOING_HEADERS.map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="text-sm px-5 py-3 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {ongoingAudits
                .slice()
                .sort((a, b) => a.id - b.id)
                .map(renderOngoingRow)}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedAudit && (
        <AuditDetailsModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}
      {rescheduleAudit && (
        <RescheduleAuditModal
          audit={rescheduleAudit}
          onClose={() => setRescheduleAudit(null)}
        />
      )}
      {historyAudit && (
        <AuditHistoryModal
          audit={historyAudit}
          onClose={() => setHistoryAudit(null)}
        />
      )}

      {/* -------------------- COMPLETED AUDITS COLLAPSIBLE -------------------- */}
      <div className="border border-gray-200 bg-white rounded-xl dark:bg-white/[0.03] dark:border-white/10">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full flex items-center justify-between px-6 py-4 font-semibold text-gray-700 dark:text-gray-200"
        >
          <span>Completed Audits ({completedAudits.length})</span>
          <motion.div
            animate={{ rotate: showCompleted ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDownIcon className="h-5 w-5" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showCompleted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden border-t dark:border-white/10"
            >
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-zinc-900 border-b dark:border-white/10">
                    <TableRow>
                      {COMPLETED_HEADERS.map((h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className="text-sm px-5 py-3 font-medium text-gray-600 dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {completedAudits.map(renderCompletedRow)}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
