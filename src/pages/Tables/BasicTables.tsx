import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TableAudits from "../../components/tables/BasicTables/TableAudits";
import TableCorrectiveActions from "../../components/tables/BasicTables/TableCorrectiveActions";
import { mockCorrectiveActions } from "../../mockData";
import { Audit, Auditor } from "../../types";
import PlanAudit from "../Audit/PlanAudit";
import { getAuditors } from "../../api/users";
import { AuditFilters, useAudits } from "../../hooks/useAudits";

type EntityFilters = {
  search: string;
  type: string;
  parent: string;
};

export default function BasicTables() {
  const [activeTab, setActiveTab] = useState<"audits" | "corrective_actions">(
    "audits"
  );

  // This `search` input is synchronized into auditFilters (single source of truth)
  const [search, setSearch] = useState("");

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const closeAuditModalOpen = () => setIsAuditModalOpen(false);

  // Separate filters for audits tab (single filter object used by useAudits)
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: "",
    status: "",
    plant: "",
    questionnaire: "",
    dateFrom: "",
    dateTo: "",
    auditor: "",
    auditee: "",
  });

  // entity filters kept for future (not used for audits in this rewrite)
  const [entityFilters, setEntityFilters] = useState<EntityFilters>({
    search: "",
    type: "",
    parent: "",
  });

  // show/hide filters panel
  const [showFilters, setShowFilters] = useState(false);

  // Keep auditor options for PlanAudit modal
  const [auditorOptions, setAuditorOptions] = useState<
    { value: string; text: string; selected: boolean }[]
  >([]);

  const {
    audits,

    loading: auditsLoading,
    error: auditsError,
    uniqueAuditees,
    uniqueAuditors,
    uniqueQuestionnaires,
  } = useAudits(auditFilters);

  // Keep local `filters` variable only for UI selects (mirrors auditFilters when audits active)
  // Not strictly necessary, but keeps controlled components simple
  const [filters, setFilters] = useState(auditFilters);

  // Synchronize the top-level search input into auditFilters.search
  useEffect(() => {
    setAuditFilters((prev) => ({ ...prev, search }));
    setFilters((prev) => ({ ...(prev as AuditFilters), search }));
  }, [search]);

  // Ensure UI filters reflect active tab
  useEffect(() => {
    if (activeTab === "audits") {
      setFilters(auditFilters);
    } else {
      // when switching to corrective_actions we keep filters local for future use
      setFilters((prev) => ({ ...(prev as any), search: "" }));
    }
  }, [activeTab, auditFilters]);

  // Update a specific filter key (works for audits tab)
  const handleFilterChange = (key: string, value: string) => {
    if (activeTab === "audits") {
      setAuditFilters((prev) => ({ ...prev, [key]: value }));
      setFilters((prev) => ({ ...(prev as AuditFilters), [key]: value }));
    } else {
      // not currently used (entity filters commented in UI)
      setEntityFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleResetFilters = () => {
    if (activeTab === "audits") {
      const reset: AuditFilters = {
        search: "",
        status: "",
        plant: "",
        questionnaire: "",
        dateFrom: "",
        dateTo: "",
        auditor: "",
        auditee: "",
      };
      setAuditFilters(reset);
      setFilters(reset);
      setSearch("");
    } else {
      const reset: EntityFilters = { search: "", type: "", parent: "" };
      setEntityFilters(reset);
      setFilters((prev) => ({ ...(prev as any), search: "" }));
    }
  };

  const handlePlanAudit = () => setIsAuditModalOpen(true);
  const handleReschedule = () => {
    console.log("Open modal to reschedule audit...");
  };

  // Corrective actions filtered client-side from mock data (keeps behavior you had)
  const filteredCorrectiveActions = useMemo(() => {
    const term = search.toLowerCase();
    return mockCorrectiveActions.filter((c) =>
      c.auditFramework.toLowerCase().includes(term)
    );
  }, [search]);

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

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* ---------- Filters Section ---------- */}
          {showFilters && (
            <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800 flex gap-4 flex-wrap items-end">
              {activeTab === "audits" ? (
                <>
                  {/* Audit filters */}
                  <div>
                    <label className="block mb-1">Status:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={(filters as AuditFilters).status}
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
                      {/* <option value="cancelled">Cancelled</option>{" "} */}
                      {/*same as postponed ,ONE OF THEM MUST BE IGNORED */}
                      {/* <option value="completed">Completed</option> */}
                      <option value="rescheduled">Rescheduled</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Plant:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={(filters as AuditFilters).plant}
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

                  <div>
                    <label className="block mb-1">Questionnaire:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={filters.questionnaire}
                      onChange={(e) =>
                        handleFilterChange("questionnaire", e.target.value)
                      }
                    >
                      <option value="">All</option>

                      {uniqueQuestionnaires.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Auditor:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={filters.auditor}
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
                  <div>
                    <label className="block mb-1">Auditee:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={filters.auditee}
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

                  <div>
                    <label className="block mb-1">Date:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="p-2 border rounded"
                        value={(filters as AuditFilters).dateFrom}
                        onChange={(e) =>
                          handleFilterChange("dateFrom", e.target.value)
                        }
                      />
                      <span className="self-center">to</span>
                      <input
                        type="date"
                        className="p-2 border rounded"
                        value={(filters as AuditFilters).dateTo}
                        onChange={(e) =>
                          handleFilterChange("dateTo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Entity filters (kept commented in original — left for future) */}
                </>
              )}
            </div>
          )}

          {activeTab === "audits" ? (
            <TableAudits audits={audits} />
          ) : (
            <TableCorrectiveActions
              correctiveActions={filteredCorrectiveActions}
            />
          )}
        </ComponentCard>

        <PlanAudit
          isAuditModalOpen={isAuditModalOpen}
          closeAuditModalOpen={closeAuditModalOpen}
          auditorOptions={auditorOptions}
        />
      </div>
    </>
  );
}
