// ✅ FULL FILE: BasicTables.tsx (copy/paste)
// What’s fixed:
// - Reads URL params: tab, search, audit_id, car_id
// - If tab=corrective_actions → opens Corrective Actions tab
// - If car_id/audit_id exist → filters corrective actions correctly (so Accept/Reject shows)
// - Normal navigation to /audits stays the same (defaults to Audits tab, no forced filters)

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TableAudits from "../../components/tables/BasicTables/TableAudits";
import TableCorrectiveActions from "../../components/tables/BasicTables/TableCorrectiveActions";
import { mockCorrectiveActions } from "../../mockData";
import PlanAudit from "../Audit/PlanAudit";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchAudits,
  setAuditFilters as setAuditFiltersAction,
  clearAuditFilters as clearAuditFiltersAction,
} from "../../redux/audit/audit-slice";
import { AuditFilters } from "../../redux/audit/audit-slice-types";
import {
  selectAuditsLoading,
  selectAuditsError,
  selectAuditFilters,
  selectFilteredAudits,
  selectUniqueQuestionnaires,
  selectUniqueAuditors,
  selectUniqueAuditees,
} from "../../redux/audit/audit-selectors";

type EntityFilters = {
  search: string;
  type: string;
  parent: string;
};

export default function BasicTables() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"audits" | "corrective_actions">(
    "audits"
  );
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const closeAuditModalOpen = () => setIsAuditModalOpen(false);
  const [showFilters, setShowFilters] = useState(false);

  // kept for future (for corrective actions / entities)
  const [entityFilters, setEntityFilters] = useState<EntityFilters>({
    search: "",
    type: "",
    parent: "",
  });

  // ✅ URL param behavior (only triggers if params exist)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const search = searchParams.get("search");
    const auditId = searchParams.get("audit_id");
    const carId = searchParams.get("car_id");

    if (tab === "corrective_actions") {
      setActiveTab("corrective_actions");

      // Prefer car_id / audit_id when coming from notifications
      if (carId) {
        setEntityFilters((prev) => ({ ...prev, search: `car:${carId}` }));
      } else if (auditId) {
        setEntityFilters((prev) => ({ ...prev, search: `audit:${auditId}` }));
      } else if (search) {
        setEntityFilters((prev) => ({ ...prev, search }));
      }
    }
  }, [searchParams]);

  // ----- Redux audit state via selectors -----
  const auditsLoading = useAppSelector(selectAuditsLoading);
  const auditsError = useAppSelector(selectAuditsError);
  const auditFilters = useAppSelector(selectAuditFilters);
  const filteredAudits = useAppSelector(selectFilteredAudits);
  const uniqueQuestionnaires = useAppSelector(selectUniqueQuestionnaires);
  const uniqueAuditors = useAppSelector(selectUniqueAuditors);
  const uniqueAuditees = useAppSelector(selectUniqueAuditees);

  // Fetch audits on mount
  useEffect(() => {
    dispatch(fetchAudits());
  }, [dispatch]);

  const handlePlanAudit = () => setIsAuditModalOpen(true);
  const handleReschedule = () => {
    console.log("Open modal to reschedule audit...");
  };

  // ---- Handlers for filters ----
  const handleSearchChange = (value: string) => {
    if (activeTab === "audits") {
      dispatch(setAuditFiltersAction({ search: value }));
    } else {
      setEntityFilters((prev) => ({ ...prev, search: value }));
    }
  };

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    if (activeTab === "audits") {
      dispatch(setAuditFiltersAction({ [key]: value } as Partial<AuditFilters>));
    } else {
      setEntityFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleResetFilters = () => {
    if (activeTab === "audits") {
      dispatch(clearAuditFiltersAction());
    } else {
      const reset: EntityFilters = { search: "", type: "", parent: "" };
      setEntityFilters(reset);
    }
  };

  // ✅ Corrective actions filtering (supports notification params)
  const filteredCorrectiveActions = useMemo(() => {
    const term =
      activeTab === "audits"
        ? auditFilters.search.toLowerCase().trim()
        : entityFilters.search.toLowerCase().trim();

    // no search -> show all corrective actions
    if (!term) return mockCorrectiveActions;

    // From notifications: show specific corrective action by id
    if (term.startsWith("car:")) {
      const carId = Number(term.replace("car:", ""));
      if (Number.isNaN(carId)) return [];
      return mockCorrectiveActions.filter((c) => c.id === carId);
    }

    // From notifications: show all corrective actions of an audit
    if (term.startsWith("audit:")) {
      const auditId = Number(term.replace("audit:", ""));
      if (Number.isNaN(auditId)) return [];
      return mockCorrectiveActions.filter((c) => c.auditId === auditId);
    }

    // Normal search: match across multiple fields (safe)
    return mockCorrectiveActions.filter((c) => {
      const haystack = [
        c.auditFramework,
        String(c.auditId),
        String(c.auditAnswerId),
        c.finding_type,
        c.corrective_action ?? "",
        c.auditee,
        c.pilotUser,
        c.reason_why ?? "",
        c.due_date ?? "",
        c.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [activeTab, auditFilters.search, entityFilters.search]);

  const currentSearch =
    activeTab === "audits" ? auditFilters.search : entityFilters.search;

  return (
    <>
      <PageMeta
        title="Audit & Corrective Actions"
        description="Audits and completed corrective actions"
      />
      <PageBreadcrumb pageTitle="Audit & Corrective Actions List" />

      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={handlePlanAudit}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Plan Audit
          </button>

          <button
            onClick={handleReschedule}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
          >
            Reschedule
          </button>
        </div>

        <ComponentCard
          title={activeTab === "audits" ? "Audits" : "Corrective Actions"}
        >
          {/* Tabs */}
          <div className="flex mb-4 gap-4">
            {(["audits", "corrective_actions"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded font-medium ${
                  activeTab === tab
                    ? " bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "audits" ? "Audits" : "Corrective Actions"}
              </button>
            ))}
          </div>

          {/* Search + Filters toggle */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="px-4 py-2 border rounded-lg flex-1"
            />

            <button
              onClick={() => setShowFilters((s) => !s)}
              className="px-3 py-2 border rounded-lg"
            >
              Filters
            </button>
            <div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2  bg-indigo-600 text-white rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800 flex gap-4 flex-wrap items-end">
              {activeTab === "audits" ? (
                <>
                  {/* Status */}
                  <div>
                    <label className="block mb-1">Status:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={auditFilters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="planned">Planned</option>
                      <option value="in progress">In Progress</option>
                      <option value="waiting_for_corrective_actions">
                        Waiting for CAR
                      </option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>

                  {/* Plant */}
                  <div>
                    <label className="block mb-1">Plant:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={auditFilters.plant}
                      onChange={(e) =>
                        handleFilterChange("plant", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="anhui">Anhui</option>
                      <option value="chennai">Chennai</option>
                      <option value="cyclam">Cyclam</option>
                      <option value="daegu">Daegu</option>
                      <option value="frankfort">Frankfort</option>
                      <option value="galeana">Galeana</option>
                      <option value="kunshan">Kunshan</option>
                      <option value="monterrey">Monterrey</option>
                      <option value="nadhour">Nadhour</option>
                      <option value="poitiers">Poitiers</option>
                      <option value="rayones">Rayones</option>
                      <option value="same">Same</option>
                      <option value="sceet">Sceet</option>
                      <option value="tianjin">Tianjin</option>
                    </select>
                  </div>

                  {/* Questionnaire */}
                  <div>
                    <label className="block mb-1">Questionnaire:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={auditFilters.questionnaire}
                      onChange={(e) =>
                        handleFilterChange("questionnaire", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      {uniqueQuestionnaires.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auditor */}
                  <div>
                    <label className="block mb-1">Auditor:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={auditFilters.auditor}
                      onChange={(e) =>
                        handleFilterChange("auditor", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      {uniqueAuditors.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auditee */}
                  <div>
                    <label className="block mb-1">Auditee:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={auditFilters.auditee}
                      onChange={(e) =>
                        handleFilterChange("auditee", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      {uniqueAuditees.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date range */}
                  <div>
                    <label className="block mb-1">Date:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="p-2 border rounded"
                        value={auditFilters.dateFrom}
                        onChange={(e) =>
                          handleFilterChange("dateFrom", e.target.value)
                        }
                      />
                      <span className="self-center">to</span>
                      <input
                        type="date"
                        className="p-2 border rounded"
                        value={auditFilters.dateTo}
                        onChange={(e) =>
                          handleFilterChange("dateTo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          )}

          {auditsError && activeTab === "audits" && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              Failed to load audits: {auditsError}
            </div>
          )}

          {auditsLoading && activeTab === "audits" && <InlineLoader />}

          {/* Table content */}
          {activeTab === "audits" ? (
            auditsLoading ? (
              <InlineLoader />
            ) : filteredAudits.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No audits match your filters.
              </div>
            ) : (
              <TableAudits audits={filteredAudits} />
            )
          ) : (
            <TableCorrectiveActions
              correctiveActions={filteredCorrectiveActions}
            />
          )}
        </ComponentCard>

        <PlanAudit
          isAuditModalOpen={isAuditModalOpen}
          closeAuditModalOpen={closeAuditModalOpen}
        />
      </div>
    </>
  );
}

function InlineLoader() {
  return (
    <div className="flex justify-center items-center py-8 text-gray-500">
      <span className="animate-pulse">Loading audits...</span>
    </div>
  );
}
