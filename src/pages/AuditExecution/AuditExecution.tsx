import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";

// ---------- TYPES ----------
type Audit = {
  id: number;
  name: string;
  auditee: string;
  sector: string;
  plannedDate: string; // ISO date
  status: "Planned" | "In progress" | "Closed";
};

type ResultType = "OK" | "NOK" | "Improvement";

type CorrectiveActionStatus =
  | "Open"
  | "Waiting evidence"
  | "In review"
  | "Implemented & accepted";

type EvidenceStatus = "Pending review" | "Accepted" | "Rejected";

type Question = {
  id: number;
  code: string;
  chapter: string;
  text: string;
  weight: number;
  maxScore: number;
  mandatory: boolean;
};

type QuestionExecutionState = {
  questionId: number;
  result: ResultType;
  finding: string;
  improvement: string;
  score: number | null;
};

type Evidence = {
  id: number;
  uploadedBy: "Auditee" | "Auditor";
  uploadedAt: string; // ISO datetime
  comment: string;
  fileName?: string;
  status: EvidenceStatus;
  reviewerComment?: string;
};

type CorrectiveAction = {
  id: number;
  auditId: number;
  questionId: number;
  title: string;
  description: string; // what needs to be done
  owner: string;
  dueDate: string; // ISO date
  status: CorrectiveActionStatus;
  evidences: Evidence[];
};

// ---------- FAKE DATA ----------
const FAKE_AUDITS: Audit[] = [
  {
    id: 1,
    name: "Audit – E-Motors Assembly",
    auditee: "GIRARD NATHALIE",
    sector: "E-motors-Assembly",
    plannedDate: "2025-11-25",
    status: "In progress",
  },
  {
    id: 2,
    name: "Audit – Shipping Brushes",
    auditee: "GIRARD NATHALIE",
    sector: "Shipping Brushes",
    plannedDate: "2025-12-02",
    status: "Planned",
  },
];

const FAKE_QUESTIONS: Question[] = [
  {
    id: 101,
    code: "P6.1",
    chapter: "P6 – Process analytics & production",
    text: "Is there a structured follow-up of corrective actions with clear deadlines and owners?",
    weight: 10,
    maxScore: 10,
    mandatory: true,
  },
  {
    id: 102,
    code: "P4.2",
    chapter: "P4 – Launch management",
    text: "Is PSW / customer sign-off available and up to date for critical parts?",
    weight: 8,
    maxScore: 8,
    mandatory: true,
  },
  {
    id: 103,
    code: "P7.3",
    chapter: "P7 – Industrialization & tooling",
    text: "Are tooling changes documented and validated before implementation?",
    weight: 6,
    maxScore: 6,
    mandatory: false,
  },
];

const INITIAL_EXECUTION_STATE: QuestionExecutionState[] = FAKE_QUESTIONS.map(
  (q) => ({
    questionId: q.id,
    result: "OK",
    finding: "",
    improvement: "",
    score: q.maxScore,
  })
);

const INITIAL_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: 1,
    auditId: 1,
    questionId: 101,
    title: "Create plant-level corrective action tracking file",
    description:
      "Define a unique template and implement a weekly review of all open corrective actions.",
    owner: "GIRARD NATHALIE",
    dueDate: "2025-12-15",
    status: "In review",
    evidences: [
      {
        id: 1,
        uploadedBy: "Auditee",
        uploadedAt: "2025-12-05T09:30:00",
        comment:
          "First version of the follow-up file created and filled with open actions.",
        fileName: "CA_followup_v1.xlsx",
        status: "Pending review",
      },
      {
        id: 2,
        uploadedBy: "Auditor",
        uploadedAt: "2025-12-06T14:10:00",
        comment:
          "Requested to add a column with effectiveness check date and result.",
        status: "Rejected",
        reviewerComment: "Template is missing effectiveness check section.",
      },
    ],
  },
];

