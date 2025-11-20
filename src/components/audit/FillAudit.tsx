import React, { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";

interface PlannedAudit {
  id: number;
  name: string;
  questions: string[];
}

interface AuditItemErrors {
  findings?: string;
  // because?: string;
  carReason?: string;
}

interface AuditItem {
  id: number;
  question: string;
  value: string; // Valid | Not Valid | Needs Improvement
  findings: string;
  // because: string;
  evidence: File[];
  carReason: string;
  errors: AuditItemErrors;
}

export default function AuditChecklist() {
  // --- Demo data (replace with API calls) ---
  const auditors = [
    // { id: 1, name: "John Smith" },
    { id: 2, name: "Nour Sellami" },
    { id: 3, name: "Chiraz Ben Abbess" },
  ];

  const plannedAudits: PlannedAudit[] = [
    {
      id: 1,
      name: "Planned Audit - Q1",
      questions: [
        "Is documentation up to date?",
        "Are safety procedures followed?",
        "Is equipment calibration maintained?",
      ],
    },
    {
      id: 2,
      name: "Planned Audit - Supplier Review",
      questions: [
        "Are suppliers evaluated annually?",
        "Is purchasing process validated?",
      ],
    },
    {
      id: 3,
      name: "Planned Audit - Safety",
      questions: [
        "Is PPE used correctly?",
        "Are incidents documented?",
        "Are emergency exits accessible?",
      ],
    },
  ];

  // --- State ---
  const [selectedAuditor, setSelectedAuditor] = useState<number | null>(null);
  const [selectedPlannedAuditId, setSelectedPlannedAuditId] = useState<
    number | ""
  >("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [autoSaveEnabled] = useState(false); // placeholder for autosave

  // --- Helpers ---
  const needsDetails = (value: string) =>
    value === "Not Valid" || value === "Needs Improvement";

  const loadQuestionsForAudit = (auditId: number) => {
    const audit = plannedAudits.find((a) => a.id === auditId);
    if (!audit) return;

    const loaded = audit.questions.map((q, idx) => ({
      id: idx + 1,
      question: q,
      value: "",
      findings: "",
      // because: "",
      evidence: [] as File[],
      carReason: "",
      errors: {},
    }));

    setItems(loaded);
  };

  const updateItemField = <K extends keyof AuditItem>(
    id: number,
    field: K,
    value: AuditItem[K]
  ) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              [field]: value,
              errors: { ...it.errors, [field as string]: undefined },
            }
          : it
      )
    );
  };

  const addEvidence = (id: number, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, evidence: [...it.evidence, ...newFiles] } : it
      )
    );
  };

  const removeEvidence = (id: number, index: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, evidence: it.evidence.filter((_, i) => i !== index) }
          : it
      )
    );
  };

  const validateItemForCAR = (item: AuditItem) => {
    const errors: AuditItemErrors = {};
    if (needsDetails(item.value)) {
      if (!item.findings.trim()) errors.findings = "Findings are required.";
      // if (!item.because.trim()) errors.because = "Because is required.";
      if (!item.carReason.trim()) errors.carReason = "CAR reason is required.";
    }
    return errors;
  };

  const handleRequestCAR = (id: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const errors = validateItemForCAR(it);
        if (Object.keys(errors).length > 0) {
          return { ...it, errors };
        }

        // Placeholder: send CAR to backend
        console.log("CAR requested for item:", it);
        return { ...it, errors: {} };
      })
    );
  };

  const validateBeforeSubmit = () => {
    if (!selectedPlannedAuditId) return false;
    for (const it of items) {
      if (!it.value) return false;
      if (needsDetails(it.value)) {
        // if (!it.findings.trim() || !it.because.trim() || !it.carReason.trim())
        if (!it.findings.trim() || !it.carReason.trim()) return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // final validation
    const validated = items.map((it) => ({
      ...it,
      errors: validateItemForCAR(it),
    }));
    setItems(validated);

    const hasErrors = validated.some((it) => Object.keys(it.errors).length > 0);
    if (hasErrors) return;

    // Placeholder: submit to backend
    console.log("Submitting audit", {
      plannedAuditId: selectedPlannedAuditId,
      items: validated,
    });
  };

  // Optional: autosave placeholder
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const t = setTimeout(() => {
      // autosave to localStorage or backend
      console.log("Autosave placeholder", { selectedPlannedAuditId, items });
    }, 1500);
    return () => clearTimeout(t);
  }, [selectedPlannedAuditId, items, autoSaveEnabled]);

  // --- Render ---
  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-8">
      {" "}
      {/* bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50  dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <h2 className="text-3xl font-bold text-gray-800">Audit Process</h2>
      {/* Auditor Selection */}
      <div className="space-y-2 ">
        <label className="font-medium text-gray-700">Select Auditor</label>
        <select
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
          value={selectedAuditor || ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedAuditor(id);
            // setSelectedPlannedAudit(null);
            setItems([]);
          }}
        >
          <option value="">Select Auditor</option>
          {auditors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      {/* Planned audit selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 ">
          Select Planned Audit
        </label>
        <select
          className="mt-1 block w-full p-3 rounded-xl border bg-white"
          value={selectedPlannedAuditId}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value);
            setSelectedPlannedAuditId(val);
            if (val !== "") loadQuestionsForAudit(Number(val));
            else setItems([]);
          }}
        >
          <option value="">-- choose --</option>
          {plannedAudits
            .filter((a) => !selectedAuditor || a.id % 3 === selectedAuditor % 3) // demo filter logic
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      {/* questions */}
      {items.length === 0 && selectedPlannedAuditId !== "" && (
        <p className="text-sm text-gray-500">
          No questions available for this planned audit.
        </p>
      )}
      {items.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl bg-gray-100  ">
              {/* if we cant to add color to background*/}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{item.question}</p>
                  <p className="text-sm text-gray-500">Question #{item.id}</p>
                </div>
              </div>
              {/* value */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Value *
                </label>
                <select
                  className={`mt-1 block w-full p-3 rounded-xl border ${
                    item.errors.findings ||
                    // item.errors.because ||
                    item.errors.carReason
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                  value={item.value}
                  onChange={(e) =>
                    updateItemField(item.id, "value", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Valid">Valid</option>
                  <option value="Not Valid">Not Valid</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Not applicable">Not applicable</option>
                </select>
              </div>
              {/* findings & because (required only if needsDetails) */}
              {needsDetails(item.value) ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Findings *
                    </label>
                    <textarea
                      className={`mt-1 block w-full p-3 rounded-xl border ${
                        item.errors.findings
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      value={item.findings}
                      onChange={(e) =>
                        updateItemField(item.id, "findings", e.target.value)
                      }
                      rows={3}
                      placeholder="Describe the findings"
                    />
                    {item.errors.findings && (
                      <p className="text-sm text-red-600">
                        {item.errors.findings}
                      </p>
                    )}
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Because *
                    </label>
                    <textarea
                      className={`mt-1 block w-full p-3 rounded-xl border ${
                        item.errors.because
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      value={item.because}
                      onChange={(e) =>
                        updateItemField(item.id, "because", e.target.value)
                      }
                      rows={2}
                      placeholder="Explain why (short reason)"
                    />
                    {item.errors.because && (
                      <p className="text-sm text-red-600">
                        {item.errors.because}
                      </p>
                    )}
                  </div> */}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Findings (optional)
                  </label>
                  <textarea
                    className="mt-1 block w-full p-3 rounded-xl border border-gray-200"
                    value={item.findings}
                    onChange={(e) =>
                      updateItemField(item.id, "findings", e.target.value)
                    }
                    rows={2}
                    placeholder="Optional findings"
                  />
                </div>
              )}
              {/* Evidence (multiple images) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Evidence (images, multiple)
                </label>
                <label className="mt-2 inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer bg-white">
                  <Upload size={16} />
                  <span className="text-sm">Upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addEvidence(item.id, e.target.files)}
                  />
                </label>

                {item.evidence.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {item.evidence.map((f, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="h-24 w-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeEvidence(item.id, idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100"
                          aria-label="Remove evidence"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* CAR reason + request button (only show when needsDetails) */}
              {needsDetails(item.value) && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CAR Reason *
                    </label>
                    <textarea
                      className={`mt-1 block w-full p-3 rounded-xl border ${
                        item.errors.carReason
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      value={item.carReason}
                      onChange={(e) =>
                        updateItemField(item.id, "carReason", e.target.value)
                      }
                      rows={2}
                      placeholder="Reason for corrective action"
                    />
                    {item.errors.carReason && (
                      <p className="text-sm text-red-600">
                        {item.errors.carReason}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleRequestCAR(item.id)}
                      className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Request CAR
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // quick helper: clear CAR fields and errors
                        updateItemField(item.id, "carReason", "");
                        // updateItemField(item.id, "because", "");
                        updateItemField(item.id, "findings", "");
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div>
            <button
              type="submit"
              disabled={!validateBeforeSubmit()}
              className={`w-full py-3 rounded-xl text-white ${
                validateBeforeSubmit()
                  ? "bg-blue-300 hover:bg-gradient-to-b from-[#0584CE] to-[#046EAF] dark:from-[#035C91] dark:to-[#023C64]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Submit Audit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
