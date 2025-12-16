import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  X,
  Download,
  FileText,
  ClipboardList,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Select from "../form/Select";
import Enum from "../enum/Enum";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  executeAuditThunk,
  fetchPickableAuditsByAuditor,
  getAuditQuestions,
  removePickableAudit,
} from "../../redux/audit/audit-slice";
import { apiUploadFile } from "../../redux/audit/audit";

// -------------------- Types --------------------
type AuditValue = "" | -1 | 0 | 3 | 5 | 8 | 10;

interface AuditItem {
  row: number;
  questionId: number;
  question: string;
  critical: number;
  value: AuditValue;
  findings: string;
  carReason: string;
  evidence: File[];
  requestCAR: boolean;
  errors: {
    value?: string;
    findings?: string;
    carReason?: string;
  };
}

interface ValueOption {
  value: AuditValue;
  label: string;
  color: string;
}

// -------------------- Constants --------------------
const VALUE_OPTIONS: ValueOption[] = [
  { value: -1, label: "Optional", color: "text-yellow-700" },
  { value: 0, label: "0 - Inexistant", color: "text-red-700" },
  { value: 3, label: "3 - Not sufficient", color: "text-orange-700" },
  { value: 5, label: "5 - Improvement needed", color: "text-amber-700" },
  { value: 8, label: "8 - Acceptable", color: "text-emerald-600" },
  { value: 10, label: "10 - Good practice", color: "text-emerald-700" },
];

// -------------------- Helpers --------------------
const needsDetails = (v: AuditValue): boolean => v !== "" && v !== -1 && v <= 5;

const getValueColor = (v: AuditValue): string => {
  if (v === "") return "text-slate-700";
  return VALUE_OPTIONS.find((o) => o.value === v)?.color || "text-slate-700";
};

