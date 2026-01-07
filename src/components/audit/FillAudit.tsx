import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  X,
  Download,
  FileText,
  ClipboardList,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
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

// ==================== TYPES ====================
type AuditValue = "" | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 8 | 10;

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

interface AuditSummary {
  auditDate: string;
  startTime: string;
  endTime: string;
  strongPoints: string;
  weakPoints: string;
  questionnaireName: string;
}

// ==================== SCORING SYSTEMS ====================
const IATF_VALUE_OPTIONS: ValueOption[] = [
  { value: -1, label: "Optional", color: "text-yellow-700" },
  { value: 1, label: "1 - Poor", color: "text-red-700" },
  { value: 2, label: "2 - Weak", color: "text-orange-700" },
  { value: 3, label: "3 - Acceptable", color: "text-amber-600" },
  { value: 4, label: "4 - Good", color: "text-emerald-600" },
  { value: 5, label: "5 - Excellent", color: "text-emerald-700" },
];

const STANDARD_VALUE_OPTIONS: ValueOption[] = [
  { value: -1, label: "Optional", color: "text-yellow-700" },
  { value: 0, label: "0 - Inexistant", color: "text-red-700" },
  { value: 3, label: "3 - Not sufficient", color: "text-orange-700" },
  { value: 5, label: "5 - Improvement needed", color: "text-amber-700" },
  { value: 8, label: "8 - Acceptable", color: "text-emerald-600" },
  { value: 10, label: "10 - Good practice", color: "text-emerald-700" },
];

// ==================== UTILITIES ====================
const getValueOptions = (questionnaireName: string): ValueOption[] => {
  const name = questionnaireName.toLowerCase();
  return name.includes("iatf") || name.includes("plant manager")
    ? IATF_VALUE_OPTIONS
    : STANDARD_VALUE_OPTIONS;
};

const needsDetails = (v: AuditValue, isIATF: boolean): boolean => {
  if (v === "" || v === -1) return false;
  return isIATF ? v <= 3 : v <= 5;
};

const getValueColor = (v: AuditValue, valueOptions: ValueOption[]): string => {
  if (v === "") return "text-slate-700";
  return valueOptions.find((o) => o.value === v)?.color || "text-slate-700";
};

const getCriticalClass = (critical: number): string => {
  if (critical >= 8) return "bg-red-100 text-red-700 ring-1 ring-red-200";
  if (critical >= 5) return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
};

const validateItem = (
  item: AuditItem,
  isIATF: boolean
): AuditItem["errors"] => {
  const errors: AuditItem["errors"] = {};
  if (item.value === "") errors.value = "Required";

  if (needsDetails(item.value, isIATF)) {
    if (!item.findings.trim()) errors.findings = "Required";
    if (item.requestCAR && !item.carReason.trim()) {
      errors.carReason = "Required for CAR request";
    }
  }
  return errors;
};

// ==================== SUB-COMPONENTS ====================

