import React from "react";
import { Audit } from "../../types";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

// Props interface
interface AuditDetailsModalProps {
  audit?: Audit;
  onClose: () => void;
}

const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({
  audit,
  onClose,
}) => {
  if (!audit) return null;

  const getCriticalityColor = (criticality?: string) => {
    const level = criticality?.toLowerCase();
    switch (level) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "low":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Pending":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      case "Submitted":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "Accepted":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "Completed":
        return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto z-[99999] backdrop-blur-sm bg-black/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-5xl w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header - Monday.com Style */}
          <div className="bg-white dark:bg-gray-900 px-8 py-6 relative border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  Audit Details
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  #{audit.audit_number || audit.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-8 py-6">
            {/* Basic Info Cards - Monday.com Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">
                  Questionnaire
                </h3>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {audit.questionnaire?.name || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">
                  Entity / Plant
                </h3>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {audit.plant || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">
                  Sector
                </h3>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {audit.sector || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">
                  Planned Duration
                </h3>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {audit.planned_start_date || "N/A"} →{" "}
                  {audit.planned_end_date || "N/A"}
                </p>
              </div>
            </div>

            {/* Participants Section - Monday.com Style */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">
                Participants
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-500 dark:text-gray-400 text-xs mb-3 uppercase tracking-wide">
                    Auditor
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm">
                      {audit.auditor?.first_name?.[0]}
                      {audit.auditor?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                        {audit.auditor?.first_name} {audit.auditor?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {audit.auditor?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-500 dark:text-gray-400 text-xs mb-3 uppercase tracking-wide">
                    Auditees
                  </h4>
                  <ul className="space-y-2">
                    {audit.auditees?.map((email, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-medium">
                          {idx + 1}
                        </span>
                        {email}
                      </li>
                    )) || (
                      <li className="text-gray-500 text-xs">No auditees</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Questions & Findings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">
                Questions & Responses
              </h3>

              {audit.questions_and_responses?.length ? (
                audit.questions_and_responses.map((q, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200"
                  >
                    {/* Question Header */}
                    <div className="bg-gray-50 dark:bg-gray-900 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                            {q.description}
                          </h4>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-medium border ${getCriticalityColor(
                            q.criticality
                          )}`}
                        >
                          {q.criticality || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="px-5 py-4 space-y-3">
                      {/* Response */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Response
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {q.response || "No response provided"}
                        </p>
                      </div>

                      {/* Findings */}
                      {audit.findings
                        ?.filter((f) => f.question_id === q.id)
                        .map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Finding
                            </h5>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              {f.finding_type}
                            </p>

                            {/* Corrective Actions */}
                            {f.corrective_action && (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-2">
                                <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                  Corrective Action
                                </h6>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  {f.corrective_action}
                                </p>
                                {f.corrective_action_status && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Status:
                                    </span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                                        f.corrective_action_status
                                      )}`}
                                    >
                                      {f.corrective_action_status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                    No questions and responses recorded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-8 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-medium transition-colors duration-200"
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
