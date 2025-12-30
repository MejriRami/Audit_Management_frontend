 
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

// -------------------- Questionnaire --------------------
export interface Questionnaire {
  id: number;
  name: string;
  type: string;
}

// -------------------- Document --------------------
export interface Document {
  id: number;
  filename?: string;
  file_url: string;
  mimetype?: string;
  size?: number;
  uploaded_at?: string;
}

// -------------------- Question Response --------------------
export interface QuestionResponse {
  id: number;
  description: string;
  chapter?: string;
  criticality: string; // "Critical" | "High" | "Medium" | "Low" | "N/A"
  value?: number;
  response?: string;
}

// -------------------- Finding --------------------
export interface Finding {
  question_id: number;
  finding_type: string; // "Non-Conformity" | "Opportunity for Improvement" | "Conformity" | "Not Evaluated"
  finding_text?: string;
  corrective_action?: string;
  corrective_action_status?: string; // "pending" | "in_progress" | "submitted" | "accepted" | "rejected" | "completed"
  corrective_action_type?: string; // "Escalated" | "Overdue" | "Pending Review" | "In Progress" | "Awaiting Approval" | "Approved" | "Rejected" | "Completed" | "Standard"
}


// -------------------- Audit --------------------
export interface Audit {
  id: number;
  audit_number: string;
  status: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  plant?: string;
  sector?: string;
  total_score?: number; // Changed from finalScore
  weak_points?: string;
  strong_points?: string;
  event_created: boolean;
  finalScore?: number;
  // Relationships
  auditor?: User;
  questionnaire?: Questionnaire;
  auditees: string[]; // Array of email strings
  
  // Audit content
  questions_and_responses: QuestionResponse[];
  findings: Finding[];
}

// -------------------- Questionnaire --------------------
export interface Questionnaire {
  id: number;
  name: string;
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
  id?: number;
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


export interface NotificationItem {  
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: {
    car_id?: number;
    audit_id?: number;
    audit_number?: string;
    submitted_by?: string;
    submitted_at?: string;
    plant?: string;
    sector?: string;
  };
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export type NotificationEventType = 
  | 'connected' 
  | 'notification' 
  | 'error' 
  | 'keepalive';

export interface SSEEvent {
  event: NotificationEventType;
  data: any;
  id?: number;
  timestamp: string;
}