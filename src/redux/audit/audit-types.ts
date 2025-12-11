import { Dispatch } from "@reduxjs/toolkit";
import { Finding, QuestionResponse } from "../../types";

// redux/audit/audit-types.ts
export interface Audit {
  audit_number: string;
  event_created: boolean;
  id: number;
  questionnaire?: { name: string };
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

export type AuditByAuditor = (
  auditor_id: number,
  dispatch: Dispatch<any>
) => Promise<boolean>;

