import { useEffect, useState } from "react";
import { Audit } from "../types";

interface AuditFilters {
  search: string;
  status: string;
  entity: string;
  framework: string;
  dateFrom: string;
  dateTo: string;
}

export function useAudits(filters: AuditFilters) {
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://localhost:8000";

  // --- Fetch all audits once ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/audit/get_all`);
        if (!res.ok) throw new Error("Failed to fetch audits");
        const data = await res.json();
        setAllAudits(data);
        setFilteredAudits(data);
        console.log("columns are ",data)
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Apply filters locally ---
  useEffect(() => {
    let result = [...allAudits];

    // Search across multiple fields
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.framework?.toLowerCase().includes(term) ||
          a.status?.toLowerCase().includes(term) ||
          a.entity?.toLowerCase().includes(term) ||
          a.questionnaire?.toLowerCase().includes(term) ||
          String(a.id).includes(term)
      );
    }

    //  Status Filter
    if (filters.status) {
      result = result.filter(
        (a) => a.status?.toLowerCase() === filters.status.toLowerCase()
      );
    console.log("heloo")
    console.log(result)

    }


    // Entity Filter
    if (filters.entity) {
      result = result.filter(
        (a) => a.entity?.toLowerCase() === filters.entity.toLowerCase()
      );
    }

    // Framework Filter
    if (filters.framework) {
      result = result.filter(
        (a) => a.framework?.toLowerCase() === filters.framework.toLowerCase()
      );
    }

    // Date range filter (based on sessions)
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((a) => {
        if (!a.sessions || a.sessions.length === 0) return false;

        const hasValidSession = a.sessions.some((session) => {
          const start = new Date(session.start_time);
          const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
          const to = filters.dateTo ? new Date(filters.dateTo) : null;

          return (!from || start >= from) && (!to || start <= to);
        });

        return hasValidSession;
      });
    }

    setFilteredAudits(result);
  }, [filters, allAudits]);

  return { audits: filteredAudits, loading, error };
}
