import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge, { BadgeColor } from "../../ui/badge/Badge";
import AuditDetailsModal from "../../modals/AuditDetailsModal";
import RescheduleAuditModal from "../../modals/RescheduleModal";
import AuditHistoryModal from "../../modals/AuditHistoryModal";
import { Audit } from "../../../types";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import Pagination from "../../ui/pagination/pagination";
import { toast } from "react-hot-toast";
import axios from "axios";
import CompactReportActions from "../../report/CompactReportActions";
import PDFPreviewModal from "../../report/PDFPreviewModal";

interface TableAuditsProps {
  audits: Audit[];
}

// Report status tracking
interface ReportStatus {
  [auditId: number]: {
    generating: boolean;
    available: boolean;
    error?: string;
  };
}

export default function TableAudits({ audits = [] }: TableAuditsProps) {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [rescheduleAudit, setRescheduleAudit] = useState<Audit | null>(null);
  const [historyAudit, setHistoryAudit] = useState<Audit | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOngoing, setShowOngoing] = useState(true);

  const [reportStatus, setReportStatus] = useState<ReportStatus>({});

  // PDF Preview State
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [currentPreviewAudit, setCurrentPreviewAudit] = useState<Audit | null>(
    null
  );

  const user = useSelector((state: any) => state.auth.user);

  const normalizedStatus = (s?: string) => (s ?? "").toLowerCase();
  const displayStatus = (s?: string) =>
    (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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

  const onReschedule = (audit: Audit) => setRescheduleAudit(audit);

  // Separate ongoing and completed audits
  const ongoingAudits = audits.filter(
    (a) => normalizedStatus(a.status) !== "completed"
  );
  const completedAudits = audits.filter(
    (a) => normalizedStatus(a.status) === "completed"
  );

  // Pagination state
  const [ongoingPage, setOngoingPage] = useState(1);
  const [ongoingPageSize, setOngoingPageSize] = useState(5);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPageSize, setCompletedPageSize] = useState(5);

  const totalPagesOngoing = Math.ceil(ongoingAudits.length / ongoingPageSize);
  const paginatedOngoing = ongoingAudits.slice(
    (ongoingPage - 1) * ongoingPageSize,
    ongoingPage * ongoingPageSize
  );

  const totalPagesCompleted = Math.ceil(
    completedAudits.length / completedPageSize
  );
  const paginatedCompleted = completedAudits.slice(
    (completedPage - 1) * completedPageSize,
    completedPage * completedPageSize
  );

  // Check report existence when completed audits are shown
  useEffect(() => {
    if (showCompleted && completedAudits.length > 0) {
      checkAllReportsExistence();
    }
  }, [showCompleted, completedAudits.length]);

  // ------------------------ Report Functions ------------------------

  const checkAllReportsExistence = async () => {
    const statusUpdates: ReportStatus = {};

    await Promise.all(
      completedAudits.map(async (audit) => {
        try {
          const response = await axios.get(
            `/api/reports/${audit.id}/report-status`
          );
          statusUpdates[audit.id] = {
            generating: false,
            available: response.data.report_exists || false,
          };
        } catch (error) {
          statusUpdates[audit.id] = {
            generating: false,
            available: false,
          };
        }
      })
    );

    setReportStatus(statusUpdates);
  };

  const handlePreviewPDF = async (audit: Audit) => {
    try {
      // Check if report exists first
      const statusResponse = await axios.get(
        `/api/reports/${audit.id}/report-status`
      );

      if (!statusResponse.data.report_exists) {
        toast.error("Report not generated yet. Please generate it first.", {
          style: {
            borderRadius: "16px",
            background: "#dc2626",
            color: "#fff",
            padding: "16px",
          },
        });
        return;
      }

      // Set the preview URL and open modal
      setPreviewPdfUrl(`/api/reports/${audit.id}/preview-pdf`);
      setCurrentPreviewAudit(audit);
      setPdfPreviewOpen(true);
    } catch (error: any) {
      console.error("Error checking report status:", error);
      toast.error("Failed to load PDF preview", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
    }
  };

  const handleDownloadFromPreview = async () => {
    if (currentPreviewAudit) {
      await downloadReport(
        currentPreviewAudit.id,
        currentPreviewAudit.audit_number
      );
      // Keep modal open after download
    }
  };

  const generateReport = async (audit: Audit) => {
    const auditId = audit.id;

    setReportStatus((prev) => ({
      ...prev,
      [auditId]: { generating: true, available: false },
    }));

    const loadingToast = toast.loading(
      `✨ Generating report for ${audit.audit_number}...`,
      {
        style: {
          borderRadius: "16px",
          background: "#1e293b",
          color: "#fff",
          padding: "16px",
        },
      }
    );

    try {
      const response = await axios.post(
        `/api/reports/${auditId}/generate-report`
      );

      if (response.data.success) {
        setReportStatus((prev) => ({
          ...prev,
          [auditId]: { generating: false, available: true },
        }));

        toast.success("🎉 Report generated successfully!", {
          id: loadingToast,
          style: {
            borderRadius: "16px",
            background: "#059669",
            color: "#fff",
            padding: "16px",
          },
        });

        // Auto-download
        // await downloadReport(auditId, audit.audit_number);
      } else {
        throw new Error("Report generation failed");
      }
    } catch (error: any) {
      console.error("Error generating report:", error);

      setReportStatus((prev) => ({
        ...prev,
        [auditId]: {
          generating: false,
          available: false,
          error: error.response?.data?.detail || "Failed to generate report",
        },
      }));

      toast.error(
        error.response?.data?.detail || "❌ Failed to generate report",
        {
          id: loadingToast,
          style: {
            borderRadius: "16px",
            background: "#dc2626",
            color: "#fff",
            padding: "16px",
          },
        }
      );
    }
  };

  const downloadReport = async (auditId: number, auditNumber: string) => {
    try {
      const response = await axios.get(
        `/api/reports/${auditId}/download-report`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_report_${auditNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("📄 Report downloaded successfully!", {
        style: {
          borderRadius: "16px",
          background: "#0891b2",
          color: "#fff",
          padding: "16px",
        },
      });
    } catch (error: any) {
      console.error("Error downloading report:", error);
      toast.error("❌ Failed to download report", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
    }
  };

  // ------------------------ Headers ------------------------
  const ONGOING_HEADERS: string[] = [
    "#Audit Identifier",
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

  const COMPLETED_HEADERS: string[] = [
    "#Audit ID",
    "Auditor",
    "Auditee",
    "Plant",
    "Sector",
    "Planned Dates",
    "Final Score",
    "Actions",
  ];

  // ------------------------ Row Renderers ------------------------
  const renderOngoingRow = (audit: Audit) => (
    <TableRow
      key={audit.id}
      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-150"
    >
      <TableCell className="text-gray-700 dark:text-gray-300 text-sm font-semibold px-5 py-4 border-r border-gray-200 dark:border-white/10">
        {audit.audit_number}
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <div className="text-sm">
          <div className="font-semibold text-gray-800 dark:text-gray-100">
            {audit.auditor?.first_name} {audit.auditor?.last_name}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {audit.auditor?.email}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <div className="text-sm space-y-1">
          {audit.auditees?.map((email, i) => (
            <div key={i} className="text-gray-600 dark:text-gray-300 text-xs">
              {email}
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
        {audit.plant || "-"}
      </TableCell>
      <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
        {audit.sector || "-"}
      </TableCell>
      <TableCell className="text-xs px-5 py-4 text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
        {audit.planned_start_date || "-"}
      </TableCell>
      <TableCell className="text-xs px-5 py-4 text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
        {audit.planned_end_date || "-"}
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <Badge size="sm" color={badgeColorForStatus(audit.status)}>
          {displayStatus(audit.status)}
        </Badge>
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <Badge size="sm" color={audit.event_created ? "success" : "light"}>
          {audit.event_created ? "Yes" : "No"}
        </Badge>
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <button
          disabled={user?.email !== audit?.auditor?.email}
          onClick={() =>
            user?.email === audit?.auditor?.email && onReschedule(audit)
          }
          className={`rounded-lg text-white text-xs font-semibold px-4 py-2 transition-all duration-200 shadow-sm
            ${
              user?.email === audit?.auditor?.email
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-md transform hover:scale-105"
                : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60"
            }`}
        >
          Reschedule
        </button>
      </TableCell>
      <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
        <button
          onClick={() => setHistoryAudit(audit)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-semibold hover:from-purple-600 hover:to-violet-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          History
        </button>
      </TableCell>
      <TableCell className="px-5 py-4">
        <button
          onClick={() => setSelectedAudit(audit)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          View
        </button>
      </TableCell>
    </TableRow>
  );

  const renderCompletedRow = (audit: Audit) => {
    const auditId = audit.id;
    const status = reportStatus[auditId];
    const isGenerating = status?.generating || false;
    const reportExists = status?.available || false;

    return (
      <TableRow
        key={audit.id}
        className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors duration-150"
      >
        <TableCell className="text-gray-700 dark:text-gray-300 text-sm font-semibold px-5 py-4 border-r border-gray-200 dark:border-white/10">
          {audit.audit_number}
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="text-sm">
            <div className="font-semibold text-gray-800 dark:text-gray-100">
              {audit.auditor?.first_name} {audit.auditor?.last_name}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {audit.auditor?.email}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="text-sm space-y-1">
            {audit.auditees?.map((email, i) => (
              <div key={i} className="text-gray-600 dark:text-gray-300 text-xs">
                {email}
              </div>
            ))}
          </div>
        </TableCell>
        <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
          {audit.plant || "-"}
        </TableCell>
        <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
          {audit.sector || "-"}
        </TableCell>
        <TableCell className="text-xs px-5 py-4 text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
          <div>{audit.planned_start_date || "-"}</div>
          <div className="text-gray-400 dark:text-gray-500 mt-1">
            {audit.planned_end_date || "-"}
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700">
            <span className="font-black text-green-700 dark:text-green-300 text-lg">
              {audit.finalScore ?? "-"}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4">
          <CompactReportActions
            audit={audit}
            onGenerate={() => generateReport(audit)}
            onDownload={() => downloadReport(auditId, audit.audit_number)}
            onPreview={() => handlePreviewPDF(audit)}
            isGenerating={isGenerating}
            reportExists={reportExists}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* -------------------- ONGOING AUDITS -------------------- */}
      {/* -------------------- ONGOING AUDITS -------------------- */}
      <div className="overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.03] shadow-lg shadow-gray-200/50 dark:shadow-none">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowOngoing(!showOngoing)}
          className="w-full flex items-center justify-between px-6 py-5 font-bold text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all duration-200"
        >
          <span className="flex items-center gap-3 text-lg">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
              <span className="text-sm font-bold">{ongoingAudits.length}</span>
            </span>
            Ongoing Audits
          </span>

          <motion.div
            animate={{ rotate: showOngoing ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm"
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence>
          {showOngoing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t-2 border-gray-200 dark:border-white/10"
            >
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 dark:border-white/10">
                    <TableRow>
                      {ONGOING_HEADERS.map((h, idx) => (
                        <TableCell
                          key={h}
                          isHeader
                          className={`text-sm px-5 py-4 font-bold text-gray-700 dark:text-gray-300  tracking-wide ${
                            idx < ONGOING_HEADERS.length - 1
                              ? "border-r border-gray-300 dark:border-white/20"
                              : ""
                          }`}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y-2 divide-gray-100 dark:divide-white/5">
                    {paginatedOngoing.length > 0 ? (
                      paginatedOngoing.map(renderOngoingRow)
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={ONGOING_HEADERS.length}
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg
                              className="w-16 h-16 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <p className="text-lg font-semibold">
                              No ongoing audits
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPagesOngoing > 0 && (
                <div className="border-t-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50">
                  <Pagination
                    currentPage={ongoingPage}
                    totalPages={totalPagesOngoing}
                    pageSize={ongoingPageSize}
                    onPageChange={setOngoingPage}
                    onPageSizeChange={(size) => {
                      setOngoingPageSize(size);
                      setOngoingPage(1);
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -------------------- COMPLETED AUDITS -------------------- */}
      <div className="border-2 border-gray-200 dark:border-white/20 bg-white rounded-2xl dark:bg-white/[0.03] shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full flex items-center justify-between px-6 py-5 font-bold text-gray-700 dark:text-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200"
        >
          <span className="flex items-center gap-3 text-lg">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md">
              <span className="text-sm font-bold">
                {completedAudits.length}
              </span>
            </span>
            Completed Audits
          </span>
          <motion.div
            animate={{ rotate: showCompleted ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm"
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showCompleted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t-2 border-gray-200 dark:border-white/10"
            >
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border-b-2 border-gray-200 dark:border-white/10">
                    <TableRow>
                      {COMPLETED_HEADERS.map((h, idx) => (
                        <TableCell
                          key={h}
                          isHeader
                          className={`text-sm px-5 py-4 font-bold text-gray-700 dark:text-gray-300  tracking-wide ${
                            idx < COMPLETED_HEADERS.length - 1
                              ? "border-r border-gray-300 dark:border-white/20"
                              : ""
                          }`}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y-2 divide-gray-100 dark:divide-white/5">
                    {paginatedCompleted.length > 0 ? (
                      paginatedCompleted.map(renderCompletedRow)
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={COMPLETED_HEADERS.length}
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg
                              className="w-16 h-16 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-lg font-semibold">
                              No completed audits
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {totalPagesCompleted > 0 && (
                  <div className="border-t-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50">
                    <Pagination
                      currentPage={completedPage}
                      totalPages={totalPagesCompleted}
                      pageSize={completedPageSize}
                      onPageChange={setCompletedPage}
                      onPageSizeChange={(size) => {
                        setCompletedPageSize(size);
                        setCompletedPage(1);
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -------------------- Modals -------------------- */}
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

      {/* PDF Preview Modal */}
      {pdfPreviewOpen && currentPreviewAudit && (
        <PDFPreviewModal
          isOpen={pdfPreviewOpen}
          onClose={() => {
            setPdfPreviewOpen(false);
            setPreviewPdfUrl("");
            setCurrentPreviewAudit(null);
          }}
          pdfUrl={previewPdfUrl}
          auditNumber={currentPreviewAudit.audit_number}
          onDownload={handleDownloadFromPreview}
        />
      )}
    </div>
  );
}
