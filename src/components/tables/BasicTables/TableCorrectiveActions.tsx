import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { CorrectiveAction, CorrectiveActionStatus } from "../../../types";
import { ReasonModal } from "../../modals/ReasonModal";
import Badge from "../../ui/badge/Badge";

interface TableCorrectiveActionsProps {
  correctiveActions: CorrectiveAction[];
  onRefresh?: () => void;
}

const statusColorMap: Record<CorrectiveActionStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Submitted: "bg-blue-100 text-blue-800",
  Accepted: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Completed: "bg-gray-100 text-green-700",
};

export default function TableCorrectiveActions({
  correctiveActions,
  onRefresh,
}: TableCorrectiveActionsProps) {
  const [actions, setActions] = useState<CorrectiveAction[]>(correctiveActions);

  useEffect(() => {
    setActions(correctiveActions ?? []);
  }, [correctiveActions]);

  const [expandedAudits, setExpandedAudits] = useState<Record<number, boolean>>({});
  const [expandedStatus, setExpandedStatus] = useState<Record<string, boolean>>({});

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    actionId: number | null;
  }>({ open: false, actionId: null });

  const toggleAudit = (auditId: number) => {
    setExpandedAudits((prev) => ({ ...prev, [auditId]: !prev[auditId] }));
  };

  const toggleStatus = (auditId: number, status: CorrectiveActionStatus) => {
    const key = `${auditId}-${status}`;
    setExpandedStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

  const handleAccept = async (id: number) => {
    setActions((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Accepted" } : c)));

    try {
      await api.post(
        `/car/admin/${id}/review`,
        { decision: "ACCEPT" },
        { headers: authHeaders }
      );
      onRefresh?.();
    } catch (e) {
      setActions((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Submitted" } : c)));
      console.error(e);
      alert("Failed to accept CAR (backend error).");
    }
  };

  const handleReject = async (id: number, reason: string) => {
    setActions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Rejected", reason_why: reason } : c))
    );

    try {
      await api.post(
        `/car/admin/${id}/review`,
        { decision: "REJECT", comment: reason },
        { headers: authHeaders }
      );
      onRefresh?.();
    } catch (e) {
      setActions((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "Submitted", reason_why: undefined } : c
        )
      );
      console.error(e);
      alert("Failed to reject CAR (backend error).");
    }
  };

  if (!actions?.length)
    return <p className="text-gray-500 p-4">No corrective actions found.</p>;

  // Group by auditId
  const groupedByAudit = actions.reduce<Record<number, CorrectiveAction[]>>((acc, action) => {
    if (!acc[action.auditId]) acc[action.auditId] = [];
    acc[action.auditId].push(action);
    return acc;
  }, {});

  const headers = [
    "Audit Number",
    "Plant",
    "Sector",
    "Audit Question",
    "CAR Description",
    "Implemented Solution",
    "Root Cause",
    "Fail / Evidence",
    "Auditee",
    "Pilot User",
    "Reason Why",
    "Due Date",
    "Escalated",
    "",
  ];

  return (
    <div className="space-y-4">
      {Object.entries(groupedByAudit).map(([auditId, auditActions]) => {
        const auditNum = Number(auditId);
        const isAuditExpanded = expandedAudits[auditNum] || false;

        // Group by status
        const groupedByStatus = auditActions.reduce<Record<string, CorrectiveAction[]>>(
          (acc, action) => {
            if (!acc[action.status]) acc[action.status] = [];
            acc[action.status].push(action);
            return acc;
          },
          {}
        );

        const head = auditActions[0];
        const headerLabel = [
          `Audit Number: ${head?.auditNumber ?? auditId}`,
          `Plant: ${head?.plant ?? "-"}`,
          `Sector: ${head?.sector ?? "-"}`,
          head?.due_date ? `Due: ${head.due_date}` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        return (
          <div
            key={auditId}
            className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] shadow-sm"
          >
            {/* Audit Header */}
            <div
              onClick={() => toggleAudit(auditNum)}
              className="flex justify-between items-center px-5 py-3 bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                {headerLabel}
              </span>
              <motion.div
                animate={{ rotate: isAuditExpanded ? 180 : 0 }}
                className="w-5 h-5 text-gray-500"
              >
                <ChevronDownIcon />
              </motion.div>
            </div>

            {/* Status Sections */}
            <AnimatePresence>
              {isAuditExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 px-5 py-3 overflow-hidden"
                >
                  {Object.entries(groupedByStatus).map(([status, actionsByStatus]) => {
                    const statusKey = `${auditNum}-${status}`;
                    const isStatusExpanded = expandedStatus[statusKey] || false;

                    return (
                      <div key={status}>
                        {/* Status Header */}
                        <div
                          onClick={() => toggleStatus(auditNum, status as CorrectiveActionStatus)}
                          className="flex justify-between items-center cursor-pointer bg-gray-100 dark:bg-white/10 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-white/20 transition"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {status} ({actionsByStatus.length})
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              statusColorMap[status as CorrectiveActionStatus]
                            }`}
                          >
                            {status}
                          </span>
                          <motion.div
                            animate={{ rotate: isStatusExpanded ? 180 : 0 }}
                            className="w-4 h-4 text-gray-500"
                          >
                            <ChevronDownIcon />
                          </motion.div>
                        </div>

                        {/* Table */}
                        <AnimatePresence>
                          {isStatusExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="max-w-full overflow-x-auto mt-2 rounded border border-gray-200 dark:border-white/10"
                            >
                              <Table>
                                <TableHeader className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-100 font-semibold text-[15px] tracking-wide">
                                  <TableRow>
                                    {headers.map((h) => (
                                      <TableCell
                                        key={h}
                                        isHeader
                                        className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                      >
                                        {h}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                  {actionsByStatus.map((c) => (
                                    <TableRow
                                      key={c.id}
                                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition"
                                    >
                                      <TableCell className="px-4 py-3">
                                        {c.auditNumber ?? c.auditId}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.plant ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.sector ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.auditQuestion ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.carDescription ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.implementedSolution ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.rootCause ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-semibold">FAIL</span>
                                          {c.evidenceFiles?.length ? (
                                            c.evidenceFiles.map((f) => (
                                              <a
                                                key={f.id}
                                                href={f.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 underline"
                                              >
                                                {f.filename ?? "Evidence"}
                                              </a>
                                            ))
                                          ) : (
                                            <span>-</span>
                                          )}
                                        </div>
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.auditee ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.pilotUser ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.reason_why ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.due_date ?? "-"}
                                      </TableCell>

                                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.escalated ? "Yes" : "No"}
                                      </TableCell>

                                      {/* Action buttons */}
                                      <TableCell className="px-4 py-3">
                                        {c.status === "Submitted" && (
                                          <div className="flex items-center space-x-2">
                                            <button
                                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                              onClick={() => handleAccept(c.id)}
                                            >
                                              Accept
                                            </button>
                                            <button
                                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                              onClick={() =>
                                                setRejectModal({ open: true, actionId: c.id })
                                              }
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}

                                        {c.status === "Rejected" && c.reason_why && (
                                          <div className="mt-1 border-l-4 border-red-500 pl-2 text-xs text-black-600">
                                            <div className="flex items-center gap-2">
                                              <Badge size="sm" color="error">
                                                Rejected
                                              </Badge>
                                            </div>
                                            <p className="mt-1">
                                              <span className="font-semibold">Reason:</span>{" "}
                                              {c.reason_why}
                                            </p>
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reject Modal */}
            <ReasonModal
              open={rejectModal.open}
              onClose={() => setRejectModal({ open: false, actionId: null })}
              onSubmit={(reason) => {
                if (rejectModal.actionId) handleReject(rejectModal.actionId, reason);
                setRejectModal({ open: false, actionId: null });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

