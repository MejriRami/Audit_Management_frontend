import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableAudits from "../../components/tables/BasicTables/TableAudits";
import BasicTableEntities from "../../components/tables/BasicTables/TableEntities";
import { useAudits } from "../../hooks/useAudits";
import { useEntities } from "../../hooks/useEntities";

// ---------- Filter Type Definitions ----------
type AuditFilters = {
  search: string;
  status: string;
  entity: string;
  framework: string;
  dateFrom: string;
  dateTo: string;
};

type EntityFilters = {
  search: string;
  type: string;
  parent: string;
};

export default function BasicTables() {
  const [activeTab, setActiveTab] = useState<"audits" | "entities">("audits");

  // Separate filters for each tab
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: "",
    status: "",
    entity: "",
    framework: "",
    dateFrom: "",
    dateTo: "",
  });

  const [entityFilters, setEntityFilters] = useState<EntityFilters>({
    search: "",
    type: "",
    parent: "",
  });

  // Currently displayed filters (depends on active tab)
  const [filters, setFilters] = useState<AuditFilters | EntityFilters>(
    auditFilters
  );
  const [showFilters, setShowFilters] = useState(false);

  // Switch filters when changing tabs
  useEffect(() => {
    if (activeTab === "audits") {
      setFilters(auditFilters);
    } else {
      setFilters(entityFilters);
    }
  }, [activeTab, auditFilters, entityFilters]);

  // Hooks
  const {
    audits,
    loading: auditsLoading,
    error: auditsError,
  } = useAudits(auditFilters);

  const {
    entities,
    loading: entitiesLoading,
    error: entitiesError,
  } = useEntities();

  // ---------- Handle filter changes ----------
  const handleFilterChange = (key: string, value: string) => {
    if (activeTab === "audits") {
      setAuditFilters((prev) => ({ ...prev, [key]: value }));
      setFilters((prev) => ({ ...(prev as AuditFilters), [key]: value }));
    } else {
      setEntityFilters((prev) => ({ ...prev, [key]: value }));
      setFilters((prev) => ({ ...(prev as EntityFilters), [key]: value }));
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    if (activeTab === "audits") {
      const reset: AuditFilters = {
        search: "",
        status: "",
        entity: "",
        framework: "",
        dateFrom: "",
        dateTo: "",
      };
      setAuditFilters(reset);
      setFilters(reset);
    } else {
      const reset: EntityFilters = { search: "", type: "", parent: "" };
      setEntityFilters(reset);
      setFilters(reset);
    }
  };

  // ---------- Filtered entities ----------
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const { search, type, parent } = entityFilters;

      // Search matches label or code
      const matchesSearch =
        entity.label.toLowerCase().includes(search.toLowerCase()) ||
        entity.code.toLowerCase().includes(search.toLowerCase());

      // Type match
      const matchesType = type ? entity.type === type : true;

      // Parent match
      const matchesParent =
        parent && entity.parent
          ? entity.parent.label.toLowerCase().includes(parent.toLowerCase())
          : parent
          ? false
          : true;

      return matchesSearch && matchesType && matchesParent;
    });
  }, [entities, entityFilters]);
  //   // ---------- Export data as CSV ----------
  //   const handleExport = () => {
  //     const dataToExport =
  //       activeTab === "audits" ? audits : filteredEntities;

  //     if (!dataToExport || dataToExport.length === 0) {
  //       alert("No data available to export.");
  //       return;
  //     }

  //     // Get headers (keys of first object)
  //     const headers = Object.keys(dataToExport[0]);

  //     // Create CSV rows
  //     const csvRows: string[] = [];
  //     csvRows.push(headers.join(",")); // header row

  //     for (const row of dataToExport) {
  //       const rowRecord = row as unknown as Record<string, unknown>;
  // const values = headers.map((header) =>
  //   JSON.stringify(rowRecord[header] ?? "")
  // );

  //       csvRows.push(values.join(","));
  //     }

  //     // Generate CSV string
  //     const csvContent = csvRows.join("\n");

  //     // Add UTF-8 BOM for Excel compatibility
  //     const csvWithBOM = "\uFEFF" + csvContent;

  //     // Create a Blob and download
  //     const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement("a");

  //     const timestamp = new Date().toISOString().split("T")[0];
  //     const filename =
  //       activeTab === "audits"
  //         ? `audits_export_${timestamp}.csv`
  //         : `entities_export_${timestamp}.csv`;

  //     link.href = url;
  //     link.setAttribute("download", filename);
  //     link.click();
  //     window.URL.revokeObjectURL(url);
  //   };

  return (
    <>
      <PageMeta
        title="Audit & Entity Tables"
        description="List and filter audits and entities"
      />
      <PageBreadcrumb pageTitle="Audit & Entity list" />

      <div className="space-y-6">
        <ComponentCard title={activeTab === "audits" ? "Audits" : "Entities"}>
          {/* ---------- Tabs ---------- */}
          <div className="flex mb-4 gap-4">
            {["audits", "entities"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded font-medium ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white dark:from-[#B55A00] dark:to-[#8A4600]"
                    : "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/90"
                }`}
                onClick={() => setActiveTab(tab as "audits" | "entities")}
              >
                {tab === "audits" ? "Audits" : "Entities"}
              </button>
            ))}
          </div>

          {/* ---------- Search & Filter Buttons ---------- */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white flex-1"
              />

              <button
                // className="inline-flex items-center gap-2 rounded-lg border border-gray-300
                // bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm
                // hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>

            <div className="flex gap-2">
              {/* <button
                // onClick={handleExport}
                // className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
              >
                Export Data
              </button> */}
              {/* <button className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]">
                Generate Report
              </button> */}
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
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Canceled</option>
                      <option value="Closed">Closed</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Entity:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={(filters as AuditFilters).entity}
                      onChange={(e) =>
                        handleFilterChange("entity", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="MAIN SITE">MAIN SITE</option>
                      <option value="SUPPLIER A">SUPPLIER A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Framework:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={(filters as AuditFilters).framework}
                      onChange={(e) =>
                        handleFilterChange("framework", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="iatf">IATF</option>
                      <option value="iso">ISO</option>
                      <option value="vda">VDA</option>
                      <option value="client">CLIENT</option>
                      <option value="internal">INTERNAL</option>
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
                  {/* Entity filters */}
                  <div>
                    <label className="block mb-1">Type:</label>
                    <select
                      className="p-2 border rounded w-full"
                      value={(filters as EntityFilters).type}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="site">Site</option>
                      <option value="process">Process</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Parent Entity:</label>
                    <input
                      type="text"
                      className="p-2 border rounded w-full"
                      value={(filters as EntityFilters).parent}
                      onChange={(e) =>
                        handleFilterChange("parent", e.target.value)
                      }
                      placeholder="Parent name..."
                    />
                  </div>
                </>
              )}

              <div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gradient-to-r from-[#0584CE] to-[#046EAF] text-white rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* ---------- Table Display ---------- */}
          {activeTab === "audits" ? (
            <>
              {auditsLoading && <p className="p-4 text-gray-500">Loading...</p>}
              {auditsError && <p className="p-4 text-red-500">{auditsError}</p>}
              {!auditsLoading && !auditsError && (
                <BasicTableAudits audits={audits} />
              )}
            </>
          ) : (
            <>
              {entitiesLoading && (
                <p className="p-4 text-gray-500">Loading...</p>
              )}
              {entitiesError && (
                <p className="p-4 text-red-500">{entitiesError}</p>
              )}
              {!entitiesLoading && !entitiesError && (
                <BasicTableEntities entities={filteredEntities} />
              )}
            </>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
