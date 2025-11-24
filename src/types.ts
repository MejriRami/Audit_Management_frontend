 
// -------------------- Users & Participants --------------------
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Participant {
  user: User;
  local_role: "auditor" | "auditee";
}
export type CorrectiveActionStatus =
  | "Pending"
  | "Submitted"
  | "Accepted"
  | "Rejected"
  | "Completed";
// -------------------- Questions & Findings --------------------
export interface QuestionResponse {
  id: number;
  description: string;
  criticality?: string;
  response?: string;
}

export interface Finding {
  question_id: number;
  finding_type: string;
  corrective_action?: string;
  corrective_action_status?: CorrectiveActionStatus
}

// -------------------- Audit --------------------
export interface Audit {
  id: number;
  framework?: string;
  entity?: string;
  status?: string;
  finalScore?: number;
  participants?: Participant[];
  sessions?: { start_time: string; end_time: string }[];
  questions_and_responses?: QuestionResponse[];
  findings?: Finding[];
}

// -------------------- Corrective Actions Table --------------------
export interface CorrectiveAction {
  reject_reason: string;
  description: string;
  id: number;
  auditId: number;
  auditAnswerId: number;
  auditee: string;
  pilotUser: string;
  auditFramework: string;
  finding_type: string;
  corrective_action?: string;
  reason_why?: string;
  due_date?: string; // ISO date string
  status: CorrectiveActionStatus;
  escalated: boolean;
}


export interface ScheduleHistoryEntry {
  id: number;
  old_start: string;
  old_end: string;
  new_start: string;
  new_end: string;
  reason?: string;
  changed_at: string;
  changed_by: { id: number; name: string };
}
// export interface Audit {
//   weak_points: string;
//   strong_points: string;
//   id: number;
//    entity:string;
//   framework?: string; // from questionnaire_version
//   status: "planned" | "postponed" | "confirmed" |"cancelled" ;
//   finalScoreType: "color" | "yes_no" | "scale";
//   finalScore: string;
//   participants: AuditParticipant[];
//   sessions?: { start_time: string; end_time: string }[];
//   findings?: {
//     question_id: any;
//     finding_type: string;  // Change to match the backend field
//     corrective_action: string;  // Change to match the backend field
//     corrective_action_status: string; // Change to match the backend field
//   }[];
//   questions_and_responses?: QuestionAndResponse[]; 
//   questionnaire:string;
//    // New fields for scheduling
//   start?: string;
//   end?: string;
//   scheduleHistory?: ScheduleHistoryEntry[];
//   total_score?: number;
// }

export interface Entity {
  id: number;
  type: string;       // maps from EntityType enum
  code: string;
  label: string;
  parent_id: number | null;
  parent?: {
    id: number;
    label: string;
    code: string;
  } | null;
}

export interface Framework {
  id: number;
  label: string;
  code: string;
}
interface email{
  email:string;
}

export interface Questionnaire {
  id: number;
  questionnaire_id: number;
  version_no: number;
  status: string;
  target_duration: string;
  score_calculation?: string;
  guideline_file?: string;
  type: string;
  framework: string;
  name: string;
  auditors: email[];
  questions:Question[];
}


export interface Auditor {
  id: number;
  name: string;
  email: string;
}

export interface QuestionnaireVersionUpdate {
  name?: string;
  framework?: string;
  type?: string;
  version_no?: number;
  status?: string;
  target_duration?: string;  // send as "HH:MM:SS"
  guideline_file?: string;
  auditor_emails?: string[];
  score_calculation?: string;
}

export interface Question {
  id: number;
  description: string;
  status: string;
  chapter: string;
  qNumber: number;
  weight: number;
  value?: number;
  fail?: number;
  improve?: number;
  pass?: number;
  criticalSuccess?: number;
  score?: number;
  type?: string;
}


export interface ScheduleHistory {
  id: string;
  oldDate: string;
  newDate: string;
  changedAt: string;
}

 