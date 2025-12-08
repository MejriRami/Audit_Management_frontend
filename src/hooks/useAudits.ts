import { useEffect, useMemo, useState } from "react";
import { Audit } from "../types";
import { getAudits } from "../api/audit";

export interface AuditFilters {
  search: string;
  status: string;
  plant: string;
  questionnaire: string;
  dateFrom: string;
  dateTo: string;
  auditor:string;
  auditee:string;
}

export function useAudits(filters: AuditFilters) {
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uniqueAuditees = useMemo(
    () =>
      Array.from(
        new Set(
          allAudits.flatMap(a => a.auditees ?? [])
        )
      ),
    [allAudits]
  );

const uniqueAuditors = useMemo(
  () => [...new Set(allAudits.map(a => a.auditor?.email ?? ""))],
  [allAudits]
);
const uniqueQuestionnaires = [
  ...new Set(allAudits.map(a => a.questionnaire?.name ?? "")),
];


  // Fetch all audits once
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAudits();
        console.log("audits are ",res)
        if (!mounted) return;
        setAllAudits(res ?? []);
        setFilteredAudits(res ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Failed to fetch audits");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Apply filters locally (single place for filtering)
  useEffect(() => {
    // operate on a copy
    let result = allAudits.slice();

    // Normalize helper
    const normalize = (v?: string) =>
      (v ?? "").toString().trim().toLowerCase();

    // Search across multiple fields (if present)
    if (filters.search) {
      const term = normalize(filters.search);
      result = result.filter((a) => {
        return (
          normalize(a.questionnaire?.name).includes(term) ||
          normalize(a.status).includes(term) ||
          normalize(a.plant).includes(term) ||
          // if questionnaire exists and is string: include it
          (a as any).questionnaire?.toString().toLowerCase().includes(term) ||
          String(a.id).includes(term)
        );
      });
    }

    // Status filter (exact match but normalized)
    if (filters.status) {
      const s = normalize(filters.status);
      result = result.filter((a) => normalize(a.status) === s);
    }

    //plant filter
    if (filters.plant) {
      const e = normalize(filters.plant);
      result = result.filter((a) => normalize(a.plant) === e);
    }

    // Framework filter
    if (filters.questionnaire) {
      const f = normalize(filters.questionnaire);
      result = result.filter((a) => normalize(a.questionnaire?.name) === f);
    }

    // Date range filter (based on sessions array)
  if (filters.dateFrom || filters.dateTo) {
  const fromDate = filters.dateFrom
    ? new Date(`${filters.dateFrom}T00:00:00`)
    : null;
  const toDate = filters.dateTo
    ? new Date(`${filters.dateTo}T23:59:59`)
    : null;

  result = result.filter((audit) => {
    if (!audit.planned_start_date || !audit.planned_end_date) return false;

    const start = new Date(audit.planned_start_date);
    const end = new Date(audit.planned_end_date);

    // Overlap logic
    const overlaps =
      (!fromDate || end >= fromDate) &&
      (!toDate || start <= toDate);

    return overlaps;
  });
}

if (filters.auditee) {
  result = result.filter((audit) =>
    audit.auditees?.includes(filters.auditee)
  );
}

if (filters.auditor) {
  result = result.filter((audit) =>
    audit.auditor?.email === filters.auditor
  );
}


    setFilteredAudits(result);
  }, [filters, allAudits]);

return { audits: filteredAudits, uniqueAuditees,uniqueAuditors,uniqueQuestionnaires, loading, error };
}
