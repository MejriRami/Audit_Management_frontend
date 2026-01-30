import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import vdaQuestions from "./vda63_questions.json";

type AuditValue = "" | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;

export interface AuditItem {
  row: number;
  questionId: number;          // internal id used by your form
  question: string;            // displayed text
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

export interface ValueOption {
  value: AuditValue;
  label: string;
  color: string;
}

type VdaQuestionMeta = {
  question_id: string;
  element: "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | string;
  question_code: string;
  question_text_en: string;
  is_asterisk: boolean;
};

type Props = {
  items: AuditItem[];
  valueOptions: ValueOption[];
  questionnaireName: string;

  selectedIds: Set<number>;
  onToggleSelect: (questionId: number) => void;

  onSelectAllInSection: (sectionKey: string, checked: boolean) => void;

  onUpdateField: <K extends keyof AuditItem>(
    questionId: number,
    field: K,
    value: AuditItem[K]
  ) => void;

  onToggleCAR: (questionId: number) => void;
};

const SECTION_ORDER = ["P2", "P3", "P4", "P5", "P6", "P7"] as const;

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .trim();
}

function needsDetails(v: AuditValue, questionnaireName: string): boolean {
  if (v === "" || v === -1) return false;
  const name = questionnaireName.toLowerCase();
  if (name.includes("vda")) return (v as number) < 6;
  return (v as number) <= 5;
}

function getCriticalClass(critical: number): string {
  if (critical >= 8) return "bg-red-100 text-red-700 ring-1 ring-red-200";
  if (critical >= 5) return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
}

// Optional: stable sort by question_code (P2.1.1, P2.1.2, ...)
function sortByCode(a: VdaQuestionMeta, b: VdaQuestionMeta) {
  return a.question_code.localeCompare(b.question_code, undefined, { numeric: true });
}

