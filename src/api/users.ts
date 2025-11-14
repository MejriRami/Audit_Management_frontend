import axios from "axios";
import { Auditor } from "../types";

// Fetch all auditors
export const getAuditors = async (): Promise<Auditor[]> => {
  try {
    const res = await axios.get("/api/users/auditors"); // backend endpoint
    return res.data;
  } catch (err) {
    console.error("Error fetching auditors:", err);
    return [];
  }
};
