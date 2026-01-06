import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Audit } from "../../redux/audit/audit-types";

interface SendReportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: Audit;
  onSend: (recipients: string[], includeAuditor: boolean) => Promise<void>;
  isSending: boolean;
}

export default function SendReportEmailModal({
  isOpen,
  onClose,
  audit,
  onSend,
  isSending,
}: SendReportEmailModalProps) {
  const [selectedAuditees, setSelectedAuditees] = useState<string[]>(
    audit.auditees || []
  );
  const [includeAuditor, setIncludeAuditor] = useState(false);
  const [customEmail, setCustomEmail] = useState("");

  const handleToggleAuditee = (email: string) => {
    setSelectedAuditees((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAddCustomEmail = () => {
    const email = customEmail.trim();
    if (email && !selectedAuditees.includes(email)) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setSelectedAuditees((prev) => [...prev, email]);
        setCustomEmail("");
      }
    }
  };

  const handleSend = async () => {
    if (selectedAuditees.length === 0 && !includeAuditor) {
      return;
    }
    await onSend(selectedAuditees, includeAuditor);
  };

  const handleSelectAll = () => {
    if (selectedAuditees.length === (audit.auditees?.length || 0)) {
      setSelectedAuditees([]);
    } else {
      setSelectedAuditees(audit.auditees || []);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <PaperAirplaneIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Send Audit Report
                  </h2>
                  <p className="text-sm text-white/80 mt-0.5">
                    {audit.audit_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSending}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Auditees Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <UserGroupIcon className="w-5 h-5" />
                  Select Recipients
                </label>
                {audit.auditees && audit.auditees.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    {selectedAuditees.length === audit.auditees.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              {/* Auditees List */}
              {audit.auditees && audit.auditees.length > 0 ? (
                <div className="space-y-2">
                  {audit.auditees.map((email) => (
                    <motion.div
                      key={email}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedAuditees.includes(email)
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
                      }`}
                      onClick={() => handleToggleAuditee(email)}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedAuditees.includes(email)
                            ? "bg-violet-500 border-violet-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selectedAuditees.includes(email) && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {email}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No auditees found for this audit
                </p>
              )}
            </div>

            {/* Add Custom Email */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Add Custom Recipient
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleAddCustomEmail()
                  }
                  placeholder="email@example.com"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-violet-500 focus:outline-none"
                  disabled={isSending}
                />
                <button
                  onClick={handleAddCustomEmail}
                  disabled={!customEmail.trim() || isSending}
                  className="px-4 py-2 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Include Auditor */}
            <div className="mb-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  includeAuditor
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
                onClick={() => setIncludeAuditor(!includeAuditor)}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    includeAuditor
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {includeAuditor && (
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Include Auditor
                  </span>
                  {audit.auditor && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {audit.auditor.first_name} {audit.auditor.last_name} (
                      {audit.auditor.email})
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Selected Count */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAuditees.length + (includeAuditor ? 1 : 0)}
                </span>{" "}
                recipient(s) selected
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={
                isSending || (selectedAuditees.length === 0 && !includeAuditor)
              }
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </motion.div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Send Report
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
