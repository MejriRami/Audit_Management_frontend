// redux/audit/audit-selectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Base selector
export const selectAuditState = (state: RootState) => state.audit;

// Items and filters
export const selectAudits = createSelector(
  [selectAuditState],
  (audit) => audit.items
);

export const selectAuditFilters = createSelector(
  [selectAuditState],
  (audit) => audit.filters
);

// Loading & error if you want them
export const selectAuditsLoading = createSelector(
  [selectAuditState],
  (audit) => audit.loading
);

export const selectAuditsError = createSelector(
  [selectAuditState],
  (audit) => audit.error
);

// ---- Filtered audits ----
export const selectFilteredAudits = createSelector(
  [selectAudits, selectAuditFilters],
  (audits, f) => {
    const term = f.search?.toLowerCase() || "";

    return audits.filter((a) => {
      const matchesSearch =
        !term ||
        a.audit_number?.toLowerCase().includes(term) ||
        a.plant?.toLowerCase().includes(term) ||
        a.sector?.toLowerCase().includes(term) ||
        a.questionnaire?.name?.toLowerCase().includes(term);

      const matchesStatus = !f.status || a.status === f.status;
      const matchesPlant = !f.plant || a.plant === f.plant;
      const matchesQuestionnaire =
        !f.questionnaire || a.questionnaire?.name === f.questionnaire;

      const auditorEmail =
        (a.auditor as any)?.email || (a.auditor as any)?.username;
      const matchesAuditor = !f.auditor || auditorEmail === f.auditor;

      const matchesAuditee =
        !f.auditee || a.auditees?.some((e) => e === f.auditee);

      const startDate = a.planned_start_date
        ? a.planned_start_date.slice(0, 10)
        : null;
      const matchesDateFrom =
        !f.dateFrom || (startDate && startDate >= f.dateFrom);
      const matchesDateTo = !f.dateTo || (startDate && startDate <= f.dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlant &&
        matchesQuestionnaire &&
        matchesAuditor &&
        matchesAuditee &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }
);

// ---- Unique values for filters ----
export const selectUniqueQuestionnaires = createSelector(
  [selectAudits],
  (audits) => {
    const set = new Set<string>();
    audits.forEach((a) => {
      if (a.questionnaire?.name) set.add(a.questionnaire.name);
    });
    return Array.from(set);
  }
);

export const selectUniqueAuditors = createSelector(
  [selectAudits],
  (audits) => {
    const set = new Set<string>();
    audits.forEach((a) => {
      const email = (a.auditor as any)?.email || (a.auditor as any)?.username;
      if (email) set.add(email);
    });
    return Array.from(set);
  }
);

export const selectUniqueAuditees = createSelector(
  [selectAudits],
  (audits) => {
    const set = new Set<string>();
    audits.forEach((a) => {
      a.auditees?.forEach((email) => set.add(email));
    });
    return Array.from(set);
  }
);
