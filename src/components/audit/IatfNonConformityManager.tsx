import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
  Edit2,
  CheckCircle2,
  X,
  Upload,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

// ==================== TYPES ====================
type NCClassification = "Minor" | "Major" | "Improvement" | "Strong Point";

interface NonConformity {
  id: string;
  ncNumber: string;
  identificationNumber: string;
  norm: string;
  normParagraph: string;
  process: string;
  classification: NCClassification;
  dueDateMax15Days?: string;
  dueDate60Days?: string;
  observedNonConformity: string;
  evaluatorDecision: string;
  findings: string;
  evidence: File[];
  requestCAR: boolean;
}

interface IATFNonConformityManagerProps {
  plannedAuditId: number;
  questionnaireName: string;
  auditNumber?: string;
  auditeeName?: string;
  auditDate?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  onSubmit?: (
    nonConformities: NonConformity[],
    auditDetails: {
      actualStartTime: string;
      actualEndTime: string;
      strongPoints: string;
      weakPoints: string;
    }
  ) => Promise<void>;
  readOnly?: boolean;
}

// ==================== MAIN COMPONENT ====================
export default function IATFNonConformityManager({
  plannedAuditId,
  questionnaireName,
  auditNumber = "N/A",
  auditeeName = "N/A",
  auditDate,
  plannedStartTime,
  plannedEndTime,
  onSubmit,
  readOnly = false,
}: IATFNonConformityManagerProps) {
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  // Audit details state
  const [actualStartTime, setActualStartTime] = useState(
    plannedStartTime || ""
  );
  const [actualEndTime, setActualEndTime] = useState(plannedEndTime || "");
  const [strongPoints, setStrongPoints] = useState("");
  const [weakPoints, setWeakPoints] = useState("");

  // Initialize with one empty NC
  useEffect(() => {
    if (nonConformities.length === 0) {
      addNewNC();
    }
  }, []);

  // Cleanup previews
  useEffect(() => {
    setPreviews((prev) => {
      const next = new Map<string, string>();
      const stillUsed = new Set<string>();

      nonConformities.forEach((nc) => {
        nc.evidence.forEach((file) => {
          const key = `${nc.id}-${file.name}-${file.size}`;
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
  }, [nonConformities]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Generate unique ID
  const generateId = () =>
    `nc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add new NC
  const addNewNC = () => {
    const newNC: NonConformity = {
      id: generateId(),
      ncNumber: String(nonConformities.length + 1),
      identificationNumber: `ST0${nonConformities.length + 1}`,
      norm: "IATF 16949:2016",
      normParagraph: "",
      process: "",
      classification: "Minor",
      dueDate60Days: "",
      observedNonConformity: "",
      evaluatorDecision: "",
      findings: "",
      evidence: [],
      requestCAR: true, // ✅ Default to true for Minor
    };

    setNonConformities([...nonConformities, newNC]);
    setExpandedId(newNC.id);
  };

  // Remove NC
  const removeNC = (id: string) => {
    if (nonConformities.length === 1) {
      toast.error("At least one non-conformity is required");
      return;
    }
    setNonConformities(nonConformities.filter((nc) => nc.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // Update NC field
  const updateNC = <K extends keyof NonConformity>(
    id: string,
    field: K,
    value: NonConformity[K]
  ) => {
    setNonConformities(
      nonConformities.map((nc) => {
        if (nc.id !== id) return nc;

        const updated = { ...nc, [field]: value };

        // ✅ Auto-check/uncheck CAR based on classification
        if (field === "classification") {
          const newClassification = value as NCClassification;
          // Minor, Major, and Improvement can request CAR
          if (
            newClassification === "Minor" ||
            newClassification === "Major" ||
            newClassification === "Improvement"
          ) {
            updated.requestCAR = true; // Auto-check for Minor/Major/Improvement
          } else if (newClassification === "Strong Point") {
            updated.requestCAR = false; // Auto-uncheck for Strong Point only
          }
        }

        return updated;
      })
    );
  };

  // Move NC up/down
  const moveNC = (id: string, direction: "up" | "down") => {
    const index = nonConformities.findIndex((nc) => nc.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === nonConformities.length - 1)
    ) {
      return;
    }

    const newNCs = [...nonConformities];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newNCs[index], newNCs[targetIndex]] = [newNCs[targetIndex], newNCs[index]];

    // Renumber
    newNCs.forEach((nc, idx) => {
      nc.ncNumber = String(idx + 1);
      nc.identificationNumber = `ST0${idx + 1}`;
    });

    setNonConformities(newNCs);
  };

  // Add evidence
  const addEvidence = (id: string, files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    setNonConformities(
      nonConformities.map((nc) =>
        nc.id === id ? { ...nc, evidence: [...nc.evidence, ...imageFiles] } : nc
      )
    );
  };

  // Remove evidence
  const removeEvidence = (id: string, idx: number) => {
    setNonConformities(
      nonConformities.map((nc) =>
        nc.id === id
          ? { ...nc, evidence: nc.evidence.filter((_, i) => i !== idx) }
          : nc
      )
    );
  };

  // Validate NC
  const validateNC = (nc: NonConformity): string[] => {
    const errors: string[] = [];
    if (!nc.normParagraph.trim()) errors.push("Norm paragraph is required");
    if (!nc.process.trim()) errors.push("Process name is required");

    // Observed non-conformity is only required for Minor and Major
    if (
      (nc.classification === "Minor" || nc.classification === "Major") &&
      !nc.observedNonConformity.trim()
    ) {
      errors.push(
        "Observed non-conformity is required for Minor and Major classifications"
      );
    }

    return errors;
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate all NCs
    const allErrors: { [key: string]: string[] } = {};
    nonConformities.forEach((nc) => {
      const errors = validateNC(nc);
      if (errors.length > 0) {
        allErrors[nc.id] = errors;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      toast.error("Please fix all validation errors before submitting");
      // Show first error
      const firstErrorId = Object.keys(allErrors)[0];
      setExpandedId(firstErrorId);
      return;
    }

    // Validate audit details
    if (!actualStartTime || !actualEndTime) {
      toast.error("Please provide actual start and end times for the audit");
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(nonConformities, {
          actualStartTime,
          actualEndTime,
          strongPoints,
          weakPoints,
        });
      }
      toast.success(
        `${nonConformities.length} non-conformit${
          nonConformities.length > 1 ? "ies" : "y"
        } submitted successfully`
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit non-conformities");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertTriangle className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Audit {auditNumber}
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Auditee: {auditeeName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <p className="text-white text-sm font-medium">
                    {questionnaireName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Details Section */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                  <Calendar size={14} className="text-slate-500" />
                  Audit Date
                </label>
                <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
                  {auditDate || "N/A"}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                  <Clock size={14} className="text-slate-500" />
                  Actual Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={actualStartTime}
                  onChange={(e) => setActualStartTime(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                  <Clock size={14} className="text-slate-500" />
                  Actual End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={actualEndTime}
                  onChange={(e) => setActualEndTime(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Strong Points
                </label>
                <textarea
                  rows={2}
                  value={strongPoints}
                  onChange={(e) => setStrongPoints(e.target.value)}
                  disabled={readOnly}
                  placeholder="Describe strengths observed..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Weak Points
                </label>
                <textarea
                  rows={2}
                  value={weakPoints}
                  onChange={(e) => setWeakPoints(e.target.value)}
                  disabled={readOnly}
                  placeholder="Describe weaknesses or non-conformities..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">
                  {nonConformities.length} Non-Conformit
                  {nonConformities.length > 1 ? "ies" : "y"}
                </span>{" "}
                recorded
              </p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={addNewNC}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                >
                  <Plus size={16} />
                  Add NC
                </button>
              )}
            </div>
          </div>
        </div>

        {/* NC List */}
        <div className="space-y-4">
          {nonConformities.map((nc, index) => {
            const isExpanded = expandedId === nc.id;
            const errors = validateNC(nc);
            const hasErrors = errors.length > 0;

            // Classification styling
            const getClassificationStyle = (
              classification: NCClassification
            ) => {
              switch (classification) {
                case "Major":
                  return {
                    badge: "bg-red-100 text-red-700 ring-2 ring-red-200",
                    label: "bg-red-100 text-red-700",
                  };
                case "Minor":
                  return {
                    badge: "bg-amber-100 text-amber-700 ring-2 ring-amber-200",
                    label: "bg-amber-100 text-amber-700",
                  };
                case "Improvement":
                  return {
                    badge: "bg-blue-100 text-blue-700 ring-2 ring-blue-200",
                    label: "bg-blue-100 text-blue-700",
                  };
                case "Strong Point":
                  return {
                    badge:
                      "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200",
                    label: "bg-emerald-100 text-emerald-700",
                  };
              }
            };

            const styles = getClassificationStyle(nc.classification);
            // CAR can be requested for Minor, Major, and Improvement
            const canRequestCAR =
              nc.classification === "Minor" ||
              nc.classification === "Major" ||
              nc.classification === "Improvement";

            // Observed non-conformity is required only for Minor and Major
            const isObservedNCRequired =
              nc.classification === "Minor" || nc.classification === "Major";

            return (
              <div
                key={nc.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  hasErrors
                    ? "border-red-300"
                    : isExpanded
                    ? "border-blue-400"
                    : "border-slate-200"
                }`}
              >
                {/* NC Header */}
                <div
                  className={`px-6 py-4 cursor-pointer transition-colors ${
                    isExpanded
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : nc.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg ${styles.badge}`}
                      >
                        {nc.ncNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-800">
                            NC N° {nc.identificationNumber}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${styles.label}`}
                          >
                            {nc.classification}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {nc.observedNonConformity || nc.findings || (
                            <span className="italic">
                              No description yet...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasErrors && (
                        <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
                          <AlertTriangle size={14} />
                          {errors.length} error{errors.length > 1 ? "s" : ""}
                        </div>
                      )}

                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveNC(nc.id, "up");
                            }}
                            disabled={index === 0}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={16} className="text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveNC(nc.id, "down");
                            }}
                            disabled={index === nonConformities.length - 1}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={16} className="text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNC(nc.id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </>
                      )}

                      {isExpanded ? (
                        <X size={20} className="text-slate-400" />
                      ) : (
                        <Edit2 size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* NC Details (Expanded) */}
                {isExpanded && (
                  <div className="px-6 py-6 border-t border-slate-200 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            NC Identification Number
                          </label>
                          <input
                            type="text"
                            value={nc.identificationNumber}
                            onChange={(e) =>
                              updateNC(
                                nc.id,
                                "identificationNumber",
                                e.target.value
                              )
                            }
                            disabled={readOnly}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Standard
                          </label>
                          <input
                            type="text"
                            value={nc.norm}
                            onChange={(e) =>
                              updateNC(nc.id, "norm", e.target.value)
                            }
                            disabled={readOnly}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Standard Paragraph{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={nc.normParagraph}
                            onChange={(e) =>
                              updateNC(nc.id, "normParagraph", e.target.value)
                            }
                            disabled={readOnly}
                            placeholder="e.g., 9.3.2.1"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 ${
                              !nc.normParagraph.trim() && hasErrors
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Process <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={nc.process}
                            onChange={(e) =>
                              updateNC(nc.id, "process", e.target.value)
                            }
                            disabled={readOnly}
                            placeholder="e.g., P1. Leadership"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 ${
                              !nc.process.trim() && hasErrors
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Classification{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={nc.classification}
                            onChange={(e) =>
                              updateNC(
                                nc.id,
                                "classification",
                                e.target.value as NCClassification
                              )
                            }
                            disabled={readOnly}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                          >
                            <option value="Minor">Minor</option>
                            <option value="Major">Major</option>
                            <option value="Improvement">Improvement</option>
                            <option value="Strong Point">Strong Point</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-5">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText size={16} className="text-slate-500" />
                            Observed Non-Conformity in Process{" "}
                            {isObservedNCRequired && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <textarea
                            value={nc.observedNonConformity}
                            onChange={(e) =>
                              updateNC(
                                nc.id,
                                "observedNonConformity",
                                e.target.value
                              )
                            }
                            disabled={readOnly}
                            rows={4}
                            placeholder={
                              isObservedNCRequired
                                ? "Describe the observed non-conformity (required)..."
                                : "Describe the observation (optional)..."
                            }
                            className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-60 ${
                              isObservedNCRequired &&
                              !nc.observedNonConformity.trim() &&
                              hasErrors
                                ? "border-red-400 bg-red-50"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText size={16} className="text-slate-500" />
                            Findings / Details
                          </label>
                          <textarea
                            value={nc.findings}
                            onChange={(e) =>
                              updateNC(nc.id, "findings", e.target.value)
                            }
                            disabled={readOnly}
                            rows={3}
                            placeholder="Additional findings or details..."
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <div className="flex items-center gap-2">
                              <Upload size={16} className="text-slate-500" />
                              Evidence / Attachments
                            </div>
                          </label>
                          <div className="space-y-3">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors">
                              <Upload size={16} className="text-slate-600" />
                              <span className="text-slate-700">
                                Upload Images
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                  addEvidence(nc.id, e.target.files)
                                }
                                disabled={readOnly}
                              />
                            </label>

                            {nc.evidence.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {nc.evidence.map((file, idx) => {
                                  const key = `${nc.id}-${file.name}-${file.size}`;
                                  return (
                                    <div
                                      key={key}
                                      className="relative group rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm"
                                    >
                                      <img
                                        src={previews.get(key)}
                                        alt={file.name}
                                        className="w-full h-24 object-cover"
                                      />
                                      {!readOnly && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeEvidence(nc.id, idx)
                                          }
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                          <X size={20} className="text-white" />
                                        </button>
                                      )}
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                                        <p className="text-xs text-white truncate">
                                          {file.name}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {canRequestCAR && (
                          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer group/checkbox">
                              <input
                                type="checkbox"
                                checked={nc.requestCAR}
                                onChange={(e) =>
                                  updateNC(
                                    nc.id,
                                    "requestCAR",
                                    e.target.checked
                                  )
                                }
                                disabled={readOnly}
                                className="w-5 h-5 text-orange-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-orange-800 group-hover/checkbox:text-orange-900 transition-colors">
                                Request CAR (Corrective Action Request)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validation Errors */}
                    {hasErrors && (
                      <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            size={20}
                            className="text-red-600 flex-shrink-0 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 mb-2">
                              Validation Errors:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {errors.map((error, idx) => (
                                <li key={idx} className="text-sm text-red-700">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {!readOnly && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">
                  Ready to submit non-conformities?
                </p>
                <p className="text-xs text-slate-500">
                  Ensure all required fields are filled
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  nonConformities.some((nc) => validateNC(nc).length > 0)
                }
                className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-900 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Submit NCs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
