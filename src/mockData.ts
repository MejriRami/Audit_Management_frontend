import { Audit, CorrectiveAction } from "./types";

// -------------------- Mock Audits --------------------
export const mockAudits: Audit[] = [
  {
    id: 1,
    audit_number: "AUD-0001",
    event_created: true,
    questionnaire: { name: "ISO",type:"internal" },
    plant: "MAIN SITE",
    sector: "process",
    status: "confirmed",
    finalScore: 85,
    questions_and_responses: [
      { id: 101, description: "Is documentation compliant?", criticality: "High", response: "No" },
      { id: 102, description: "Are safety measures applied?", criticality: "Medium", response: "Yes" },
    ],
    findings: [
      {
        question_id: 101,
        finding_type: "Non-conformity",
        corrective_action: "Update documentation",
        corrective_action_status: "Completed",
      },
      {
        question_id: 102,
        finding_type: "Improvement",
        corrective_action: "Check signage",
        corrective_action_status: "Submitted",
      },
      {
        question_id: 103,
        finding_type: "Improvement",
        corrective_action: "Train staff on procedures",
        corrective_action_status: "Pending",
      },
    ],

    // Optional fields in your type.tsx (kept empty or omitted if not used):
    // strong_points: "",
    // weak_points: "",
    // auditor: undefined,
    auditees: ["bob@example.com"],
    planned_start_date: "2025-11-20",
    planned_end_date: "2025-11-20",
  },
  {
    id: 2,
    audit_number: "AUD-0002",
    event_created: false,
    questionnaire: { name: "IATF",type:"external" },
    plant: "SUPPLIER A",
    sector: "glasses",
    status: "planned",
    finalScore: 90,
    questions_and_responses: [
      { id: 201, description: "Are process controls monitored?", criticality: "High", response: "Yes" },
    ],
    findings: [
      {
        question_id: 201,
        finding_type: "Non-conformity",
        corrective_action: "Implement process checklist",
        corrective_action_status: "Completed",
      },
      {
        question_id: 202,
        finding_type: "Non-conformity",
        corrective_action: "Verify supplier approvals",
        corrective_action_status: "Pending",
      },
      {
        question_id: 203,
        finding_type: "Improvement",
        corrective_action: "Update internal audit schedule",
        corrective_action_status: "Submitted",
      },
    ],
    auditees: ["dana@example.com"],
    planned_start_date: "2025-11-21",
    planned_end_date: "2025-11-21",
  },
  {
    id: 3,
    audit_number: "AUD-0003",
    event_created: false,
    questionnaire: { name: "ISO", type: "internal" },
    plant: "BRANCH OFFICE",
    sector: "x",
    status: "postponed",
    finalScore: 78,
    questions_and_responses: [
      { id: 301, description: "Are emergency exits clear?", criticality: "High", response: "No" },
    ],
    findings: [
      {
        question_id: 301,
        finding_type: "Non-conformity",
        corrective_action: "Mark exits clearly",
        corrective_action_status: "Pending",
      },
      {
        question_id: 302,
        finding_type: "Non-conformity",
        corrective_action: "Conduct fire drill",
        corrective_action_status: "Submitted",
      },
      {
        question_id: 303,
        finding_type: "Improvement",
        corrective_action: "Update floor plan maps",
        corrective_action_status: "Completed",
      },
    ],
    auditees: ["frank@example.com"],
    planned_start_date: "2025-11-22",
    planned_end_date: "2025-11-22",
  },
];

// -------------------- Mock Corrective Actions --------------------
export const mockCorrectiveActions: CorrectiveAction[] = mockAudits.flatMap((audit) => {
  const auditeeEmail = audit.auditees?.[0] ?? "";
  const pilotEmail = audit.auditor?.email ?? ""; // you don't provide auditor in mocks, so empty string

  return (
    audit.findings?.map((f, idx) => ({
      id: audit.id * 100 + idx + 1,
      auditId: audit.id,
      auditAnswerId: f.question_id,

      // REQUIRED by your CorrectiveAction type:
      description: `${f.finding_type} on question ${f.question_id}`,
      reject_reason: "",

      auditee: auditeeEmail,
      pilotUser: pilotEmail,

      auditFramework: audit.questionnaire?.name ?? "N/A",
      finding_type: f.finding_type,

      corrective_action: f.corrective_action ?? "",
      reason_why: "Required to improve compliance",
      due_date: new Date().toISOString().split("T")[0],

      status: (f.corrective_action_status ?? "Pending") as any, // if your CorrectiveActionStatus is a union, remove `as any`
      escalated: (f.corrective_action_status ?? "Pending") === "Pending",
    })) ?? []
  );
});
