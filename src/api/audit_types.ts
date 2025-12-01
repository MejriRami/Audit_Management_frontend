export interface AuditType {
  id: number;
  value: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

const API_URL = "http://localhost:8000/audit-types";

//  1. Fetch all audit types from backend
export async function fetchAuditTypes(): Promise<SelectOption[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to load audit types");
  }

  const data: AuditType[] = await response.json();
  console.log("Fetched audit types:", data);
  return data.map((type) => ({
    value: String(type.id),
    label: type.value.charAt(0).toUpperCase() + type.value.slice(1),
  }));
}

export async function createAuditType(value: string): Promise<SelectOption> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    throw new Error("Failed to create audit type");
  }

  const newType: AuditType = await response.json();

  return {
    value: String(newType.id),
    label: newType.value,
  };
}

export async function deleteAuditType(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Failed to delete audit type");
  }
}
