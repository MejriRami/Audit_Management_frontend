import { useState, useMemo, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TableAudits from "../../components/tables/BasicTables/TableAudits";
import TableCorrectiveActions from "../../components/tables/BasicTables/TableCorrectiveActions";
import { mockAudits, mockCorrectiveActions } from "../../mockData";
import { Audit, Auditor, CorrectiveAction } from "../../types";
import PlanAudit from "../Audit/PlanAudit";
import { getAuditors } from "../../api/users";

export default function BasicTables() {
  const [activeTab, setActiveTab] = useState<"audits" | "corrective_actions">(
    "audits"
  );
  const [search, setSearch] = useState("");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const closeAuditModalOpen = () => {
    setIsAuditModalOpen(false);
  };
  const filteredAudits = useMemo(() => {
    return mockAudits.filter(
      (a) =>
        a.entity?.toLowerCase().includes(search.toLowerCase()) ||
        a.framework?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const filteredCorrectiveActions = useMemo(() => {
    return mockCorrectiveActions.filter((c) =>
      c.auditFramework.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);
  const handlePlanAudit = () => {
    setIsAuditModalOpen(true);
  };

  const handleReschedule = () => {
    console.log("Open modal to reschedule audit...");
  };
  const [auditorOptions, setAuditorOptions] = useState<
    { value: string; text: string; selected: boolean }[]
  >([]);
  const fetchAuditors = async () => {
    const auditors: Auditor[] = await getAuditors();
    const formatted = auditors.map((a) => ({
      text: a.email,
      value: a.email,
      selected: false,
    }));
    console.log("Fetched auditors:", formatted);
    setAuditorOptions(formatted);
  };
  useEffect(() => {
    fetchAuditors();
  }, []);
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
            {["audits", "corrective_actions"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded font-medium ${
                  activeTab === tab
                    ? " bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab(tab as any)}
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
          </div>

          {activeTab === "audits" ? (
            <TableAudits audits={filteredAudits} />
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
        ></PlanAudit>
      </div>
    </>
  );
}
