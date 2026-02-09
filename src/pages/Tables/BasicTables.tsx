import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TableAudits from "../../components/tables/BasicTables/TableAudits";
import TableCorrectiveActions from "../../components/tables/BasicTables/TableCorrectiveActions";
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

import { CorrectiveAction } from "../../types";

type EntityFilters = {
  search: string;
  type: string;
  parent: string;
};

const API_BASE = "https://audit-backend-kbgea.ondigitalocean.app"; // adjust if needed

export default function BasicTables() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"audits" | "corrective_actions">(
    "audits",
  );

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const closeAuditModalOpen = () => setIsAuditModalOpen(false);
  const [showFilters, setShowFilters] = useState(false);

  // For corrective actions filters/search
  const [entityFilters, setEntityFilters] = useState<EntityFilters>({
    search: "",
    type: "",
    parent: "",
  });

  // ---- Corrective Actions (from API) ----
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [carsError, setCarsError] = useState<string | null>(null);

  // ----- Redux audit state via selectors ( safe defaults) -----
  const auditsLoading = useAppSelector(selectAuditsLoading);
  const auditsError = useAppSelector(selectAuditsError);

  const auditFilters =
    useAppSelector(selectAuditFilters) ??
    ({
      search: "",
      status: "",
      plant: "",
      questionnaire: "",
      auditor: "",
      auditee: "",
      dateFrom: "",
      dateTo: "",
    } as AuditFilters);

  const filteredAudits = useAppSelector(selectFilteredAudits) ?? [];
  const uniqueQuestionnaires = useAppSelector(selectUniqueQuestionnaires) ?? [];
  const uniqueAuditors = useAppSelector(selectUniqueAuditors) ?? [];
  const uniqueAuditees = useAppSelector(selectUniqueAuditees) ?? [];

  // Fetch audits on mount
  useEffect(() => {
    dispatch(fetchAudits());
  }, [dispatch]);

  // ✅ URL param behavior
  useEffect(() => {
    const tab = searchParams.get("tab");
    const search = searchParams.get("search");
    const auditId = searchParams.get("audit_id");
    const carId = searchParams.get("car_id");

    if (tab === "corrective_actions") {
      setActiveTab("corrective_actions");

      if (carId) {
        setEntityFilters((prev) => ({ ...prev, search: `car:${carId}` }));
      } else if (auditId) {
        setEntityFilters((prev) => ({ ...prev, search: `audit:${auditId}` }));
      } else if (search) {
        setEntityFilters((prev) => ({ ...prev, search }));
      }
    }
  }, [searchParams]);

  //  Fetch corrective actions when tab is opened
  useEffect(() => {
    if (activeTab !== "corrective_actions") return;

    const fetchCars = async () => {
      setCarsLoading(true);
      setCarsError(null);

      try {
        const token = localStorage.getItem("token"); // adjust key if different
        const res = await axios.get(
          `${API_BASE}/car/admin/corrective-actions`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        // backend returns: { items: [...] }
        setCorrectiveActions(res.data?.items ?? []);
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Failed to load corrective actions";
        setCarsError(String(msg));
        setCorrectiveActions([]);
      } finally {
        setCarsLoading(false);
      }
    };

    fetchCars();
  }, [activeTab]);

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
      dispatch(
        setAuditFiltersAction({ [key]: value } as Partial<AuditFilters>),
      );
    } else {
      // kept for future
      setEntityFilters((prev) => ({ ...prev, [key]: value }) as any);
    }
  };

  const handleResetFilters = () => {
    if (activeTab === "audits") {
      dispatch(clearAuditFiltersAction());
    } else {
      setEntityFilters({ search: "", type: "", parent: "" });
    }
  };

  //  Corrective actions filtering (supports notification params)
  const filteredCorrectiveActions = useMemo(() => {
    const term = entityFilters.search.toLowerCase().trim();

    if (!term) return correctiveActions;

    if (term.startsWith("car:")) {
      const carId = Number(term.replace("car:", ""));
      if (Number.isNaN(carId)) return [];
      return correctiveActions.filter((c) => c.id === carId);
    }

    if (term.startsWith("audit:")) {
      const auditId = Number(term.replace("audit:", ""));
      if (Number.isNaN(auditId)) return [];
      return correctiveActions.filter((c) => c.auditId === auditId);
    }

    return correctiveActions.filter((c) => {
      const haystack = [
        String(c.auditId),
        String(c.auditAnswerId ?? ""),
        c.finding_type ?? "",
        c.corrective_action ?? "",
        c.auditee ?? "",
        c.pilotUser ?? "",
        c.reason_why ?? "",
        c.due_date ?? "",
        c.status ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [entityFilters.search, correctiveActions]);

  const currentSearch =
    activeTab === "audits" ? (auditFilters.search ?? "") : entityFilters.search;

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

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Reset Filters
            </button>
          </div>

          {/* Filters Section (audits only for now) */}
          {showFilters && activeTab === "audits" && (
            <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800 flex gap-4 flex-wrap items-end">
              {/* Status */}
              <div>
                <label className="block mb-1">Status:</label>
                <select
                  className="p-2 border rounded w-full"
                  value={auditFilters.status ?? ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
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
                  value={auditFilters.plant ?? ""}
                  onChange={(e) => handleFilterChange("plant", e.target.value)}
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
                  value={auditFilters.questionnaire ?? ""}
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
                  value={auditFilters.auditor ?? ""}
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
                  value={auditFilters.auditee ?? ""}
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
                    value={auditFilters.dateFrom ?? ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    className="p-2 border rounded"
                    value={auditFilters.dateTo ?? ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {auditsError && activeTab === "audits" && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              Failed to load audits: {auditsError}
            </div>
          )}

          {carsError && activeTab === "corrective_actions" && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              Failed to load corrective actions: {carsError}
            </div>
          )}

          {/* Content */}
          {activeTab === "audits" ? (
            auditsLoading ? (
              <InlineLoader label="Loading audits..." />
            ) : filteredAudits.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No audits match your filters.
              </div>
            ) : (
              <TableAudits audits={filteredAudits} />
            )
          ) : carsLoading ? (
            <InlineLoader label="Loading corrective actions..." />
          ) : filteredCorrectiveActions.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No corrective actions found.
            </div>
          ) : (
            <TableCorrectiveActions
              correctiveActions={filteredCorrectiveActions}
              onRefresh={() => {
                // quick refresh: re-trigger effect
                setActiveTab("audits");
                setTimeout(() => setActiveTab("corrective_actions"), 0);
              }}
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

function InlineLoader({ label }: { label: string }) {
  return (
    <div className="flex justify-center items-center py-8 text-gray-500">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
