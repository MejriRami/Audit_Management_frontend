import { Dispatch } from "@reduxjs/toolkit";
import { Finding, QuestionResponse } from "../../types";

// redux/audit/audit-types.ts
export interface Audit {
  audit_number: string;
  event_created: boolean;
  id: number;
  questionnaire?: { id:number,name: string ,type?:string};
  plant?: string;
  sector?: string;
  status?: string;
  finalScore?: number;
  auditor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  auditees?: string[];
  sessions?: { start_time: string; end_time: string }[];
  questions_and_responses?: QuestionResponse[];
  findings?: Finding[];
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  total_score?: number; 
  weak_points?: string;
  strong_points?: string;

  report_exists: boolean;
}

export interface AuditPlanCreate {
  auditee_emails: string[];
  auditor_id: number;
  plant: string;
  sector: string;
  hardware_email?: string;
  questionnaire_id: number;
  audit_date: string;  // "YYYY-MM-DD"
  start_time: string;  // "HH:mm:ss"
  end_time: string;    // "HH:mm:ss"
  supervisor_email: string; // ✅ ADD THIS

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

export type PlanAudit = (
  data: AuditPlanCreate,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export  interface AuditRescheduleRequest{
  new_start_date:string;
  new_end_date:string;
  reason:string;
  email:string;
}
export type AuditByAuditor = (
  dispatch: Dispatch<any>,
  auditor_id: number,
  target: string,
  page?: number,
  per_page?: number,
) => Promise<boolean>;

export interface AuditQuestion {
  id: number;
  description: string;
  critical_value: number;
}


export interface AuditeeMini {
  id: number;
  email?: string | null;
}

export interface PickableAudit {
  id: number;
  audit_number: string;
  planned_date: string;         
  planned_start_time: string;   
  planned_end_time: string;     
  status: string;
  auditees: AuditeeMini[];
  questionnaire_name:string;
}
export interface DocumentCreate {
  filename: string;
  mimetype: string;
  size: number;
  file_url: string;
}

export interface AuditAnswerCreate {
  question_id: number;
  value: number; // -1 allowed
  finding_text?: string | null;
  documents: DocumentCreate[];
  car_reason?: string | null;
  request_car: boolean;
  critical_value:number;
}

export interface ExecuteAuditRequest {
  answers: AuditAnswerCreate[];
  audit_date: string;          
  start_time: string;          
  end_time: string;             
  strong_points: string;       
  weak_points: string;         
}

export interface ExecuteAuditResponse {
  message: string;
  audit_id: number;
  status: string;
  answers_created: number;
  cars_created: number;
}


export type UploadResponse = {
  filename: string;
  mimetype: string;
  size: number;
  file_url: string;
};