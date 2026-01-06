import React, { useState } from "react";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { Audit } from "../../redux/audit/audit-types";

// Props interface
interface AuditDetailsModalProps {
  audit?: Audit;
  onClose: () => void;
}

const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({
  audit,
  onClose,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (!audit) return null;

  const toggleRow = (questionId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getCriticalityColor = (criticality?: string) => {
    const level = criticality?.toLowerCase();
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "Submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      case "Accepted":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
      case "Completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getValueBadgeColor = (value?: number) => {
    if (value === undefined || value === null)
      return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    if (value >= 80)
      return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200";
    if (value >= 60)
      return "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200";
    return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto z-[99999] bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full mx-4 my-8 overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-8 py-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {audit.questionnaire?.name || "Audit Report"}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    #{audit.audit_number || audit.id}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Entity:</span>
                    <span>{audit.plant || "N/A"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Sector:</span>
                    <span>{audit.sector || "N/A"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Period:</span>
                    <span>
                      {audit.planned_start_date || "N/A"} →{" "}
                      {audit.planned_end_date || "N/A"}
                    </span>
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-all duration-150"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-auto max-h-[calc(90vh-180px)]">
            {audit.questions_and_responses?.length ? (
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="w-10 px-4 py-4"></th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Question
                    </th>
                    <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-32">
                      Criticality
                    </th>
                    <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-24">
                      Value
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-64">
                      Finding
                    </th>
                    <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-40">
                      CAR Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  {audit.questions_and_responses.map((q, idx) => {
                    const finding = audit.findings?.find(
                      (f) => f.question_id === q.id
                    );
                    const isExpanded = expandedRows.has(q.id);
                    const hasDetails = finding?.corrective_action || q.response;

                    return (
                      <React.Fragment key={q.id || idx}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            isExpanded ? "bg-slate-50 dark:bg-slate-800/30" : ""
                          }`}
                        >
                          {/* Expand Button */}
                          <td className="px-4 py-4">
                            {hasDetails && (
                              <button
                                onClick={() => toggleRow(q.id)}
                                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronDownIcon className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>

                          {/* Question Description */}
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                {idx + 1}
                              </span>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                                {q.description}
                              </p>
                            </div>
                          </td>

                          {/* Criticality */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex px-3 py-1.5 rounded-md text-xs font-bold uppercase border ${getCriticalityColor(
                                q.criticality
                              )}`}
                            >
                              {q.criticality || "N/A"}
                            </span>
                          </td>

                          {/* Value */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-14 h-8 rounded-md text-sm font-bold ${getValueBadgeColor(
                                q.value
                              )}`}
                            >
                              {q.value ?? "—"}
                            </span>
                          </td>

                          {/* Finding */}
                          <td className="px-6 py-4">
                            {finding?.finding_type ? (
                              <div className="text-sm">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                  {finding.finding_type}
                                </p>
                                {finding.finding_text && (
                                  <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2">
                                    {finding.finding_text}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-500 italic">
                                No finding
                              </span>
                            )}
                          </td>

                          {/* CAR Type */}
                          <td className="px-4 py-4 text-center">
                            {finding?.corrective_action_status ? (
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-md text-xs font-semibold ${getStatusColor(
                                  finding.corrective_action_status
                                )}`}
                              >
                                {finding.corrective_action_status}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-600">
                                —
                              </span>
                            )}
                          </td>
                        </motion.tr>

                        {/* Expanded Details Row */}
                        {isExpanded && hasDetails && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-slate-50 dark:bg-slate-800/50"
                          >
                            <td colSpan={6} className="px-6 py-6">
                              <div className="max-w-5xl ml-16 space-y-4">
                                {/* Response */}
                                {q.response && (
                                  <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                    <h6 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                      Response
                                    </h6>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {q.response}
                                    </p>
                                  </div>
                                )}

                                {/* Corrective Action */}
                                {finding?.corrective_action && (
                                  <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                    <h6 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                      Corrective Action Plan
                                    </h6>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {finding.corrective_action}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400 dark:text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-base">
                  No audit data available
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  Questions and responses have not been recorded yet
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-800 px-8 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {audit.questions_and_responses?.length || 0} questions total
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold transition-all duration-150 shadow-sm hover:shadow"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuditDetailsModal;
