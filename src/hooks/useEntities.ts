import { useEffect, useState } from "react";
import { Entity } from "../types";

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    async function fetchEntities() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/entity/getAll`);
        if (!response.ok) throw new Error("Failed to fetch audits");
        const data = await response.json();
        setEntities(data);
        console.log("entities",data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch entities");
      } finally {
        setLoading(false);
      }
    }
    fetchEntities();
  }, []);

  return { entities, loading, error };
}
