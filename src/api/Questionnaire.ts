import { Questionnaire, QuestionnaireUpdate } from "../types";
const API_BASE = "http://localhost:8000/questionnaire";

// Fetch all questionnaires
export const getAllQuestionnaire = async (): Promise<
  Questionnaire[]
> => {
  const res = await fetch("api/questionnaire/getAll");
  if (!res.ok) throw new Error("Failed to fetch frameworks");
  return res.json();
};

import axios from "axios";
// Add a new questionnaire
export const AddQuestionnaire = async (
  data: Omit<Questionnaire, "id">
): Promise<Questionnaire> => {
  const res = await axios.post("api/questionnaire/add", data);
  return res.data;
};

// delete a questionnaire
export const deleteQuestionnaire = async (id: number): Promise<void> => {
  const res = await fetch(`api/questionnaire/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete questionnaire");
};

// Update a questionnaire TODO
export const updateQuestionnaire = async (
  questionnaire_id: number,
  data: Partial<QuestionnaireUpdate>
): Promise<Questionnaire> => {
  const res = await fetch(`${API_BASE}/${questionnaire_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update questionnaire: ${errText}`);
  }

  return res.json();
};
