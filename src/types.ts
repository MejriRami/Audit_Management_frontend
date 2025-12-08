 
// -------------------- Users & Participants --------------------
export interface User {
  id: number;
  first_name: string;
  last_name:string;
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
  audit_number: string;
  event_created: boolean;
  id: number;
  questionnaire?: {  name: string};
  plant?: string;
  sector?:string;
  status?: string;
  finalScore?: number;
  auditor?: User;
  auditees?:string[];
  sessions?: { start_time: string; end_time: string }[];
  questions_and_responses?: QuestionResponse[];
  findings?: Finding[];
  planned_start_date?:string;
  planned_end_date?:string;
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

export interface QuestionnaireList {
  id: number;
  name: string;
}
export interface Questionnaire {
  id: number;
  name: string;
  version: number;
  status: string;
  target_duration: string; // "HH:MM:SS"
  score_calculation?: string;
  guideline_file?: string;
  type: string; // audit type value
  framework_id?: string; // dropdown value
  framework?: {id:string,label:string}; // display code
  auditors?: Auditor[];
  questions: Question[];
}

export interface QuestionnaireUpdate {
  id: number;
  name?: string;
  framework_id?: number; // number
  type?: string;
  status?: string;
  target_duration?: string; // "HH:MM:SS"
  guideline_file?: string;
  auditors_emails?: Auditor[];
  score_calculation?: string;
  version?: number;
}

export interface Auditor {
  email: string;
}



export interface Question {
  id: number;
  description: string;
  chapter: string;
  weight: number;
  critical_value?: number;
}


 export interface AuditRescheduleHistory {
  id: number;
  action_type: string;
  old_date: string | null;
  new_date: string | null;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}
