import { Framework } from "../types";

const API_BASE = "http://localhost:8000/questionnaire";

// Fetch all frameworks
export const getFrameworks = async (): Promise<Framework[]> => {
  const res = await fetch(`${API_BASE}/getAll`);
  if (!res.ok) throw new Error("Failed to fetch frameworks");
  return res.json();
};

// Add a new framework
export const addFramework = async (
  data: Omit<Framework, "id">
): Promise<Framework> => {
  const res = await fetch("api/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add framework");
  return res.json();
};

// Update a framework
export const updateFramework = async (
  id: number,
  data: Partial<Omit<Framework, "id">>
): Promise<Framework> => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update framework");
  return res.json();
};

// Delete a framework
export const deleteFramework = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete framework");
};
