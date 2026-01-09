import { GuidelineDocument } from "../../redux/questionnaire/questionnaire-slice-types";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axiosInstance";
import { Modal } from "../../components/ui/modal";
import * as XLSX from "xlsx";

interface GuidelineViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideline: GuidelineDocument | null;
}

export default function GuidelineViewerModal({
  isOpen,
  onClose,
  guideline,
}: GuidelineViewerModalProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Excel
  const [previewData, setPreviewData] = useState<{
    sheets: { name: string; data: any[][] }[];
  } | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  // PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const isExcel = useMemo(
    () => !!guideline?.filename.match(/\.(xlsx|xls|csv)$/i),
    [guideline]
  );

  const isPdf = useMemo(
    () => !!guideline?.filename.match(/\.pdf$/i),
    [guideline]
  );

  useEffect(() => {
    if (!isOpen || !guideline) return;

    setError(null);

    if (isExcel) loadExcelPreview();
    else if (isPdf) loadPdfPreview();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPreviewData(null);
      setActiveSheet(0);
    };
  }, [isOpen, guideline]);

  /* ======================= LOADERS ======================= */

  const loadExcelPreview = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/questionnaire/documents/${guideline!.id}/download`,
        { responseType: "arraybuffer" }
      );

      const workbook = XLSX.read(res.data, { type: "array" });

      const sheets = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
          defval: "",
        });

        return { name, data: data as any[][] };
      });

      setPreviewData({ sheets });
    } catch (e) {
      console.error(e);
      setError("Failed to load Excel preview");
    } finally {
      setLoading(false);
    }
  };

  const loadPdfPreview = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/questionnaire/documents/${guideline!.id}/download`,
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(res.data);
      setPdfUrl(url);
    } catch {
      setError("Failed to load PDF preview");
    } finally {
      setLoading(false);
    }
  };

  /* ======================= DOWNLOAD ======================= */

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get(
        `/questionnaire/documents/${guideline!.id}/download`,
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = guideline!.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("File downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  /* ======================= HELPERS ======================= */

  const isNumber = (v: any) => typeof v === "number" || (!isNaN(v) && v !== "");

  if (!guideline) return null;

  const currentSheet = previewData?.sheets[activeSheet];
  const headerRow = currentSheet?.data[0] || [];
  const bodyRows = currentSheet?.data.slice(1) || [];

  /* ======================= RENDER ======================= */

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl p-0">
      <div className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
          <div>
            <h3 className="text-lg font-semibold">{guideline.filename}</h3>
            <p className="text-sm text-gray-500">
              {isExcel && "Excel Spreadsheet"}
              {isPdf && "PDF Document"}
            </p>
          </div>
          <button onClick={onClose} className="text-xl text-gray-500">
            ✕
          </button>
        </div>

        {/* Sheet Tabs */}
        {isExcel && previewData && previewData.sheets.length > 1 && (
          <div className="flex gap-1 px-4 py-2 border-b bg-gray-50 overflow-x-auto">
            {previewData.sheets.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setActiveSheet(i)}
                className={`px-4 py-2 text-sm rounded-t ${
                  i === activeSheet
                    ? "bg-white border-t-2 border-green-600 text-green-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {loading && <p className="text-center">Loading preview…</p>}

          {error && (
            <div className="text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
              >
                Download File
              </button>
            </div>
          )}

          {/* PDF */}
          {!loading && !error && isPdf && pdfUrl && (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border rounded"
            />
          )}

          {/* Excel */}
          {!loading && !error && isExcel && currentSheet && (
            <div className="inline-block min-w-full">
              <table className="border-collapse bg-white shadow text-sm">
                <thead className="sticky top-0 z-20 bg-green-100">
                  <tr>
                    {headerRow.map((cell, i) => (
                      <th
                        key={i}
                        className={`border px-4 py-2 text-left font-semibold ${
                          i === 0 ? "sticky left-0 bg-green-100 z-30" : ""
                        }`}
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, r) => (
                    <tr key={r} className={r % 2 === 0 ? "bg-gray-50" : ""}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          title={String(cell)}
                          className={`border px-4 py-2 max-w-[300px] truncate ${
                            isNumber(cell)
                              ? "text-right font-mono"
                              : "text-left"
                          } ${c === 0 ? "sticky left-0 bg-white z-10" : ""}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-white">
          <span className="text-sm text-gray-500">
            {isExcel &&
              currentSheet &&
              `${currentSheet.data.length} rows × ${
                currentSheet.data[0]?.length || 0
              } columns`}
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {downloading ? "Downloading…" : "Download"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
