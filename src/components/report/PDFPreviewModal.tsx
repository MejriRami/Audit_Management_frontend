import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  auditNumber: string;
  onDownload: () => void;
  topOffsetPx?: number;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  auditNumber,
  onDownload,
  topOffsetPx = 0,
}: PDFPreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [isFullView, setIsFullView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoaded(false);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Nice filename like screenshot (you can tweak this)
  const fileName = useMemo(() => {
    return `Audit Report - ${auditNumber}.pdf`;
  }, [auditNumber]);

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  const handleZoomIn = () =>
    setScale((p) => clamp(Number((p + 0.1).toFixed(2)), 0.5, 2.0));
  const handleZoomOut = () =>
    setScale((p) => clamp(Number((p - 0.1).toFixed(2)), 0.5, 2.0));
  const handleReset = () => setScale(1);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleReset();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="fixed left-0 right-0 bottom-0 top-10 z-[100000] bg-black/60 backdrop-blur-sm"
        style={{ top: topOffsetPx }}
      >
        <motion.div
          initial={{ y: 10, opacity: 0, scale: 0.99 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.99 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={[
            "relative mx-auto h-full w-full",
            "bg-white dark:bg-zinc-950",
            "shadow-2xl",
            isFullView ? "" : "max-w-[1400px] rounded-2xl overflow-hidden",
          ].join(" ")}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900 dark:text-gray-100">
                  {fileName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Preview
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition"
              aria-label="Close"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Viewer Area */}
          <div className="relative h-[calc(100%-56px)] bg-indigo-50 dark:bg-[#0b1220]">
            <div className="absolute inset-0 overflow-auto">
              <div className="min-h-full flex items-start justify-center p-8">
                <motion.div
                  animate={{ scale }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  style={{ transformOrigin: "top center" }}
                  className="relative"
                >
                  <div className="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl overflow-hidden">
                    {!loaded && (
                      <div className="absolute inset-0 z-20 grid place-items-center bg-white/90 dark:bg-zinc-950/80">
                        <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-gray-700 dark:border-white/20 dark:border-t-white/70 animate-spin" />
                      </div>
                    )}

                    {/* PDF iframe
                        Tip: toolbar=0 gives cleaner look like screenshot.
                        Some browsers still show built-in controls; that’s ok.
                    */}
                    <iframe
                      onLoad={() => setLoaded(true)}
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      title="PDF Preview"
                      className="w-[860px] max-w-[90vw] h-[78vh]"
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating Bottom Toolbar */}
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md shadow-xl border border-gray-200/70 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title="Zoom Out"
                >
                  <MagnifyingGlassMinusIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition text-sm font-semibold text-gray-800 dark:text-gray-100"
                  title="Reset Zoom (Ctrl/⌘ + 0)"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title="Zoom In"
                >
                  <MagnifyingGlassPlusIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>

                <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-white/10" />

                <button
                  type="button"
                  onClick={() => setIsFullView((v) => !v)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title={isFullView ? "Exit Full View" : "Full View"}
                >
                  <ArrowsPointingOutIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>

                <button
                  type="button"
                  onClick={onDownload}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
