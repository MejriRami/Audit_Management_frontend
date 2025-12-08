import axios from "axios";
import { Audit, AuditRescheduleHistory } from "../types";

// ----------------- Types -----------------

export interface AuditPlanCreate {
  auditee_emails: string[] ;
  auditor_id: number;
  plant: string;
  sector: string;
  hardware_email?:string;
  questionnaire_id: number;
  audit_date: string; // ISO date: "YYYY-MM-DD"
  start_time: string; // "HH:mm:ss"
  end_time: string;   // "HH:mm:ss"
}

export interface AuditResponse {
  id: number;
  status: string;
  planned_start_date: string; // ISO datetime
  planned_end_date: string;   // ISO datetime
  event_created:boolean;
  audit_number:string;
}

// ----------------- API Call -----------------

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const planAudit = async (payload: AuditPlanCreate): Promise<AuditResponse> => {
  try {
    const response = await axios.post<AuditResponse>(`${API_BASE}/audits/plan`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to plan audit:", error.response?.data || error.message);
    throw error;
  }
};
// Fetch all audits
export const getAudits = async (): Promise<Audit[]> => {
  try {
    const res = await fetch(`${API_BASE}/audits`);

    if (!res.ok) throw new Error("Failed to fetch audits");

    const data = await res.json();
    return data.audits; // because backend returns { audits: [...] }
  } catch (err) {
    console.error("Error fetching audits:", err);
    throw err;
  }
};

// ----------------- New: Fetch Audit Reschedule History -----------------
export const getAuditHistory = async (auditId: number): Promise<AuditRescheduleHistory[]> => {
  try {
    const res = await fetch(`${API_BASE}/audits/${auditId}/history`);
    if (!res.ok) throw new Error("Failed to fetch audit history");
    const data = await res.json();

    // Ensure we always return an array
    return Array.isArray(data) ? data : data?.history ?? [];
  } catch (err) {
    console.error("Error fetching audit history:", err);
    return [];
  }
};