const AuditHeader = ({
  onExport,
  canExport,
  auditorId,
  selectedPlannedAuditId,
  auditorOptions,
  auditOptions,
  pickableLoading,
  submitting,
  onAuditorChange,
  onAuditChange,
  progress,
  carCount,
  hasItems,
  summary,
  onSummaryChange,
  isIATF,
  questionnaireName,
}: {
  onExport: () => void;
  canExport: boolean;
  auditorId: number;
  selectedPlannedAuditId: number | "";
  auditorOptions: any[];
  auditOptions: any[];
  pickableLoading: boolean;
  submitting: boolean;
  onAuditorChange: (value: string | number) => void;
  onAuditChange: (value: number | "") => void;
  progress: number;
  carCount: number;
  hasItems: boolean;
  summary: AuditSummary;
  onSummaryChange: (field: keyof AuditSummary, value: string) => void;
  isIATF: boolean;
  questionnaireName: string;
}) => (
  <div>
    {/* Header Title */}
    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <ClipboardList className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Audit Execution — {isIATF ? "IATF" : "Standard"}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={!canExport}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={16} className="text-slate-600" />
        Export CSV
      </button>
    </div>
    {/* Selection Panel */}
    <div className="p-6 bg-slate-50/50 border-b border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Auditor
          </label>
          <div className="relative">
            <Select
              placeholder="Select an auditor..."
              options={auditorOptions}
              defaultValue={auditorId || ""}
              onChange={onAuditorChange}
              className="w-full p-3 pr-10 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={submitting}
            />
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Planned Audit
          </label>
          <div className="relative">
            <Select
              key={`${selectedPlannedAuditId}-${auditOptions.length}`}
              options={auditOptions}
              placeholder={
                pickableLoading
                  ? "Loading audits..."
                  : !auditorId
                  ? "Select auditor first..."
                  : "Select planned audit..."
              }
              defaultValue={selectedPlannedAuditId}
              onChange={(value) => onAuditChange(value ? Number(value) : "")}
              className="w-full p-3 pr-10 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={!auditorId || pickableLoading || submitting}
            />
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
    {/* Audit Summary */}
    {hasItems && (
      <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="text-indigo-600" size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Audit Summary
              </h2>
              <p className="text-xs text-slate-600">
                Required before submission
              </p>
            </div>
          </div>

          {/* Questionnaire Name Badge */}
          {questionnaireName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <ClipboardList size={16} className="text-indigo-600" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  {questionnaireName}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    isIATF
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isIATF ? "IATF (1-5)" : "Standard (0-10)"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar size={14} className="text-slate-500" />
              Audit Date
            </label>
            <input
              type="date"
              value={summary.auditDate}
              onChange={(e) => onSummaryChange("auditDate", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock size={14} className="text-slate-500" />
              Start Time
            </label>
            <input
              type="time"
              value={summary.startTime}
              onChange={(e) => onSummaryChange("startTime", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock size={14} className="text-slate-500" />
              End Time
            </label>
            <input
              type="time"
              value={summary.endTime}
              onChange={(e) => onSummaryChange("endTime", e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="hidden lg:block"></div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Strong Points
            </label>
            <textarea
              rows={2}
              value={summary.strongPoints}
              onChange={(e) => onSummaryChange("strongPoints", e.target.value)}
              placeholder="Describe strengths observed..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Weak Points
            </label>
            <textarea
              rows={2}
              value={summary.weakPoints}
              onChange={(e) => onSummaryChange("weakPoints", e.target.value)}
              placeholder="Describe weaknesses or non-conformities..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>
    )}
    {/* Progress Bar */}
    {hasItems && (
      <div className="p-5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm font-semibold text-slate-700">
            Progress:
          </span>
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-right">
            {progress}%
          </span>
        </div>

        {carCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle
              size={16}
              className="text-orange-600 flex-shrink-0"
            />
            <span className="text-sm text-orange-700 font-medium">
              {carCount} CAR{carCount > 1 ? "s" : ""} will be requested upon
              submission
            </span>
          </div>
        )}
      </div>
    )}
  </div>
);

const EvidenceUpload = ({
  evidence,
  previews,
  questionId,
  onAdd,
  onRemove,
}: {
  evidence: File[];
  previews: Map<string, string>;
  questionId: number;
  onAdd: (files: FileList | null) => void;
  onRemove: (idx: number) => void;
}) => (
  <div className="space-y-2">
    <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors">
      <Upload size={14} className="text-slate-600" />
      <span className="text-slate-700">Upload Image</span>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onAdd(e.target.files)}
      />
    </label>

    {evidence.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {evidence.map((file, idx) => {
          const key = `${questionId}-${file.name}-${file.size}`;
          return (
            <div
              key={key}
              className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm"
            >
              <img
                src={previews.get(key)}
                alt={file.name}
                className="h-16 w-16 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const AuditRow = ({
  item,
  previews,
  valueOptions,
  isIATF,
  onUpdateField,
  onToggleCAR,
  onAddEvidence,
  onRemoveEvidence,
}: {
  item: AuditItem;
  previews: Map<string, string>;
  valueOptions: ValueOption[];
  isIATF: boolean;
  onUpdateField: <K extends keyof AuditItem>(
    questionId: number,
    field: K,
    value: AuditItem[K]
  ) => void;
  onToggleCAR: (questionId: number) => void;
  onAddEvidence: (questionId: number, files: FileList | null) => void;
  onRemoveEvidence: (questionId: number, idx: number) => void;
}) => {
  const hasErrors = Object.keys(item.errors).length > 0;
  const detailsRequired = needsDetails(item.value, isIATF);
  const canRequestCAR =
    item.value !== "" && item.value !== -1 && detailsRequired;

  return (
    <tr
      className={`group hover:bg-slate-50/80 transition-colors ${
        hasErrors ? "bg-red-50/40" : ""
      } ${item.requestCAR ? "bg-orange-50/40" : ""}`}
    >
      <td className="px-4 py-4 align-top">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
          <span className="text-sm font-semibold text-slate-700">
            {item.row}
          </span>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm text-slate-800 leading-relaxed">
          {item.question}
        </p>
      </td>

      <td className="px-4 py-4 align-top text-center">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${getCriticalClass(
            item.critical
          )}`}
        >
          {item.critical}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        <select
          value={item.value}
          onChange={(e) => {
            const val =
              e.target.value === ""
                ? ""
                : (Number(e.target.value) as AuditValue);
            onUpdateField(item.questionId, "value", val);
          }}
          aria-invalid={!!item.errors?.value}
          className={`w-full p-2.5 text-sm border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            item.errors?.value
              ? "border-red-400 bg-red-50"
              : "border-slate-300 bg-white hover:border-slate-400"
          } ${getValueColor(item.value, valueOptions)} font-medium`}
        >
          <option value="">Select value...</option>
          {valueOptions.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {item.errors?.value && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {item.errors.value}
          </p>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        <textarea
          value={item.findings}
          onChange={(e) =>
            onUpdateField(item.questionId, "findings", e.target.value)
          }
          rows={3}
          placeholder={
            detailsRequired ? "Required details..." : "Optional notes..."
          }
          aria-invalid={!!item.errors?.findings}
          className={`w-full p-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            item.errors?.findings
              ? "border-red-400 bg-red-50"
              : "border-slate-300 hover:border-slate-400"
          }`}
        />
        {item.errors?.findings && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {item.errors.findings}
          </p>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        <EvidenceUpload
          evidence={item.evidence}
          previews={previews}
          questionId={item.questionId}
          onAdd={(files) => onAddEvidence(item.questionId, files)}
          onRemove={(idx) => onRemoveEvidence(item.questionId, idx)}
        />
      </td>

      <td className="px-4 py-4 align-top">
        {canRequestCAR ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer group/checkbox">
              <input
                type="checkbox"
                checked={item.requestCAR}
                onChange={() => onToggleCAR(item.questionId)}
                className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 group-hover/checkbox:text-orange-700 transition-colors">
                Request CAR
              </span>
            </label>

            {item.requestCAR && (
              <>
                <textarea
                  value={item.carReason}
                  onChange={(e) =>
                    onUpdateField(item.questionId, "carReason", e.target.value)
                  }
                  rows={3}
                  placeholder="indicate the issue  (required)..."
                  aria-invalid={!!item.errors?.carReason}
                  className={`w-full p-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    item.errors?.carReason
                      ? "border-red-400 bg-red-50"
                      : "border-orange-300 hover:border-orange-400"
                  }`}
                />
                {item.errors?.carReason && (
                  <p className="text-xs text-red-600 font-medium">
                    {item.errors.carReason}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2">
            {item.value === ""
              ? "Select a value first"
              : item.value === -1
              ? "Optional - No CAR"
              : "No CAR needed"}
          </div>
        )}
      </td>
    </tr>
  );
};

// ==================== MAIN COMPONENT ====================
export default function AuditChecklistRefactored() {
  const today = new Date().toISOString().split("T")[0];

  // State
  const [selectedAuditor, setSelectedAuditor] = useState<string | number>("");
  const [selectedPlannedAuditId, setSelectedPlannedAuditId] = useState<
    number | ""
  >("");
  const [questionnaireName, setQuestionnaireName] = useState<string>("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const [summary, setSummary] = useState<AuditSummary>({
    auditDate: today,
    startTime: "",
    endTime: "",
    strongPoints: "",
    weakPoints: "",
    questionnaireName: "",
  });

  // Redux
  const { auditorOptions } = Enum();
  const dispatch = useDispatch<AppDispatch>();
  const { pickableAudits, pickableLoading } = useSelector(
    (state: RootState) => state.audit
  );

  const auditorId = useMemo(
    () => Number(selectedAuditor) || 0,
    [selectedAuditor]
  );

  // Determine scoring system
  const valueOptions = useMemo(
    () => getValueOptions(questionnaireName),
    [questionnaireName]
  );
  const isIATF = valueOptions === IATF_VALUE_OPTIONS;

  // Fetch pickable audits when auditor changes
  useEffect(() => {
    if (!auditorId) {
      setSelectedPlannedAuditId("");
      setItems([]);
      setSubmitted(false);
      setQuestionnaireName("");
      return;
    }

    dispatch(fetchPickableAuditsByAuditor(auditorId));
    setSelectedPlannedAuditId("");
    setItems([]);
    setSubmitted(false);
    setQuestionnaireName("");
  }, [auditorId, dispatch]);

  // Handle audit selection
  const handleAuditSelection = async (auditId: number | "") => {
    setSelectedPlannedAuditId(auditId);
    setSubmitted(false);

    if (auditId === "") {
      setItems([]);
      setQuestionnaireName("");
      return;
    }

    // Extract questionnaire name from selected audit
    const selectedAudit = pickableAudits.find((a) => a.id === auditId);
    if (selectedAudit) {
      // Adjust these property names based on your actual data structure
      const name = selectedAudit.questionnaire_name || "";
      setQuestionnaireName(name);
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
      setQuestionnaireName("");
      toast.error("Failed to load audit questions");
    }
  };

  // Preview management
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

  // Field update handler
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
            !needsDetails(newValue, isIATF)
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

  const handleSummaryChange = (field: keyof AuditSummary, value: string) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || submitting) return;

    if (selectedPlannedAuditId === "") {
      toast.error("Select an audit first");
      return;
    }

    const validated = items.map((item) => ({
      ...item,
      errors: validateItem(item, isIATF),
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
            critical_value: item.critical,
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
          data: {
            answers,
            audit_date: summary.auditDate,
            start_time: summary.startTime,
            end_time: summary.endTime,
            strong_points: summary.strongPoints,
            weak_points: summary.weakPoints,
          },
        })
      );
      console.log(resultAction);
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

      dispatch(removePickableAudit(selectedPlannedAuditId));

      // Reset
      setSubmitted(true);
      setSelectedPlannedAuditId("");
      setItems([]);
      setQuestionnaireName("");
      setSummary({
        auditDate: today,
        startTime: "",
        endTime: "",
        strongPoints: "",
        weakPoints: "",
        questionnaireName: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Execution failed. Please try again.");
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
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

  // Computed values
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
      needsDetails(item.value, isIATF)
  ).length;

  const canSubmit =
    selectedPlannedAuditId !== "" &&
    auditorId > 0 &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.value !== "" &&
        (!needsDetails(item.value, isIATF) || item.findings.trim()) &&
        (!item.requestCAR || item.carReason.trim())
    ) &&
    summary.auditDate.trim() !== "" &&
    summary.strongPoints.trim() !== "" &&
    summary.weakPoints.trim() !== "" &&
    summary.startTime.trim() !== "" &&
    summary.endTime.trim() !== "";

  const auditOptions = pickableAudits.map((a) => ({
    value: a.id,
    label: `${a.status === "rescheduled" ? "🔁 RESCHEDULED" : "🗓️ PLANNED"} | ${
      a.audit_number
    } | ${a.planned_date} | ${a.planned_start_time}-${a.planned_end_time}`,
  }));

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <AuditHeader
              onExport={downloadCSV}
              canExport={canSubmit}
              auditorId={auditorId}
              selectedPlannedAuditId={selectedPlannedAuditId}
              auditorOptions={auditorOptions}
              auditOptions={auditOptions}
              pickableLoading={pickableLoading}
              submitting={submitting}
              onAuditorChange={setSelectedAuditor}
              onAuditChange={handleAuditSelection}
              progress={progress}
              carCount={carCount}
              hasItems={items.length > 0}
              summary={summary}
              onSummaryChange={handleSummaryChange}
              isIATF={isIATF}
              questionnaireName={questionnaireName}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[280px]">
                      Question
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                      Critical
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-52">
                      Value
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-56">
                      Findings
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-40">
                      Evidence
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-56">
                      CAR Reason
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <FileText className="text-slate-400" size={40} />
                          </div>
                          <div>
                            <p className="text-base font-medium text-slate-700 mb-1">
                              No Audit Selected
                            </p>
                            <p className="text-sm text-slate-500">
                              Select a planned audit to load questions
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <AuditRow
                        key={item.questionId}
                        item={item}
                        previews={previews}
                        valueOptions={valueOptions}
                        isIATF={isIATF}
                        onUpdateField={updateField}
                        onToggleCAR={toggleCARRequest}
                        onAddEvidence={addEvidence}
                        onRemoveEvidence={removeEvidence}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">
                      {isIATF
                        ? "Values ≤3 require findings. Check 'Request CAR' for corrective actions."
                        : "Values ≤5 require findings. Check 'Request CAR' for corrective actions."}
                    </p>
                    {carCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-600" />
                        <p className="text-sm text-orange-700 font-medium">
                          {carCount} CAR{carCount > 1 ? "s" : ""} will be
                          submitted
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting || submitted}
                    className={`inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                      submitted
                        ? "bg-emerald-600 text-white cursor-default"
                        : canSubmit
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {submitted ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Submitted</span>
                      </>
                    ) : submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      "Submit Audit"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
