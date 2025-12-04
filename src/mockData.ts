import { Audit, CorrectiveAction } from "./types";

// -------------------- Mock Audits --------------------
export const mockAudits: Audit[] = [
  {
    id: 1,
    framework: "ISO",
    plant: "MAIN SITE",
    sector:"process",
    status: "confirmed",
    finalScore: 85,
    participants: [
      { user: { id: 1, name: "Alice Smith", email: "alice@example.com" }, local_role: "auditor" },
      { user: { id: 2, name: "Bob Johnson", email: "bob@example.com" }, local_role: "auditee" },
    ],
    sessions: [{ start_time: "2025-11-20T10:00", end_time: "2025-11-20T12:00" }],
    questions_and_responses: [
      { id: 101, description: "Is documentation compliant?", criticality: "High", response: "No" },
      { id: 102, description: "Are safety measures applied?", criticality: "Medium", response: "Yes" },
    ],
    findings: [
      { question_id: 101, finding_type: "Non-conformity", corrective_action: "Update documentation", corrective_action_status: "Completed" },
      { question_id: 102, finding_type: "Improvement", corrective_action: "Check signage", corrective_action_status: "Submitted" },
      { question_id: 103, finding_type: "Improvement", corrective_action: "Train staff on procedures", corrective_action_status: "Pending" },
    ],
  },
  {
    id: 2,
    framework: "IATF",
    plant: "SUPPLIER A",
        sector:"glasses",

    status: "planned",
    finalScore: 90,
    participants: [
      { user: { id: 3, name: "Charlie Davis", email: "charlie@example.com" }, local_role: "auditor" },
      { user: { id: 4, name: "Dana White", email: "dana@example.com" }, local_role: "auditee" },
    ],
    sessions: [{ start_time: "2025-11-21T09:00", end_time: "2025-11-21T11:00" }],
    questions_and_responses: [
      { id: 201, description: "Are process controls monitored?", criticality: "High", response: "Yes" },
    ],
    findings: [
      { question_id: 201, finding_type: "Non-conformity", corrective_action: "Implement process checklist", corrective_action_status: "Completed" },
      { question_id: 202, finding_type: "Non-conformity", corrective_action: "Verify supplier approvals", corrective_action_status: "Pending" },
      { question_id: 203, finding_type: "Improvement", corrective_action: "Update internal audit schedule", corrective_action_status: "Submitted" },
    ],
  },
  {
    id: 3,
    framework: "ISO",
    plant: "BRANCH OFFICE",
        sector:"x",

    status: "postponed",
    finalScore: 78,
    participants: [
      { user: { id: 5, name: "Eve Thompson", email: "eve@example.com" }, local_role: "auditor" },
      { user: { id: 6, name: "Frank Lee", email: "frank@example.com" }, local_role: "auditee" },
    ],
    sessions: [{ start_time: "2025-11-22T14:00", end_time: "2025-11-22T16:00" }],
    questions_and_responses: [
      { id: 301, description: "Are emergency exits clear?", criticality: "High", response: "No" },
    ],
    findings: [
      { question_id: 301, finding_type: "Non-conformity", corrective_action: "Mark exits clearly", corrective_action_status: "Pending" },
      { question_id: 302, finding_type: "Non-conformity", corrective_action: "Conduct fire drill", corrective_action_status: "Submitted" },
      { question_id: 303, finding_type: "Improvement", corrective_action: "Update floor plan maps", corrective_action_status: "Completed" },
    ],
  },
];

// -------------------- Mock Corrective Actions --------------------
export const mockCorrectiveActions: CorrectiveAction[] = mockAudits.flatMap(
  (audit) =>
    audit.findings?.map((f, idx) => ({
      id: idx + 1 + audit.id * 10, // unique id
      auditId: audit.id,
      auditAnswerId: f.question_id,
      auditee: audit.participants?.find((p) => p.local_role === "auditee")?.user.email || 0,
      pilotUser: audit.participants?.find((p) => p.local_role === "auditor")?.user.email|| 0,
      auditFramework: audit.framework || "N/A",
      finding_type: f.finding_type,
      corrective_action: f.corrective_action,
      reason_why: "Required to improve compliance",
      due_date: new Date().toISOString().split("T")[0],
      status: f.corrective_action_status || "Pending",
      escalated: f.corrective_action_status === "Pending",
    })) || []
);
