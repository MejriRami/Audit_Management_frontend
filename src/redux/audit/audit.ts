
import { Audit, AuditPlanCreate, AuditRescheduleHistory } from "./audit-types";
import axiosInstance from "../../services/axiosInstance";

// Create audit (plan)
export const apiPlanAudit = async (payload: AuditPlanCreate): Promise<Audit> => {
  let url ='/audits/plan';

  try {
    const response = await axiosInstance.post(url, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to plan audit:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch all audits
export const apiGetAudits = async (): Promise<Audit[]> => {
    let url='/audits';
  try {
    const res = await axiosInstance.get(url);
    if (res.status != 200) throw new Error("Failed to fetch audits");
    const data = await res.data?.audits;
    return data
    // return data.audits; 
  } catch (err) {
    console.error("Error fetching audits:", err);
    throw err;
  }
};

// Fetch audit reschedule history
export const apiGetAuditHistory = async (
  auditId: number
): Promise<AuditRescheduleHistory[]> => {
  let url=`/audits/${auditId}/history`
  try {
    const res = await axiosInstance.get(url);
    if (res.status!=200) throw new Error("Failed to fetch audit history");
    const data = await res?.data;

    return Array.isArray(data) ? data : data?.history ?? [];
  } catch (err) {
    console.error("Error fetching audit history:", err);
    return [];
  }
};
