
import { Audit, AuditByAuditor, AuditPlanCreate, AuditRescheduleHistory, AuditRescheduleRequest, ExecuteAuditRequest, ExecuteAuditResponse, PickableAudit, UploadResponse } from "./audit-types";
import axiosInstance from "../../services/axiosInstance";
import { getAuditorsByAuditorFailure, getAuditorsByAuditorRequest, getAuditorsByAuditorSuccess } from "./audit-slice";

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

// reschedule audit 
export const apiRescheduleAudit= async(  auditId: number,payload:AuditRescheduleRequest):Promise<Audit>=>{
  let url=`/audits/${auditId}/reschedule`
  try{
    const response= await axiosInstance.patch(url,payload);
    return response.data;
  }
  catch(error:any){
     console.error("Failed to reschedule audit:", error.response?.data || error.message);
    throw error;
  }
}
// Fetch all audits
export const apiGetAudits = async (): Promise<Audit[]> => {
    let url='/audits/all';
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

//get audits by auditor id
export const getAuditsByAuditor: AuditByAuditor = async (
  dispatch,
  auditor_id: number,
  target: string,
  page?: number,
  per_page?: number
  ) => {
  dispatch(getAuditorsByAuditorRequest());
  let url=`/audits/auditor/${auditor_id}`

  if(page && per_page){
    url+=`?page=${page}&per_page=${per_page}`;
  }

  try {
    let response = await axiosInstance.get(url);
    dispatch(getAuditorsByAuditorSuccess({data: response.data, target}));
    return true;
  } catch (error: any) {
    const { data } = error.response;
    dispatch(getAuditorsByAuditorFailure(data));
  }

  return false;
};

// Get Audit questions by auditID
export const apiGetAuditQuestions = async (auditId: number) => {
  const res = await axiosInstance.get(`/audits/${auditId}/questions`);
  return res.data;
};

export const apiGetPickableAuditsByAuditor = async (
  auditorId: number
): Promise<PickableAudit[]> => {
  const res = await axiosInstance.get(`/audits/auditor/${auditorId}/pickable-audits`);
  return res.data;
};

export const apiExecuteAudit = async (
  auditId: number,
  payload: ExecuteAuditRequest
): Promise<ExecuteAuditResponse> => {
  const res = await axiosInstance.post(`/audits/${auditId}/execute`, payload);
  return res.data;
};


export async function apiUploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await axiosInstance.post("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}