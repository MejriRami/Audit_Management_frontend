import axios from "axios"; // your configured axios instance

export type CorrectiveActionDTO = {
  id: number;
  auditId: number;
  auditAnswerId?: number | null;
  finding_type?: string | null;
  corrective_action?: string | null;
  auditee: string;
  pilotUser?: string | null;
  reason_why?: string | null;
  due_date?: string | null;
  status: "Pending" | "Submitted" | "Accepted" | "Rejected" | "Completed";
  escalated: boolean;
};

export async function fetchCorrectiveActions(params?: {
  audit_id?: number;
  car_id?: number;
  status?: string;
  search?: string;
}) {
  const res = await axios.get("/car/admin/corrective-actions", { params });
  return res.data.items as CorrectiveActionDTO[];
}

export async function reviewCorrectiveAction(
  carId: number,
  decision: "ACCEPT" | "REJECT",
  comment?: string
) {
  const res = await axios.post(`/car/admin/${carId}/review`, {
    decision,
    comment: comment ?? null,
  });
  return res.data;
}
