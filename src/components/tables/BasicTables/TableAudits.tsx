import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
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
import SendReportEmailModal from "../../report/SendReportEmailModal";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileQuestion,
  LucideIcon,
  User,
  Users,
  XCircle,
} from "lucide-react";
interface TableAuditsProps {
  audits: Audit[];
}

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

  // Email modal / state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [currentEmailAudit, setCurrentEmailAudit] = useState<Audit | null>(
    null
  );
  const [sendingEmails, setSendingEmails] = useState<{
    [auditId: number]: boolean;
  }>({});
  const [emailsSent, setEmailsSent] = useState<{ [auditId: number]: boolean }>(
    {}
  );

  const user = useSelector((state: any) => state.auth.user);

  const normalizedStatus = (s?: string) => (s ?? "").toLowerCase();
  const displayStatus = (s?: string) =>
    (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  type AuditStatus =
    | "planned"
    | "completed"
    | "rescheduled"
    | "waiting_for_corrective_actions"
    | "cancelled";

  interface StatusConfig {
    icon: LucideIcon;
    classes: string;
    dot: string;
  }

  const getStatusConfig = (status?: string): StatusConfig => {
    const s = normalizedStatus(status) as AuditStatus;

    const configs: Record<AuditStatus, StatusConfig> = {
      planned: {
        icon: Calendar,
        classes:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      },
      completed: {
        icon: CheckCircle,
        classes:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        dot: "bg-green-500",
      },
      rescheduled: {
        icon: Clock,
        classes:
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      },
      waiting_for_corrective_actions: {
        icon: AlertCircle,
        classes:
          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
        dot: "bg-red-500 animate-pulse",
      },
      cancelled: {
        icon: XCircle,
        classes:
          "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
        dot: "bg-gray-500",
      },
    };

    return (
      configs[s] || {
        icon: FileQuestion,
        classes:
          "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        dot: "bg-gray-400",
      }
    );
  };
  const canHaveReport = (audit: Audit) => {
    const s = normalizedStatus(audit.status);
    return s !== "planned" && s !== "rescheduled";
  };

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

  // ------------------------ Report + Email Status ------------------------

  const checkAllReportsExistence = async (list: Audit[]) => {
    const statusUpdates: ReportStatus = {};

    await Promise.all(
      list.map(async (audit) => {
        // ✅ Skip planned/rescheduled (no report by definition)
        if (!canHaveReport(audit)) {
          statusUpdates[audit.id] = { generating: false, available: false };
          return;
        }

        try {
          const response = await axios.get(
            `/api/reports/${audit.id}/report-status`
          );
          statusUpdates[audit.id] = {
            generating: false,
            available: response.data.report_exists || false,
          };
        } catch {
          statusUpdates[audit.id] = { generating: false, available: false };
        }
      })
    );

    setReportStatus((prev) => ({ ...prev, ...statusUpdates }));
  };

  // const checkEmailStatus = async (list: Audit[]) => {
  //   const statusUpdates: { [auditId: number]: boolean } = {};

  //   await Promise.all(
  //     list.map(async (audit) => {
  //       // ✅ If no report possible, email is also not possible
  //       if (!canHaveReport(audit)) {
  //         statusUpdates[audit.id] = false;
  //         return;
  //       }

  //       try {
  //         const response = await axios.get(
  //           `/api/reports/${audit.id}/email-status`
  //         );
  //         statusUpdates[audit.id] = response.data.email_sent || false;
  //       } catch {
  //         statusUpdates[audit.id] = false;
  //       }
  //     })
  //   );

  //   setEmailsSent((prev) => ({ ...prev, ...statusUpdates }));
  // };

  useEffect(() => {
    if (showCompleted && completedAudits.length > 0) {
      checkAllReportsExistence(completedAudits);
      // checkEmailStatus(completedAudits);
    }
  }, [showCompleted, completedAudits.length]);

  useEffect(() => {
    if (showOngoing && ongoingAudits.length > 0) {
      checkAllReportsExistence(ongoingAudits);
      // checkEmailStatus(ongoingAudits);
    }
  }, [showOngoing, ongoingAudits.length]);

  // ------------------------ Report Actions ------------------------

  // ------------------------ Report Actions ------------------------
  const handlePreviewPDF = async (audit: Audit) => {
    if (!canHaveReport(audit)) {
      toast.error("No report available until the audit is executed.", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
      return;
    }

    try {
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
    }
  };

  const generateReport = async (audit: Audit) => {
    if (!canHaveReport(audit)) {
      toast.error("Report can only be generated after audit execution.", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
      return;
    }

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

        // Automatically send email after successful report generation
        await sendEmailAutomatically(audit);
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

  // ✅ NEW FUNCTION: Automatically send email after report generation
  const sendEmailAutomatically = async (audit: Audit) => {
    const auditId = audit.id;

    // Get all auditees as recipients
    const recipients = audit.auditees || [];

    if (recipients.length === 0) {
      toast.error("No recipients found for this audit", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
      return;
    }

    setSendingEmails((prev) => ({ ...prev, [auditId]: true }));

    const emailToast = toast.loading(
      `📧 Sending report to ${recipients.length + 1} recipient(s)...`,
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
      const response = await axios.post(`/api/reports/${auditId}/send-email`, {
        recipients,
        include_auditor: true, // Always include auditor in automatic emails
      });

      if (response.data.success) {
        setEmailsSent((prev) => ({ ...prev, [auditId]: true }));
        toast.success(
          `✅ Report sent successfully to ${
            response.data.sent_to?.length || 0
          } recipient(s)!`,
          {
            id: emailToast,
            style: {
              borderRadius: "16px",
              background: "#059669",
              color: "#fff",
              padding: "16px",
            },
          }
        );
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(
        error.response?.data?.detail || "❌ Failed to send report via email",
        {
          id: emailToast,
          style: {
            borderRadius: "16px",
            background: "#dc2626",
            color: "#fff",
            padding: "16px",
          },
        }
      );
    } finally {
      setSendingEmails((prev) => ({ ...prev, [auditId]: false }));
    }
  };

  const downloadReport = async (auditId: number, auditNumber: string) => {
    try {
      const response = await axios.get(
        `/api/reports/${auditId}/download-report`,
        { responseType: "blob" }
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

  const handleOpenEmailModal = (audit: Audit) => {
    if (!canHaveReport(audit)) {
      toast.error("Email can only be sent after a report exists.", {
        style: {
          borderRadius: "16px",
          background: "#dc2626",
          color: "#fff",
          padding: "16px",
        },
      });
      return;
    }

    setCurrentEmailAudit(audit);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (
    recipients: string[],
    includeAuditor: boolean
  ) => {
    if (!currentEmailAudit) return;

    const auditId = currentEmailAudit.id;
    setSendingEmails((prev) => ({ ...prev, [auditId]: true }));

    const loadingToast = toast.loading(
      `📧 Sending report to ${
        recipients.length + (includeAuditor ? 1 : 0)
      } recipient(s)...`,
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
      const response = await axios.post(`/api/reports/${auditId}/send-email`, {
        recipients,
        include_auditor: includeAuditor,
      });

      if (response.data.success) {
        setEmailsSent((prev) => ({ ...prev, [auditId]: true }));
        toast.success(
          `✅ Report sent successfully to ${
            response.data.sent_to?.length || 0
          } recipient(s)!`,
          {
            id: loadingToast,
            style: {
              borderRadius: "16px",
              background: "#059669",
              color: "#fff",
              padding: "16px",
            },
          }
        );

        setEmailModalOpen(false);
        setCurrentEmailAudit(null);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(
        error.response?.data?.detail || "❌ Failed to send report via email",
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
    } finally {
      setSendingEmails((prev) => ({ ...prev, [auditId]: false }));
    }
  };
  // ------------------------ Headers ------------------------
  const ONGOING_HEADERS: string[] = [
    "#Audit Identifier",
    "Type",
    "Questionnaire",
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
    // "Details",
    "Report",
  ];

  const COMPLETED_HEADERS: string[] = [
    "#Audit ID",
    "Type",
    "Questionnaire",
    "Auditor",
    "Auditee",
    "Plant",
    "Sector",
    "Planned Dates",
    "Final Score",
    "Report",
  ];

  // ------------------------ Rows ------------------------
  const renderOngoingRow = (audit: Audit) => {
    const auditId = audit.id;
    const status = reportStatus[auditId];
    const isGenerating = status?.generating || false;
    const reportExists = status?.available || false;
    const isSendingEmail = sendingEmails[auditId] || false;
    const emailSent = emailsSent[auditId] || false;

    const reportAllowed = canHaveReport(audit);

    return (
      <TableRow
        key={audit.id}
        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-150"
      >
        <TableCell className="text-gray-700 dark:text-gray-300 text-sm font-semibold px-5 py-4 border-r border-gray-200 dark:border-white/10">
          {audit.audit_number}
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          {audit.questionnaire?.type ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {audit.questionnaire.type}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
          {audit.questionnaire?.name || "-"}
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="group relative inline-flex items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {audit.auditor?.email.split("@")[0]}
              </span>
            </div>

            {/* Tooltip */}
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max max-w-xs px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
              {/* <div className="font-medium">
                {audit.auditor?.first_name} {audit.auditor?.last_name}
              </div> */}
              <div className="text-gray-300 dark:text-gray-400 mt-0.5">
                {audit.auditor?.email}
              </div>
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="flex flex-wrap gap-1.5">
            {audit.auditees?.slice(0, 2).map((email, i) => (
              <div key={i} className="group relative">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {email.split("@")[0]}
                  </span>
                </div>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
                  {email}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            ))}

            {/* Show +N more badge if there are additional auditees */}
            {audit.auditees && audit.auditees.length > 2 && (
              <div className="group relative">
                <div className="flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    +{audit.auditees.length - 2} more
                  </span>
                </div>

                {/* Tooltip showing all remaining emails */}
                <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max max-w-xs px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
                  {audit.auditees.slice(2).map((email, i) => (
                    <div key={i} className="py-0.5">
                      {email}
                    </div>
                  ))}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            )}
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
          {(() => {
            const config = getStatusConfig(audit.status);
            const Icon = config.icon;

            return (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.classes}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {displayStatus(audit.status)}
              </span>
            );
          })()}
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
              user?.email === audit?.auditor?.email && setRescheduleAudit(audit)
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
        {/* <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <button
            onClick={() => handleViewAuditDetails(audit.id)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            View
          </button>
        </TableCell> */}
        <TableCell className="px-5 py-4">
          {reportAllowed ? (
            <CompactReportActions
              onGenerate={() => generateReport(audit)}
              onDownload={() => downloadReport(auditId, audit.audit_number)}
              onPreview={() => handlePreviewPDF(audit)}
              onSendEmail={() => handleOpenEmailModal(audit)}
              isGenerating={isGenerating}
              reportExists={reportExists}
              emailSent={emailSent}
              isSendingEmail={isSendingEmail}
            />
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              No report (not executed)
            </span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderCompletedRow = (audit: Audit) => {
    const auditId = audit.id;
    const status = reportStatus[auditId];
    const isGenerating = status?.generating || false;
    const reportExists = status?.available || false;
    const isSendingEmail = sendingEmails[auditId] || false;
    const emailSent = emailsSent[auditId] || false;

    return (
      <TableRow
        key={audit.id}
        className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors duration-150"
      >
        <TableCell className="text-gray-700 dark:text-gray-300 text-sm font-semibold px-5 py-4 border-r border-gray-200 dark:border-white/10">
          {audit.audit_number}
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          {audit.questionnaire?.type ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              {audit.questionnaire.type}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>
          )}
        </TableCell>
        <TableCell className="text-sm px-5 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-white/10">
          {audit.questionnaire?.name || "-"}
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="group relative inline-flex items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {audit.auditor?.email.split("@")[0]}
              </span>
            </div>

            {/* Tooltip */}
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max max-w-xs px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
              {/* <div className="font-medium">
                {audit.auditor?.first_name} {audit.auditor?.last_name}
              </div> */}
              <div className="text-gray-300 dark:text-gray-400 mt-0.5">
                {audit.auditor?.email}
              </div>
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 border-r border-gray-200 dark:border-white/10">
          <div className="flex flex-wrap gap-1.5">
            {audit.auditees?.slice(0, 2).map((email, i) => (
              <div key={i} className="group relative">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {email.split("@")[0]}
                  </span>
                </div>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
                  {email}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            ))}

            {/* Show +N more badge if there are additional auditees */}
            {audit.auditees && audit.auditees.length > 2 && (
              <div className="group relative">
                <div className="flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    +{audit.auditees.length - 2} more
                  </span>
                </div>

                {/* Tooltip showing all remaining emails */}
                <div className="invisible group-hover:visible absolute left-0 top-full mt-2 z-10 w-max max-w-xs px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
                  {audit.auditees.slice(2).map((email, i) => (
                    <div key={i} className="py-0.5">
                      {email}
                    </div>
                  ))}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            )}
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
            onGenerate={() => generateReport(audit)}
            onDownload={() => downloadReport(auditId, audit.audit_number)}
            onPreview={() => handlePreviewPDF(audit)}
            onSendEmail={() => handleOpenEmailModal(audit)}
            isGenerating={isGenerating}
            reportExists={reportExists}
            emailSent={emailSent}
            isSendingEmail={isSendingEmail}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* -------------------- ONGOING AUDITS -------------------- */}
      <div className="overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/[0.03] shadow-lg shadow-gray-200/50 dark:shadow-none">
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
                          className={`text-sm px-5 py-4 font-bold text-gray-700 dark:text-gray-300 tracking-wide ${
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
                          className={`text-sm px-5 py-4 font-bold text-gray-700 dark:text-gray-300 tracking-wide ${
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

      {emailModalOpen && currentEmailAudit && (
        <SendReportEmailModal
          isOpen={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false);
            setCurrentEmailAudit(null);
          }}
          audit={currentEmailAudit}
          onSend={handleSendEmail}
          isSending={sendingEmails[currentEmailAudit.id] || false}
        />
      )}
    </div>
  );
}
