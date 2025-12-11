// redux/audit/audit-slice-types.ts
import { Audit, AuditRescheduleHistory } from "./audit-types";

export interface AuditFilters {
  search: string;
  status: string;
  plant: string;
  questionnaire: string;
  dateFrom: string;
  dateTo: string;
  auditor: string;
  auditee: string;
}

export interface AuditState {
  items: Audit[];
  loading: boolean;
  error: string | null;

  filters: AuditFilters;

  // for reschedule history
  historyByAuditId: AuditRescheduleHistory[];
  historyLoading: boolean;
  historyError: string | null;

  // for planning new audits
  planningLoading: boolean;
  planningError: string | null;
  rescheduleLoading: boolean,
rescheduleError: string | null,

}
