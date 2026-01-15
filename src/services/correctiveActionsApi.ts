import axios from "axios"; // <- change if your axios instance is elsewhere
import { CorrectiveAction } from "../types";

export async function fetchCorrectiveActions(params?: {
  audit_id?: number;
  car_id?: number;
  status?: string;
  search?: string;
}): Promise<CorrectiveAction[]> {
  const res = await axios.get("/car/admin/corrective-actions", { params });
  return res.data.items;
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
