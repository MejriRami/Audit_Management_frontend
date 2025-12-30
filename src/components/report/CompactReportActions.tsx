import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentArrowDownIcon,
  EyeIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

interface CompactReportActionsProps {
  onGenerate: () => Promise<void>;
  onDownload: () => Promise<void>;
  onPreview: () => void;
  onSendEmail: () => void;
  isGenerating: boolean;
  reportExists: boolean;
  emailSent: boolean;
  isSendingEmail: boolean;
}

export default function CompactReportActions({
  onGenerate,
  onDownload,
  onPreview,
  onSendEmail,
  isGenerating,
  reportExists,
  emailSent,
  isSendingEmail,
}: CompactReportActionsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`relative p-1.5 rounded-full ${
          reportExists
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : "bg-amber-100 dark:bg-amber-900/30"
        }`}
      >
        {reportExists ? (
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </motion.div>

      {/* Email Sent Badge */}
      {emailSent && reportExists && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30"
        >
          <PaperAirplaneIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Sent
          </span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {/* Preview Button */}
        <Tooltip text="Preview PDF" show={hoveredButton === "preview"}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onHoverStart={() => setHoveredButton("preview")}
            onHoverEnd={() => setHoveredButton(null)}
            onClick={onPreview}
            disabled={!reportExists}
            className={`p-2.5 rounded-lg transition-all group relative ${
              reportExists
                ? "bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed opacity-50"
            }`}
          >
            <EyeIcon
              className={`w-5 h-5 transition-colors ${
                reportExists
                  ? "text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />

            {/* Ripple Effect */}
            {reportExists && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={
                  hoveredButton === "preview"
                    ? { scale: 1.5, opacity: 0 }
                    : { scale: 0, opacity: 0.5 }
                }
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-blue-400 rounded-lg pointer-events-none"
              />
            )}
          </motion.button>
        </Tooltip>

        {/* Email Button */}
        <Tooltip
          text={
            isSendingEmail
              ? "Sending..."
              : emailSent
              ? "Resend Email"
              : "Send to Auditees"
          }
          show={hoveredButton === "email"}
        >
          <motion.button
            whileHover={{ scale: reportExists && !isSendingEmail ? 1.1 : 1 }}
            whileTap={{ scale: reportExists && !isSendingEmail ? 0.9 : 1 }}
            onHoverStart={() =>
              reportExists && !isSendingEmail && setHoveredButton("email")
            }
            onHoverEnd={() => setHoveredButton(null)}
            onClick={onSendEmail}
            disabled={!reportExists || isSendingEmail}
            className={`relative p-2.5 rounded-lg transition-all ${
              isSendingEmail
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : reportExists
                ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed opacity-50"
            }`}
          >
            {isSendingEmail ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <ArrowPathIcon className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <EnvelopeIcon
                className={`w-5 h-5 ${
                  reportExists
                    ? "text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
            )}
          </motion.button>
        </Tooltip>

        {/* Generate/Download Button */}
        <Tooltip
          text={
            isGenerating
              ? "Generating..."
              : reportExists
              ? "Download PDF"
              : "Generate Report"
          }
          show={hoveredButton === "main"}
        >
          <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.1 }}
            whileTap={{ scale: isGenerating ? 1 : 0.9 }}
            onHoverStart={() => !isGenerating && setHoveredButton("main")}
            onHoverEnd={() => setHoveredButton(null)}
            onClick={reportExists ? onDownload : onGenerate}
            disabled={isGenerating}
            className={`relative p-2.5 rounded-lg transition-all ${
              isGenerating
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : reportExists
                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            }`}
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <ArrowPathIcon className="w-5 h-5 text-white" />
              </motion.div>
            ) : reportExists ? (
              <DocumentArrowDownIcon className="w-5 h-5 text-white" />
            ) : (
              <SparklesIcon className="w-5 h-5 text-white" />
            )}

            {/* Progress Ring for Generation */}
            {isGenerating && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </svg>
            )}
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}

// Tooltip Component
function Tooltip({
  text,
  show,
  children,
  zIndex = 9999,
}: {
  text: string;
  show: boolean;
  children: React.ReactNode;
  zIndex?: number;
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const update = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left + r.width / 2, top: r.top - 10 });
  };

  useLayoutEffect(() => {
    if (!show) return;
    update();

    const onScroll = () => update();
    const onResize = () => update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [show]);

  return (
    <div ref={anchorRef} className="relative inline-flex">
      {children}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {show && pos && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none fixed"
                style={{
                  left: pos.left,
                  top: pos.top,
                  transform: "translate(-50%, -100%)",
                  zIndex,
                }}
              >
                <div className="relative">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    {text}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -translate-x-1/2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