const getCriticalClass = (critical: number): string => {
  if (critical >= 8) return "bg-red-100 text-red-700";
  if (critical >= 5) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const validateItem = (item: AuditItem): AuditItem["errors"] => {
  const errors: AuditItem["errors"] = {};
  if (item.value === "") errors.value = "Required";

  if (needsDetails(item.value)) {
    if (!item.findings.trim()) errors.findings = "Required";
    if (item.requestCAR && !item.carReason.trim()) {
      errors.carReason = "Required for CAR request";
    }
  }
  return errors;
};

export default function AuditChecklistPro() {
  const [selectedAuditor, setSelectedAuditor] = useState<string | number>("");
  const [selectedPlannedAuditId, setSelectedPlannedAuditId] = useState<
    number | ""
  >("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const { auditorOptions } = Enum();
  const dispatch = useDispatch<AppDispatch>();

  const { pickableAudits, pickableLoading } = useSelector(
    (state: RootState) => state.audit
  );

  const auditorId = useMemo(
    () => Number(selectedAuditor) || 0,
    [selectedAuditor]
  );

  // Fetch pickable audits when auditor changes
  useEffect(() => {
    if (!auditorId) {
      setSelectedPlannedAuditId("");
      setItems([]);
      setSubmitted(false);
      return;
    }

    dispatch(fetchPickableAuditsByAuditor(auditorId));
    setSelectedPlannedAuditId("");
    setItems([]);
    setSubmitted(false);
  }, [auditorId, dispatch]);

  const handleAuditSelection = async (auditId: number | "") => {
    setSelectedPlannedAuditId(auditId);
    setSubmitted(false);

    if (auditId === "") {
      setItems([]);
      return;
    }

    const result = await dispatch(getAuditQuestions(auditId));

    if (getAuditQuestions.fulfilled.match(result)) {
      const questions = result.payload as Array<{
        id: number;
        description: string;
        critical_value: number;
      }>;

      setItems(
        questions.map((q, idx) => ({
          row: idx + 1,
          questionId: q.id,
          question: q.description,
          critical: q.critical_value,
          value: "",
          findings: "",
          carReason: "",
          evidence: [],
          requestCAR: false,
          errors: {},
        }))
      );
    } else {
      setItems([]);
      toast.error("Failed to load audit questions");
    }
  };

  // Previews (no infinite loops)
  useEffect(() => {
    setPreviews((prev) => {
      const next = new Map<string, string>();
      const stillUsed = new Set<string>();

      items.forEach((item) => {
        item.evidence.forEach((file) => {
          const key = `${item.questionId}-${file.name}-${file.size}`;
          stillUsed.add(key);

          const existing = prev.get(key);
          next.set(key, existing ?? URL.createObjectURL(file));
        });
      });

      prev.forEach((url, key) => {
        if (!stillUsed.has(key)) URL.revokeObjectURL(url);
      });

      return next;
    });
  }, [items]);

  useEffect(() => {
    return () => {
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return new Map();
      });
    };
  }, []);

  const updateField = <K extends keyof AuditItem>(
    questionId: number,
    field: K,
    value: AuditItem[K]
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.questionId !== questionId) return item;

        const updated: AuditItem = {
          ...item,
          [field]: value,
          errors: { ...item.errors, [field]: undefined },
        };

        if (field === "value") {
          const newValue = value as AuditValue;
          if (
            newValue === "" ||
            newValue === -1 ||
            (typeof newValue === "number" && newValue > 5)
          ) {
            updated.requestCAR = false;
            updated.carReason = "";
          }
        }

        return updated;
      })
    );
  };

  const toggleCARRequest = (questionId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.questionId === questionId
          ? { ...item, requestCAR: !item.requestCAR }
          : item
      )
    );
  };

  // Upload is not handled now → keep UI, but the payload sends file_url = ""
  const addEvidence = (questionId: number, files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.questionId === questionId
          ? { ...item, evidence: [...item.evidence, ...imageFiles] }
          : item
      )
    );
  };

  const removeEvidence = (questionId: number, idx: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.questionId === questionId
          ? { ...item, evidence: item.evidence.filter((_, i) => i !== idx) }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || submitting) return;

    if (selectedPlannedAuditId === "") {
      toast.error("Select an audit first");
      return;
    }

    const validated = items.map((item) => ({
      ...item,
      errors: validateItem(item),
    }));
    setItems(validated);

    const hasErrors = validated.some(
      (item) => Object.keys(item.errors).length > 0
    );
    if (hasErrors) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const answers = await Promise.all(
        validated.map(async (item) => {
          // ✅ Upload evidence files first (if any)
          const documents = await Promise.all(
            item.evidence.map(async (file) => {
              const up = await apiUploadFile(file);
              return {
                filename: up.filename,
                mimetype: up.mimetype,
                size: up.size,
                file_url: up.file_url,
              };
            })
          );

          return {
            question_id: item.questionId,
            value: item.value === "" ? -1 : (item.value as number),
            finding_text: item.findings?.trim() ? item.findings.trim() : null,
            documents,
            request_car: item.requestCAR,
            car_reason:
              item.requestCAR && item.carReason?.trim()
                ? item.carReason.trim()
                : null,
          };
        })
      );

      const resultAction = await dispatch(
        executeAuditThunk({
          auditId: selectedPlannedAuditId,
          data: { answers },
        })
      );

      if (!executeAuditThunk.fulfilled.match(resultAction)) {
        toast.error(String(resultAction.payload || "Failed to execute audit"));
        setSubmitted(false);
        return;
      }

      const res = resultAction.payload as any;

      toast.success(
        res.cars_created > 0
          ? `Audit executed. Status: ${res.status}. ${res.cars_created} CAR(s) created.`
          : `Audit executed. Status: ${res.status}. No CAR needed.`
      );

      // ✅ optimistic remove from dropdown list
      dispatch(removePickableAudit(selectedPlannedAuditId));

      // ✅ reset UI
      setSubmitted(true);
      setSelectedPlannedAuditId("");
      setItems([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Execution failed. Please try again.");
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCSV = () => {
    const rows = [
      [
        "#",
        "Question",
        "Critical",
        "Value",
        "Findings",
        "CAR Requested",
        "CAR Reason",
        "Evidence",
      ],
      ...items.map((item) => [
        item.row,
        item.question,
        item.critical,
        item.value,
        item.findings.replace(/\n/g, " "),
        item.requestCAR ? "Yes" : "No",
        item.carReason.replace(/\n/g, " "),
        item.evidence.map((f) => f.name).join("|"),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = items.length
    ? Math.round(
        (items.filter((i) => i.value !== "").length / items.length) * 100
      )
    : 0;

  const carCount = items.filter(
    (item) =>
      item.requestCAR &&
      item.value !== "" &&
      item.value !== -1 &&
      item.value <= 5
  ).length;

  const canSubmit =
    selectedPlannedAuditId !== "" &&
    auditorId > 0 &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.value !== "" &&
        (!needsDetails(item.value) || item.findings.trim()) &&
        (!item.requestCAR || item.carReason.trim())
    );

  const auditOptions = pickableAudits.map((a) => ({
    value: a.id,
    label: `${a.status === "rescheduled" ? "🔁 RESCHEDULED" : "🗓️ PLANNED"} | ${
      a.audit_number
    } | ${a.planned_date} | ${a.planned_start_time}-${a.planned_end_time}`,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <ClipboardList className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">
                    Audit Execution — Standard
                  </h1>
                  <p className="text-xs text-slate-500">
                    Complete checklist with findings and evidence
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadCSV}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} className="text-slate-600" />
                Export CSV
              </button>
            </div>

            {/* Selection Row */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                  Auditor
                </label>
                <div className="relative">
                  <Select
                    placeholder="Select an auditor ..."
                    options={auditorOptions}
                    defaultValue={selectedAuditor}
                    onChange={(value: string | number) =>
                      setSelectedAuditor(value)
                    }
                    className="w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={submitting}
                  />
                  <ChevronDown
                    size={16}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                  Planned Audit
                </label>
                <div className="relative">
                  <Select
                    key={
                      String(selectedPlannedAuditId) +
                      "-" +
                      pickableAudits.length
                    } // ✅ ensures reset when cleared
                    options={auditOptions}
                    placeholder={
                      pickableLoading
                        ? "Loading audits..."
                        : !auditorId
                        ? "Select auditor first..."
                        : "Select planned audit..."
                    }
                    defaultValue={selectedPlannedAuditId}
                    onChange={(value) =>
                      handleAuditSelection(value ? Number(value) : "")
                    }
                    className="w-full p-1.5 pr-8"
                    disabled={!auditorId || pickableLoading || submitting}
                  />
                  <ChevronDown
                    size={16}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Progress */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    Progress:
                  </span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {progress}%
                  </span>
                </div>

                {carCount > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle size={14} className="text-orange-600" />
                    <span className="text-orange-700 font-medium">
                      {carCount} CAR{carCount > 1 ? "s" : ""} will be requested
                      upon submission
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-12">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[200px]">
                      Question
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-20">
                      Critical
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-48">
                      Value
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-44">
                      Findings
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-36">
                      Evidence
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-48">
                      CAR Reason
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <FileText
                          className="mx-auto mb-2 text-slate-300"
                          size={32}
                        />
                        <p className="text-sm text-slate-500">
                          Select a planned audit to load questions
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.questionId}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          item.errors?.value ? "bg-red-50/30" : ""
                        } ${item.requestCAR ? "bg-orange-50/30" : ""}`}
                      >
                        <td className="px-3 py-3 align-top">
                          <span className="text-sm font-medium text-slate-700">
                            {item.row}
                          </span>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <p className="text-sm text-slate-800">
                            {item.question}
                          </p>
                        </td>

                        <td className="px-3 py-3 align-top text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getCriticalClass(
                              item.critical
                            )}`}
                          >
                            {item.critical}
                          </span>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <select
                            value={item.value}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? ""
                                  : (Number(e.target.value) as AuditValue);
                              updateField(item.questionId, "value", val);
                            }}
                            aria-invalid={!!item.errors?.value}
                            className={`w-full p-2 text-sm border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              item.errors?.value
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300 bg-white"
                            } ${getValueColor(item.value)}`}
                          >
                            <option value="">Select...</option>
                            {VALUE_OPTIONS.map((opt) => (
                              <option key={String(opt.value)} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {item.errors?.value && (
                            <p className="text-xs text-red-500 mt-1">
                              {item.errors.value}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <textarea
                            value={item.findings}
                            onChange={(e) =>
                              updateField(
                                item.questionId,
                                "findings",
                                e.target.value
                              )
                            }
                            rows={2}
                            placeholder={
                              needsDetails(item.value)
                                ? "Required..."
                                : "Optional..."
                            }
                            aria-invalid={!!item.errors?.findings}
                            className={`w-full p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              item.errors?.findings
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300"
                            }`}
                          />
                          {item.errors?.findings && (
                            <p className="text-xs text-red-500 mt-1">
                              {item.errors.findings}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                            <Upload size={14} className="text-slate-600" />
                            <span className="text-slate-700">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) =>
                                addEvidence(item.questionId, e.target.files)
                              }
                            />
                          </label>

                          {item.evidence.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.evidence.map((file, idx) => {
                                const key = `${item.questionId}-${file.name}-${file.size}`;
                                return (
                                  <div key={key} className="relative group">
                                    <img
                                      src={previews.get(key)}
                                      alt={file.name}
                                      className="h-10 w-10 object-cover rounded border border-slate-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeEvidence(item.questionId, idx)
                                      }
                                      className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-2">
                            {item.value !== "" &&
                            item.value !== -1 &&
                            item.value <= 5 ? (
                              <>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.requestCAR}
                                    onChange={() =>
                                      toggleCARRequest(item.questionId)
                                    }
                                    className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-orange-500"
                                  />
                                  <span className="text-xs font-medium text-slate-700">
                                    Request CAR
                                  </span>
                                </label>

                                {item.requestCAR ? (
                                  <>
                                    <textarea
                                      value={item.carReason}
                                      onChange={(e) =>
                                        updateField(
                                          item.questionId,
                                          "carReason",
                                          e.target.value
                                        )
                                      }
                                      rows={2}
                                      placeholder="Reason for CAR (required)..."
                                      aria-invalid={!!item.errors?.carReason}
                                      className={`w-full p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        item.errors?.carReason
                                          ? "border-red-400 bg-red-50"
                                          : "border-slate-300"
                                      }`}
                                    />
                                    {item.errors?.carReason && (
                                      <p className="text-xs text-red-500">
                                        {item.errors.carReason}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <textarea
                                    value={item.carReason}
                                    onChange={(e) =>
                                      updateField(
                                        item.questionId,
                                        "carReason",
                                        e.target.value
                                      )
                                    }
                                    rows={2}
                                    placeholder="Optional notes..."
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-slate-500 italic py-2">
                                {item.value === ""
                                  ? "Select a value first"
                                  : item.value === -1
                                  ? "Optional - No CAR needed"
                                  : "No CAR needed"}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Values ≤5 require findings. Check "Request CAR" and provide
                    reason to request corrective actions.
                  </p>
                  {carCount > 0 && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      {carCount} CAR{carCount > 1 ? "s" : ""} will be submitted
                      with this audit
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || submitting || submitted}
                  className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    submitted
                      ? "bg-green-600 text-white cursor-default"
                      : canSubmit
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {submitted
                    ? "Submitted ✓"
                    : submitting
                    ? "Submitting..."
                    : "Submit Audit"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