// ---------- COMPONENT ----------
export default function AuditExecution() {
  const [selectedAuditId, setSelectedAuditId] = useState<number>(
    FAKE_AUDITS[0]?.id ?? 1
  );
  const [executionState, setExecutionState] =
    useState<QuestionExecutionState[]>(INITIAL_EXECUTION_STATE);

  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >(INITIAL_CORRECTIVE_ACTIONS);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const [editingCA, setEditingCA] = useState<CorrectiveAction | null>(null);
  const [newEvidenceComment, setNewEvidenceComment] = useState("");
  const [newEvidenceFileName, setNewEvidenceFileName] = useState("");

  const selectedAudit = useMemo(
    () => FAKE_AUDITS.find((a) => a.id === selectedAuditId) ?? FAKE_AUDITS[0],
    [selectedAuditId]
  );

  const questionsForAudit = FAKE_QUESTIONS; // later: filter by auditId if needed

  const auditOptions = useMemo(
    () =>
      FAKE_AUDITS.map((a) => ({
        value: String(a.id),
        label: `${a.name} – ${a.plannedDate}`,
      })),
    []
  );

  const resultOptions = [
    { value: "OK", label: "OK" },
    { value: "NOK", label: "NOK" },
    { value: "Improvement", label: "Improvement" },
  ];

  const caStatusOptions = [
    { value: "Open", label: "Open" },
    { value: "Waiting evidence", label: "Waiting evidence" },
    { value: "In review", label: "In review" },
    { value: "Implemented & accepted", label: "Implemented & accepted" },
  ];

  const getExecutionForQuestion = (questionId: number) =>
    executionState.find((e) => e.questionId === questionId)!;

  const handleAuditChange = (value: string) => {
    const id = Number(value);
    setSelectedAuditId(id);
  };

  // ---------- OPEN / CLOSE QUESTION POPUP ----------
  const openQuestionModal = (questionId: number) => {
    setActiveQuestionId(questionId);

    const existingCA = correctiveActions.find(
      (ca) => ca.auditId === selectedAuditId && ca.questionId === questionId
    );

    if (existingCA) {
      setEditingCA({ ...existingCA });
    } else {
      const audit = selectedAudit;
      const question = FAKE_QUESTIONS.find((q) => q.id === questionId)!;
      const exec = getExecutionForQuestion(questionId);

      const newCA: CorrectiveAction = {
        id: Date.now(),
        auditId: audit.id,
        questionId: question.id,
        title: `CA for ${question.code} – ${audit.sector}`,
        description: exec.finding || "",
        owner: audit.auditee,
        dueDate: audit.plannedDate,
        status: "Open",
        evidences: [],
      };

      setEditingCA(newCA);
    }

    setNewEvidenceComment("");
    setNewEvidenceFileName("");
    setIsQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setActiveQuestionId(null);
    setEditingCA(null);
    setNewEvidenceComment("");
    setNewEvidenceFileName("");
  };

  // ---------- QUESTION EXECUTION HANDLERS ----------
  const handleResultChange = (questionId: number, value: string) => {
    setExecutionState((prev) =>
      prev.map((row) =>
        row.questionId === questionId
          ? { ...row, result: value as ResultType }
          : row
      )
    );
  };

  const handleScoreChange = (questionId: number, value: string) => {
    const numeric = value === "" ? null : Number(value);
    setExecutionState((prev) =>
      prev.map((row) =>
        row.questionId === questionId ? { ...row, score: numeric } : row
      )
    );
  };

  const handleFindingChange = (questionId: number, value: string) => {
    setExecutionState((prev) =>
      prev.map((row) =>
        row.questionId === questionId ? { ...row, finding: value } : row
      )
    );
  };

  const handleImprovementChange = (questionId: number, value: string) => {
    setExecutionState((prev) =>
      prev.map((row) =>
        row.questionId === questionId ? { ...row, improvement: value } : row
      )
    );
  };

  // ---------- CORRECTIVE ACTION HANDLERS ----------
  const handleCaFieldChange = (
    field: keyof CorrectiveAction,
    value: string
  ) => {
    setEditingCA((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddEvidence = () => {
    if (!editingCA || !newEvidenceComment.trim()) return;

    const newEvidence: Evidence = {
      id: Date.now(),
      uploadedBy: "Auditee",
      uploadedAt: new Date().toISOString(),
      comment: newEvidenceComment.trim(),
      fileName: newEvidenceFileName || undefined,
      status: "Pending review",
    };

    setEditingCA((prev) =>
      prev ? { ...prev, evidences: [...prev.evidences, newEvidence] } : prev
    );

    setNewEvidenceComment("");
    setNewEvidenceFileName("");
  };

  const handleEvidenceStatusChange = (
    evidenceId: number,
    newStatus: EvidenceStatus
  ) => {
    setEditingCA((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        evidences: prev.evidences.map((ev) =>
          ev.id === evidenceId ? { ...ev, status: newStatus } : ev
        ),
      };
    });
  };

  const handleSaveQuestionAndCA = () => {
    if (!editingCA) {
      closeQuestionModal();
      return;
    }

    setCorrectiveActions((prev) => {
      const exists = prev.some((ca) => ca.id === editingCA.id);
      if (exists) {
        return prev.map((ca) => (ca.id === editingCA.id ? editingCA : ca));
      }
      return [...prev, editingCA];
    });

    closeQuestionModal();
  };

  const correctiveActionsForAudit = useMemo(
    () => correctiveActions.filter((ca) => ca.auditId === selectedAuditId),
    [correctiveActions, selectedAuditId]
  );

  const nonConformities = useMemo(
    () => executionState.filter((row) => row.result === "NOK"),
    [executionState]
  );

  const activeQuestion =
    activeQuestionId !== null
      ? FAKE_QUESTIONS.find((q) => q.id === activeQuestionId) || null
      : null;

  const activeExec =
    activeQuestionId !== null
      ? getExecutionForQuestion(activeQuestionId)
      : null;

  return (
    <div className="p-6 space-y-8">
      <PageMeta
        title="Audit Execution"
        description="Execute audits question by question and manage corrective actions."
      />
      <PageBreadcrumb pageTitle="Audit Execution" />

      {/* AUDIT SELECTION */}
      <ComponentCard title="Audit Context">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Audit
            </p>
            <Select
              options={auditOptions}
              defaultValue={String(selectedAuditId)}
              onChange={(value: string) => handleAuditChange(value)}
              className="dark:bg-dark-900"
            />
          </div>

          {selectedAudit && (
            <>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Auditee & Sector
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {selectedAudit.auditee}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sector: {selectedAudit.sector}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Planned Date & Status
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {selectedAudit.plannedDate}
                </p>
                <span
                  className={`inline-flex mt-1 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedAudit.status === "Closed"
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedAudit.status === "In progress"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {selectedAudit.status}
                </span>
              </div>
            </>
          )}
        </div>
      </ComponentCard>

      {/* QUESTION LIST */}
      <ComponentCard title="Questions of the Audit">
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10">
              <TableRow>
                {[
                  "Code",
                  "Chapter",
                  "Question",
                  "Result",
                  "Score",
                  "Mandatory",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    isHeader
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {questionsForAudit.map((q) => {
                const exec = getExecutionForQuestion(q.id);
                return (
                  <TableRow
                    key={q.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">
                      {q.code}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {q.chapter}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">
                      {q.text}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      {exec.result}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      {exec.score !== null
                        ? `${exec.score} / ${q.maxScore}`
                        : `0 / ${q.maxScore}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      {q.mandatory ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openQuestionModal(q.id)}
                        className="text-xs rounded-md border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        Execute in popup
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* CORRECTIVE ACTIONS LIST */}
      <ComponentCard title="Corrective Actions for this Audit">
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10">
              <TableRow>
                {[
                  "Question",
                  "Title",
                  "Owner",
                  "Due date",
                  "Status",
                  "Last evidence",
                ].map((header) => (
                  <TableCell
                    key={header}
                    isHeader
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {correctiveActionsForAudit.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                    No corrective actions defined yet for this audit.
                  </TableCell>
                </TableRow>
              ) : (
                correctiveActionsForAudit.map((ca) => {
                  const question = FAKE_QUESTIONS.find(
                    (q) => q.id === ca.questionId
                  );
                  const lastEvidence =
                    ca.evidences[ca.evidences.length - 1] || null;

                  return (
                    <TableRow
                      key={ca.id}
                      className="hover:bg-gray-50 dark:hover:bg.white/[0.03] transition-colors"
                    >
                      <TableCell className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                        {question
                          ? `${question.code} – ${question.chapter}`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">
                        {ca.title}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {ca.owner}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {ca.dueDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ca.status === "Implemented & accepted"
                              ? "bg-emerald-100 text-emerald-700"
                              : ca.status === "In review"
                              ? "bg-amber-100 text-amber-700"
                              : ca.status === "Waiting evidence"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {ca.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {lastEvidence ? (
                          <>
                            <div className="font-medium">
                              {lastEvidence.status}
                            </div>
                            <div className="text-[11px]">
                              {new Date(
                                lastEvidence.uploadedAt
                              ).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          "No evidence yet"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* SUMMARY OF NOK QUESTIONS */}
      <ComponentCard title="Summary of Nonconformities (Result = NOK)">
        {nonConformities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No questions marked as NOK for this audit yet.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {nonConformities.map((row) => {
              const q = FAKE_QUESTIONS.find(
                (qq) => qq.id === row.questionId
              );
              if (!q) return null;
              return (
                <li
                  key={row.questionId}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-4 py-3"
                >
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {q.code} – {q.text}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    Finding: {row.finding || "—"}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ComponentCard>

      {/* POPUP: QUESTION EXECUTION + CORRECTIVE ACTION */}
      <Modal
        isOpen={isQuestionModalOpen && !!activeQuestion && !!activeExec && !!editingCA}
        onClose={closeQuestionModal}
        className="max-w-[1000px] p-6 lg:p-8"
      >
        {activeQuestion && activeExec && editingCA && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Execute Question – {activeQuestion.code}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Answer the question, record findings, and manage the corrective
                  action and evidences in one place.
                </p>
              </div>
            </div>

            {/* Question info */}
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Chapter
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {activeQuestion.chapter}
              </p>
              <p className="mt-2 text-sm text-gray-800 dark:text-gray-50">
                {activeQuestion.text}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Weight: {activeQuestion.weight} – Max score:{" "}
                {activeQuestion.maxScore} –{" "}
                {activeQuestion.mandatory ? "Mandatory" : "Not mandatory"}
              </p>
            </div>

            {/* Execution fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Result</Label>
                  <Select
                    options={resultOptions}
                    defaultValue={activeExec.result}
                    onChange={(value: string) =>
                      handleResultChange(activeQuestion.id, value)
                    }
                    className="dark:bg-dark-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Score</Label>
                  <Input
                    type="number"
                    min="0"
                    max={String(activeQuestion.maxScore)}
                    value={
                      activeExec.score === null
                        ? ""
                        : String(activeExec.score)
                    }
                    onChange={(e) =>
                      handleScoreChange(activeQuestion.id, e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Max: {activeQuestion.maxScore}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Finding / Comment observed on the shopfloor</Label>
                  <TextArea
                    rows={3}
                    value={activeExec.finding}
                    onChange={(value: string) =>
                      handleFindingChange(activeQuestion.id, value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Improvement idea (if any)</Label>
                  <TextArea
                    rows={2}
                    value={activeExec.improvement}
                    onChange={(value: string) =>
                      handleImprovementChange(activeQuestion.id, value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Corrective action section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Corrective Action for this Question
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    type="text"
                    value={editingCA.title}
                    onChange={(e) =>
                      handleCaFieldChange("title", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Owner (pilot)</Label>
                  <Input
                    type="text"
                    value={editingCA.owner}
                    onChange={(e) =>
                      handleCaFieldChange("owner", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={editingCA.dueDate}
                    onChange={(e) =>
                      handleCaFieldChange("dueDate", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    options={caStatusOptions}
                    defaultValue={editingCA.status}
                    onChange={(value: string) =>
                      handleCaFieldChange(
                        "status",
                        value as CorrectiveActionStatus
                      )
                    }
                    className="dark:bg-dark-900"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Action description</Label>
                  <TextArea
                    rows={3}
                    value={editingCA.description}
                    onChange={(value: string) =>
                      handleCaFieldChange("description", value)
                    }
                  />
                </div>
              </div>

              {/* Evidence history */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                  Evidence history
                </h5>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900">
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10">
                      <TableRow>
                        {[
                          "Uploaded by",
                          "Date",
                          "Comment",
                          "File",
                          "Status",
                          "Actions",
                        ].map((header) => (
                          <TableCell
                            key={header}
                            isHeader
                            className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                      {editingCA.evidences.length === 0 ? (
                        <TableRow>
                          <TableCell className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            No evidence uploaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        editingCA.evidences.map((ev) => (
                          <TableRow key={ev.id}>
                            <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                              {ev.uploadedBy}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                              {new Date(ev.uploadedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                              {ev.comment}
                              {ev.reviewerComment && (
                                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                  Reviewer: {ev.reviewerComment}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs text-blue-600 dark:text-blue-400">
                              {ev.fileName || "—"}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  ev.status === "Accepted"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : ev.status === "Rejected"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {ev.status}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEvidenceStatusChange(
                                      ev.id,
                                      "Accepted"
                                    )
                                  }
                                  className="text-[11px] rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 hover:bg-emerald-100"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEvidenceStatusChange(
                                      ev.id,
                                      "Rejected"
                                    )
                                  }
                                  className="text-[11px] rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100"
                                >
                                  Reject
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Add new evidence */}
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
                  <h5 className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                    Add new evidence (auditee)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Evidence comment</Label>
                      <TextArea
                        rows={2}
                        value={newEvidenceComment}
                        onChange={(value: string) =>
                          setNewEvidenceComment(value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Attach file (optional)</Label>
                      <FileInput className="mt-1" />
                      <Input
                        type="text"
                        placeholder="File name for demo (e.g. CA_proof.pdf)"
                        value={newEvidenceFileName}
                        onChange={(e) =>
                          setNewEvidenceFileName(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      + Add evidence
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeQuestionModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionAndCA}
                  className="rounded-lg bg-gradient-to-r from-[#F68C1F] to-[#EF7807] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
                >
                  Save question & corrective action
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
