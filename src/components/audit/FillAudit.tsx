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

import VdaExecution from "./VdaExecution";
import IATFNonConformityManager from "./IatfNonConformityManager";

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
type AuditValue = "" | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;

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
const IATF_PLANT_MANAGER_VALUE_OPTIONS: ValueOption[] = [
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

const VDA_VALUE_OPTIONS: ValueOption[] = [
  { value: -1, label: "Optional", color: "text-yellow-700" },
  { value: 0, label: "0 - Not fulfilled", color: "text-red-700" },
  { value: 4, label: "4 - Partially fulfilled", color: "text-orange-700" },
  { value: 6, label: "6 - Mostly fulfilled", color: "text-amber-600" },
  { value: 8, label: "8 - Fulfilled", color: "text-emerald-600" },
  { value: 10, label: "10 - Exceeded", color: "text-emerald-700" },
];

// ==================== UTILITIES ====================
const getValueOptions = (questionnaireName: string): ValueOption[] => {
  const name = questionnaireName.toLowerCase();

  if (name.includes("vda")) return VDA_VALUE_OPTIONS;
  if (name.includes("plant manager iatf")) return IATF_PLANT_MANAGER_VALUE_OPTIONS;

  return STANDARD_VALUE_OPTIONS;
};

const needsDetails = (v: AuditValue, questionnaireName: string): boolean => {
  if (v === "" || v === -1) return false;

  const name = questionnaireName.toLowerCase();

  if (name.includes("vda")) return v < 6;
  if (name.includes("iatf") || name.includes("plant manager")) return v <= 3;

  return v <= 5;
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

const validateItem = (item: AuditItem, questionnaireName: string): AuditItem["errors"] => {
  const errors: AuditItem["errors"] = {};
  if (item.value === "") errors.value = "Required";

  if (needsDetails(item.value, questionnaireName)) {
    if (!item.findings.trim()) errors.findings = "Required";
    if (item.requestCAR && !item.carReason.trim()) {
      errors.carReason = "Required for CAR request";
    }
  }
  return errors;
};

const getQuestionnaireType = (questionnaireName: string): string => {
  const name = questionnaireName.toLowerCase();
  if (name.includes("vda")) return "VDA 6.3";
  if (name.includes("iatf") || name.includes("plant manager")) return "IATF";
  return "Standard";
};

const getScaleDescription = (questionnaireName: string): string => {
  const name = questionnaireName.toLowerCase();
  if (name.includes("vda")) return "VDA (0-10)";
  if (name.includes("iatf") || name.includes("plant manager")) return "IATF (1-5)";
  return "Standard (0-10)";
};

const getFooterMessage = (questionnaireName: string): string => {
  const name = questionnaireName.toLowerCase();
  if (name.includes("vda")) {
    return "Values <6 require findings. Check 'Request CAR' for corrective actions.";
  }
  if (name.includes("iatf") || name.includes("plant manager")) {
    return "Values ≤3 require findings. Check 'Request CAR' for corrective actions.";
  }
  return "Values ≤5 require findings. Check 'Request CAR' for corrective actions.";
};

// IATF NC mode: IATF questionnaires except Plant Manager IATF
const isIATFNCMode = (questionnaireName: string): boolean => {
  const name = questionnaireName.toLowerCase();
  return name.includes("iatf") && !name.includes("plant manager");
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
  questionnaireName: string;
}) => {
  const questionnaireType = getQuestionnaireType(questionnaireName);
  const scaleDescription = getScaleDescription(questionnaireName);

  return (
    <div>
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <ClipboardList className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Audit Execution — {questionnaireType}
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

      <div className="p-6 bg-slate-50/50 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Auditor</label>
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Planned Audit</label>
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

      {/* Summary + Progress are NOT shown for IATF NC mode */}
      {hasItems && !isIATFNCMode(questionnaireName) && (
        <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="text-indigo-600" size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">Audit Summary</h2>
                <p className="text-xs text-slate-600">Required before submission</p>
              </div>
            </div>

            {questionnaireName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                <ClipboardList size={16} className="text-indigo-600" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{questionnaireName}</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      questionnaireType === "VDA 6.3"
                        ? "bg-green-100 text-green-700"
                        : questionnaireType === "IATF"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {scaleDescription}
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

            <div className="hidden lg:block" />

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Strong Points</label>
              <textarea
                rows={2}
                value={summary.strongPoints}
                onChange={(e) => onSummaryChange("strongPoints", e.target.value)}
                placeholder="Describe strengths observed..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Weak Points</label>
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

      {hasItems && !isIATFNCMode(questionnaireName) && (
        <div className="p-5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm font-semibold text-slate-700">Progress:</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-right">{progress}%</span>
          </div>

          {carCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
              <span className="text-sm text-orange-700 font-medium">
                {carCount} CAR{carCount > 1 ? "s" : ""} will be requested upon submission
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAdd(e.target.files)} />
    </label>

    {evidence.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {evidence.map((file, idx) => {
          const key = `${questionId}-${file.name}-${file.size}`;
          return (
            <div key={key} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <img src={previews.get(key)} alt={file.name} className="h-16 w-16 object-cover" />
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
  questionnaireName,
  onUpdateField,
  onToggleCAR,
  onAddEvidence,
  onRemoveEvidence,
}: {
  item: AuditItem;
  previews: Map<string, string>;
  valueOptions: ValueOption[];
  questionnaireName: string;
  onUpdateField: <K extends keyof AuditItem>(questionId: number, field: K, value: AuditItem[K]) => void;
  onToggleCAR: (questionId: number) => void;
  onAddEvidence: (questionId: number, files: FileList | null) => void;
  onRemoveEvidence: (questionId: number, idx: number) => void;
}) => {
  const hasErrors = Object.keys(item.errors).length > 0;
  const detailsRequired = needsDetails(item.value, questionnaireName);
  const canRequestCAR = item.value !== "" && item.value !== -1 && detailsRequired;

  return (
    <tr
      className={`group hover:bg-slate-50/80 transition-colors ${
        hasErrors ? "bg-red-50/40" : ""
      } ${item.requestCAR ? "bg-orange-50/40" : ""}`}
    >
      <td className="px-4 py-4 align-top">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
          <span className="text-sm font-semibold text-slate-700">{item.row}</span>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm text-slate-800 leading-relaxed">{item.question}</p>
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
            const val = e.target.value === "" ? "" : (Number(e.target.value) as AuditValue);
            onUpdateField(item.questionId, "value", val);
          }}
          aria-invalid={!!item.errors?.value}
          className={`w-full p-2.5 text-sm border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            item.errors?.value ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"
          } ${getValueColor(item.value, valueOptions)} font-medium`}
        >
          <option value="">Select value...</option>
          {valueOptions.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {item.errors?.value && <p className="text-xs text-red-600 mt-1 font-medium">{item.errors.value}</p>}
      </td>

      <td className="px-4 py-4 align-top">
        <textarea
          value={item.findings}
          onChange={(e) => onUpdateField(item.questionId, "findings", e.target.value)}
          rows={3}
          placeholder={detailsRequired ? "Required details..." : "Optional notes..."}
          aria-invalid={!!item.errors?.findings}
          className={`w-full p-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            item.errors?.findings ? "border-red-400 bg-red-50" : "border-slate-300 hover:border-slate-400"
          }`}
        />
        {item.errors?.findings && <p className="text-xs text-red-600 mt-1 font-medium">{item.errors.findings}</p>}
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
                  onChange={(e) => onUpdateField(item.questionId, "carReason", e.target.value)}
                  rows={3}
                  placeholder="indicate the issue  (required)..."
                  aria-invalid={!!item.errors?.carReason}
                  className={`w-full p-2.5 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    item.errors?.carReason ? "border-red-400 bg-red-50" : "border-orange-300 hover:border-orange-400"
                  }`}
                />
                {item.errors?.carReason && <p className="text-xs text-red-600 font-medium">{item.errors.carReason}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2">
            {item.value === "" ? "Select a value first" : item.value === -1 ? "Optional - No CAR" : "No CAR needed"}
          </div>
        )}
      </td>
    </tr>
  );
};

// ==================== MAIN COMPONENT ====================
export default function AuditChecklistRefactored() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedAuditor, setSelectedAuditor] = useState<string | number>("");
  const [selectedPlannedAuditId, setSelectedPlannedAuditId] = useState<number | "">("");
  const [questionnaireName, setQuestionnaireName] = useState<string>("");

  // IATF NC extras
  const [auditee_name, setAuditeeName] = useState<string>("");

  const [items, setItems] = useState<AuditItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  // VDA selection state
  const [vdaSelectedIds, setVdaSelectedIds] = useState<Set<number>>(new Set());

  const [summary, setSummary] = useState<AuditSummary>({
    auditDate: today,
    startTime: "",
    endTime: "",
    strongPoints: "",
    weakPoints: "",
    questionnaireName: "",
  });

  const { auditorOptions } = Enum();
  const dispatch = useDispatch<AppDispatch>();
  const { pickableAudits, pickableLoading } = useSelector((state: RootState) => state.audit);

  const auditorId = useMemo(() => Number(selectedAuditor) || 0, [selectedAuditor]);

  const valueOptions = useMemo(() => getValueOptions(questionnaireName), [questionnaireName]);

  const isVda = useMemo(() => questionnaireName.toLowerCase().includes("vda"), [questionnaireName]);

  const showIATFNCInterface = useMemo(() => isIATFNCMode(questionnaireName), [questionnaireName]);

  // For VDA: only selected questions count
  const effectiveItems = useMemo(() => {
    if (!isVda) return items;
    return items.filter((it) => vdaSelectedIds.has(it.questionId));
  }, [items, isVda, vdaSelectedIds]);

  // Fetch pickable audits when auditor changes
  useEffect(() => {
    if (!auditorId) {
      setSelectedPlannedAuditId("");
      setItems([]);
      setSubmitted(false);
      setQuestionnaireName("");
      setVdaSelectedIds(new Set());
      setAuditeeName("");
      return;
    }

    dispatch(fetchPickableAuditsByAuditor(auditorId));
    setSelectedPlannedAuditId("");
    setItems([]);
    setSubmitted(false);
    setQuestionnaireName("");
    setVdaSelectedIds(new Set());
    setAuditeeName("");
  }, [auditorId, dispatch]);

  const handleAuditSelection = async (auditId: number | "") => {
    setSelectedPlannedAuditId(auditId);
    setSubmitted(false);

    if (auditId === "") {
      setItems([]);
      setQuestionnaireName("");
      setVdaSelectedIds(new Set());
      setAuditeeName("");
      return;
    }

    const selectedAudit = pickableAudits.find((a) => a.id === auditId);
    const auditQName = selectedAudit?.questionnaire_name || "";
    setQuestionnaireName(auditQName);

    const auditeeEmail = selectedAudit?.auditees?.[0]?.email || "";
    setAuditeeName(auditeeEmail);

    // IATF NC mode: do NOT load questions; render NC manager UI
    if (isIATFNCMode(auditQName)) {
      setItems([]);
      setVdaSelectedIds(new Set());
      return;
    }

    const result = await dispatch(getAuditQuestions(auditId));

    if (getAuditQuestions.fulfilled.match(result)) {
      const questions = result.payload as Array<{
        id: number;
        description: string;
        critical_value: number;
      }>;

      const newItems: AuditItem[] = questions.map((q, idx) => ({
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
      }));

      setItems(newItems);

      // For VDA, default select all questions
      if (auditQName.toLowerCase().includes("vda")) {
        setVdaSelectedIds(new Set(newItems.map((x) => x.questionId)));
      } else {
        setVdaSelectedIds(new Set());
      }
    } else {
      setItems([]);
      setQuestionnaireName("");
      setVdaSelectedIds(new Set());
      toast.error("Failed to load audit questions");
    }
  };

  // IATF NC submission (uses NC manager)
  const handleIATFNCSubmission = async (
    nonConformities: any[],
    auditDetails: {
      actualStartTime: string;
      actualEndTime: string;
      strongPoints: string;
      weakPoints: string;
    }
  ) => {
    if (!selectedPlannedAuditId) {
      toast.error("No audit selected");
      return;
    }

    setSubmitting(true);

    try {
      type NCClassification = "Minor" | "Major" | "Improvement" | "Strong Point";

      const classificationMap: Record<NCClassification, number> = {
        Minor: 1,
        Major: 2,
        Improvement: 3,
        "Strong Point": 4,
      };

      const answers = await Promise.all(
        nonConformities.map(async (nc, index) => {
          const uploadedEvidence = await Promise.all(
            (nc.evidence || []).map(async (file: File) => {
              const uploadResult = await apiUploadFile(file);
              return {
                filename: uploadResult.filename,
                mimetype: uploadResult.mimetype,
                size: uploadResult.size,
                file_url: uploadResult.file_url,
              };
            })
          );

          const classificationValue =
            classificationMap[nc.classification as NCClassification] || 1;

          return {
            question_id: -(index + 1),
            value: classificationValue,
            finding_text: nc.findings,
            documents: uploadedEvidence,
            car_reason: nc.observedNonConformity,
            request_car: nc.requestCAR,
            critical_value: 0,
            process: nc.process,
            standard_paragraph: nc.normParagraph,
            classification: nc.classification,
          };
        })
      );

      const resultAction = await dispatch(
        executeAuditThunk({
          auditId: selectedPlannedAuditId,
          data: {
            answers,
            audit_date: summary.auditDate,
            start_time: auditDetails.actualStartTime,
            end_time: auditDetails.actualEndTime,
            strong_points: auditDetails.strongPoints || "",
            weak_points: auditDetails.weakPoints || "",
          },
        })
      );

      if (!executeAuditThunk.fulfilled.match(resultAction)) {
        toast.error(String(resultAction.payload || "Failed to submit non-conformities"));
        return;
      }

      const carsCreated = nonConformities.filter((nc) => nc.requestCAR).length;

      toast.success(
        carsCreated > 0
          ? `${nonConformities.length} NC(s) submitted. ${carsCreated} CAR(s) created.`
          : `${nonConformities.length} NC(s) submitted successfully.`
      );

      dispatch(removePickableAudit(selectedPlannedAuditId));
      setSubmitted(true);
      setSelectedPlannedAuditId("");
      setQuestionnaireName("");
      setAuditeeName("");
    } catch (err: any) {
      console.error("IATF NC submission error:", err);
      toast.error(err?.message || "Failed to submit non-conformities");
      throw err;
    } finally {
      setSubmitting(false);
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

  const updateField = <K extends keyof AuditItem>(questionId: number, field: K, value: AuditItem[K]) => {
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
          if (newValue === "" || newValue === -1 || !needsDetails(newValue, questionnaireName)) {
            updated.requestCAR = false;
            updated.carReason = "";
          }
        }

        return updated;
      })
    );
  };

  const toggleCARRequest = (questionId: number) => {
    setItems((prev) => prev.map((item) => (item.questionId === questionId ? { ...item, requestCAR: !item.requestCAR } : item)));
  };

  const addEvidence = (questionId: number, files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setItems((prev) =>
      prev.map((item) => (item.questionId === questionId ? { ...item, evidence: [...item.evidence, ...imageFiles] } : item))
    );
  };

  const removeEvidence = (questionId: number, idx: number) => {
    setItems((prev) => prev.map((item) => (item.questionId === questionId ? { ...item, evidence: item.evidence.filter((_, i) => i !== idx) } : item)));
  };

  const handleSummaryChange = (field: keyof AuditSummary, value: string) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  // VDA selection handlers
  const toggleVdaSelect = (questionId: number) => {
    setVdaSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const selectAllInSection = (sectionKey: string, checked: boolean) => {
    const getVdaSectionKey = (questionText: string): string => {
      const m = questionText.trim().match(/^(\d+)(?:\.\d+)+/);
      if (!m) return "Other";
      const major = Number(m[1]);
      if (major >= 2 && major <= 7) return `P${major}`;
      return "Other";
    };

    const idsInSection = items
      .filter((it) => getVdaSectionKey(it.question) === sectionKey)
      .map((it) => it.questionId);

    setVdaSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) idsInSection.forEach((id) => next.add(id));
      else idsInSection.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || submitting) return;

    if (selectedPlannedAuditId === "") {
      toast.error("Select an audit first");
      return;
    }

    if (isVda && effectiveItems.length === 0) {
      toast.error("Select at least one VDA question");
      return;
    }

    const validated = effectiveItems.map((item) => ({
      ...item,
      errors: validateItem(item, questionnaireName),
    }));

    // merge validation errors back into full items state
    setItems((prev) =>
      prev.map((it) => {
        const v = validated.find((x) => x.questionId === it.questionId);
        return v ? { ...it, errors: v.errors } : it;
      })
    );

    const hasErrors = validated.some((item) => Object.keys(item.errors).length > 0);
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
            car_reason: item.requestCAR && item.carReason?.trim() ? item.carReason.trim() : null,
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

      setSubmitted(true);
      setSelectedPlannedAuditId("");
      setItems([]);
      setQuestionnaireName("");
      setVdaSelectedIds(new Set());
      setAuditeeName("");
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

  const downloadCSV = () => {
    const rows = [
      ["#", "Question", "Critical", "Value", "Findings", "CAR Requested", "CAR Reason", "Evidence"],
      ...effectiveItems.map((item) => [
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
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed values (use effectiveItems)
  const progress = effectiveItems.length
    ? Math.round((effectiveItems.filter((i) => i.value !== "").length / effectiveItems.length) * 100)
    : 0;

  const carCount = effectiveItems.filter(
    (item) => item.requestCAR && item.value !== "" && item.value !== -1 && needsDetails(item.value, questionnaireName)
  ).length;

  const canSubmit =
    selectedPlannedAuditId !== "" &&
    auditorId > 0 &&
    effectiveItems.length > 0 &&
    effectiveItems.every(
      (item) =>
        item.value !== "" &&
        (!needsDetails(item.value, questionnaireName) || item.findings.trim()) &&
        (!item.requestCAR || item.carReason.trim())
    ) &&
    summary.auditDate.trim() !== "" &&
    summary.strongPoints.trim() !== "" &&
    summary.weakPoints.trim() !== "" &&
    summary.startTime.trim() !== "" &&
    summary.endTime.trim() !== "";

  const auditOptions = pickableAudits.map((a) => ({
    value: a.id,
    label: `${a.status === "rescheduled" ? "🔁 RESCHEDULED" : "🗓️ PLANNED"} | ${a.audit_number} | ${a.planned_date} | ${a.planned_start_time}-${a.planned_end_time}`,
  }));

  // ==================== RENDER ====================

  // IATF NC mode view
  if (showIATFNCInterface && selectedPlannedAuditId) {
    const selectedAudit = pickableAudits.find((a) => a.id === selectedPlannedAuditId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedPlannedAuditId("");
              setQuestionnaireName("");
              setSubmitted(false);
              setAuditeeName("");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back to Audit Selection
          </button>
        </div>

        <IATFNonConformityManager
          plannedAuditId={selectedPlannedAuditId}
          questionnaireName={questionnaireName}
          auditNumber={selectedAudit?.audit_number}
          auditeeName={auditee_name}
          auditDate={selectedAudit?.planned_date}
          plannedStartTime={selectedAudit?.planned_start_time}
          plannedEndTime={selectedAudit?.planned_end_time}
          onSubmit={handleIATFNCSubmission}
        />
      </div>
    );
  }

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
              questionnaireName={questionnaireName}
            />
          </div>

          {isVda ? (
            <div className="space-y-4">
              <VdaExecution
                items={items}
                valueOptions={valueOptions}
                questionnaireName={questionnaireName}
                selectedIds={vdaSelectedIds}
                onToggleSelect={toggleVdaSelect}
                onSelectAllInSection={selectAllInSection}
                onUpdateField={updateField}
                onToggleCAR={toggleCARRequest}
              />

              {effectiveItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">{getFooterMessage(questionnaireName)}</p>
                        {carCount > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-orange-600" />
                            <p className="text-sm text-orange-700 font-medium">
                              {carCount} CAR{carCount > 1 ? "s" : ""} will be submitted
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
                </div>
              )}
            </div>
          ) : (
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
                              <p className="text-base font-medium text-slate-700 mb-1">No Audit Selected</p>
                              <p className="text-sm text-slate-500">Select a planned audit to load questions</p>
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
                          questionnaireName={questionnaireName}
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
                      <p className="text-sm text-slate-600">{getFooterMessage(questionnaireName)}</p>
                      {carCount > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-600" />
                          <p className="text-sm text-orange-700 font-medium">
                            {carCount} CAR{carCount > 1 ? "s" : ""} will be submitted
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
          )}
        </form>
      </div>
    </div>
  );
}