export default function VdaExecution({
  items,
  valueOptions,
  questionnaireName,
  selectedIds,
  onToggleSelect,
  onSelectAllInSection,
  onUpdateField,
  onToggleCAR,
}: Props) {
  const metaList = useMemo(() => vdaQuestions as VdaQuestionMeta[], []);

  // ✅ Group JSON questions by element (guaranteed full list)
  const metaByElement = useMemo(() => {
    const map = new Map<string, VdaQuestionMeta[]>();
    for (const sec of SECTION_ORDER) map.set(sec, []);

    for (const q of metaList) {
      if (!q?.element) continue;
      if (!map.has(q.element)) map.set(q.element, []);
      map.get(q.element)!.push(q);
    }

    // sort each section by code
    for (const [, arr] of map.entries()) arr.sort(sortByCode);

    return map;
  }, [metaList]);

  // ✅ Link AuditItem by matching question text (best we can do with current item shape)
  const itemByText = useMemo(() => {
    const map = new Map<string, AuditItem>();
    for (const it of items) map.set(norm(it.question), it);
    return map;
  }, [items]);

  // ✅ Multi-toggle
  const [enabledSections, setEnabledSections] = useState<Set<string>>(
    () => new Set(["P2"])
  );

  const toggleSection = (sec: string) => {
    setEnabledSections((prev) => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });
  };

  const visibleSections = SECTION_ORDER.filter((s) => enabledSections.has(s));

  // counts: how many questions in section + how many selected in that section
  const getCounts = (sec: string) => {
    const questions = metaByElement.get(sec) ?? [];
    let selected = 0;
    for (const q of questions) {
      const linkedItem = itemByText.get(norm(q.question_text_en));
      if (linkedItem && selectedIds.has(linkedItem.questionId)) selected++;
    }
    return { total: questions.length, selected };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-700">
          Enable one or more chapters (P2–P7). Under each enabled chapter you’ll see its full list of questions.
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* ✅ Vertical toggles */}
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Chapters
          </p>

          <div className="space-y-2">
            {SECTION_ORDER.map((sec) => {
              const { total, selected } = getCounts(sec);
              const enabled = enabledSections.has(sec);

              return (
                <label
                  key={sec}
                  className={[
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                    enabled
                      ? "bg-indigo-50 border-indigo-200"
                      : "bg-white border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleSection(sec)}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">{sec}</span>
                  </div>

                  <span className="text-xs font-medium text-slate-600">
                    {selected}/{total}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ✅ Questions under each enabled element */}
        {visibleSections.map((sec) => {
          const questions = metaByElement.get(sec) ?? [];
          const { total, selected } = getCounts(sec);

          // IMPORTANT:
          // Your existing onSelectAllInSection expects (sectionKey, checked)
          // It probably operates on "items". If your FillAudit logic selects by "element",
          // keep it as-is. If it selects by text, it will still work since items are linked.
          const allSelected = total > 0 && selected === total;

          return (
            <div key={sec} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{sec}</h3>
                  <p className="text-sm text-slate-500">
                    Selected {selected}/{total}
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAllInSection(sec, e.target.checked)}
                    className="w-4 h-4"
                  />
                  Select all
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-16">
                        Use
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-32">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[380px]">
                        Question
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                        Critical
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-52">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-64">
                        Findings
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-72">
                        CAR Reason
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {questions.map((q) => {
                      // link AuditItem if exists
                      const linkedItem = itemByText.get(norm(q.question_text_en));

                      // If not found in items, we can't evaluate/answer it (because handlers need questionId)
                      const isLoaded = !!linkedItem;

                      const selectedRow =
                        isLoaded && selectedIds.has(linkedItem!.questionId);

                      const detailsRequired =
                        isLoaded &&
                        selectedRow &&
                        needsDetails(linkedItem!.value, questionnaireName);

                      const canRequestCAR =
                        isLoaded &&
                        selectedRow &&
                        linkedItem!.value !== "" &&
                        linkedItem!.value !== -1 &&
                        detailsRequired;

                      return (
                        <tr
                          key={q.question_id}
                          className={isLoaded ? "hover:bg-slate-50/60" : "bg-slate-50"}
                        >
                          <td className="px-4 py-4 align-top">
                            <input
                              type="checkbox"
                              checked={!!selectedRow}
                              disabled={!isLoaded}
                              onChange={() => isLoaded && onToggleSelect(linkedItem!.questionId)}
                              className="w-5 h-5"
                            />
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span className="text-sm font-semibold text-slate-700">
                              {q.question_code}
                            </span>
                            {q.is_asterisk && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-bold rounded bg-red-50 text-red-700 border border-red-200">
                                *
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-sm text-slate-800">{q.question_text_en}</p>

                            {!isLoaded && (
                              <p className="text-xs text-amber-700 mt-1">
                                This question is in the JSON but not present in <code>items</code>.
                                Load/create AuditItems for it to answer.
                              </p>
                            )}

                            {isLoaded && !selectedRow && (
                              <p className="text-xs text-slate-500 italic mt-1">
                                Not selected — will not be evaluated
                              </p>
                            )}

                            {isLoaded && selectedRow && Object.keys(linkedItem!.errors || {}).length > 0 && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-red-600 font-medium">
                                <AlertTriangle size={14} />
                                Please complete required fields
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top text-center">
                            <span
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                                isLoaded ? getCriticalClass(linkedItem!.critical) : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isLoaded ? linkedItem!.critical : "--"}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <select
                              value={isLoaded ? linkedItem!.value : ""}
                              disabled={!isLoaded || !selectedRow}
                              onChange={(e) => {
                                if (!isLoaded) return;
                                const val =
                                  e.target.value === ""
                                    ? ""
                                    : (Number(e.target.value) as AuditValue);
                                onUpdateField(linkedItem!.questionId, "value", val);
                              }}
                              className={`w-full p-2.5 text-sm border rounded-lg ${
                                isLoaded && selectedRow
                                  ? "bg-white border-slate-300"
                                  : "bg-slate-50 border-slate-200 text-slate-400"
                              }`}
                            >
                              <option value="">Select value...</option>
                              {valueOptions.map((opt) => (
                                <option key={String(opt.value)} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            {isLoaded && selectedRow && linkedItem!.errors?.value && (
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                {linkedItem!.errors.value}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <textarea
                              value={
                                isLoaded ? (selectedRow ? linkedItem!.findings : "Disabled") : ""
                              }
                              disabled={!isLoaded || !selectedRow}
                              onChange={(e) => {
                                if (!isLoaded) return;
                                onUpdateField(linkedItem!.questionId, "findings", e.target.value);
                              }}
                              rows={3}
                              className={`w-full p-2.5 text-sm border rounded-lg resize-none ${
                                isLoaded && selectedRow
                                  ? "bg-white border-slate-300"
                                  : "bg-slate-50 border-slate-200 text-slate-400"
                              }`}
                              placeholder={detailsRequired ? "Required..." : "Optional..."}
                            />
                            {isLoaded && selectedRow && linkedItem!.errors?.findings && (
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                {linkedItem!.errors.findings}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-3">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  disabled={!canRequestCAR}
                                  checked={isLoaded ? !!linkedItem!.requestCAR : false}
                                  onChange={() => isLoaded && onToggleCAR(linkedItem!.questionId)}
                                  className="w-4 h-4"
                                />
                                <span
                                  className={`text-sm font-medium ${
                                    canRequestCAR ? "text-slate-800" : "text-slate-400"
                                  }`}
                                >
                                  Request CAR
                                </span>
                              </label>

                              <textarea
                                value={
                                  isLoaded
                                    ? selectedRow
                                      ? linkedItem!.requestCAR
                                        ? linkedItem!.carReason
                                        : ""
                                      : "Disabled"
                                    : ""
                                }
                                disabled={!isLoaded || !selectedRow || !linkedItem!.requestCAR}
                                onChange={(e) => {
                                  if (!isLoaded) return;
                                  onUpdateField(linkedItem!.questionId, "carReason", e.target.value);
                                }}
                                rows={3}
                                className={`w-full p-2.5 text-sm border rounded-lg resize-none ${
                                  isLoaded && selectedRow && linkedItem!.requestCAR
                                    ? "bg-white border-slate-300"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                }`}
                                placeholder="CAR reason (required if Request CAR)"
                              />

                              {isLoaded && selectedRow && linkedItem!.errors?.carReason && (
                                <p className="text-xs text-red-600 font-medium">
                                  {linkedItem!.errors.carReason}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 text-xs text-slate-500 bg-white">
                Tip: Select questions first. Unselected rows stay disabled.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
