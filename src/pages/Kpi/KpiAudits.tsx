import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import { Modal } from "../../components/ui/modal";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
} from "recharts";

// -----------------------------------------------------------------------------
// BASE KPI DATA (per audit) – used for charts 3–7
// -----------------------------------------------------------------------------
type AuditKpi = {
  id: number;
  name: string;
  auditor: string;
  month: string; // "2025-01"
  score: number; // 0–100
  status: "Passed" | "Failed" | "In Progress";
  nonConformities: number;
};

const FAKE_DATA: AuditKpi[] = [
  {
    id: 1,
    name: "Audit – Packaging Line 1",
    auditor: "auditor1@company.com",
    month: "2025-01",
    score: 92,
    status: "Passed",
    nonConformities: 1,
  },
  {
    id: 2,
    name: "Audit – Storage Area",
    auditor: "auditor2@company.com",
    month: "2025-01",
    score: 78,
    status: "In Progress",
    nonConformities: 3,
  },
  {
    id: 3,
    name: "Audit – Production Line 3",
    auditor: "auditor1@company.com",
    month: "2025-02",
    score: 65,
    status: "Failed",
    nonConformities: 7,
  },
  {
    id: 4,
    name: "Audit – Utilities & Maintenance",
    auditor: "auditor3@company.com",
    month: "2025-02",
    score: 88,
    status: "Passed",
    nonConformities: 2,
  },
  {
    id: 5,
    name: "Audit – Warehouse",
    auditor: "auditor2@company.com",
    month: "2025-03",
    score: 81,
    status: "Passed",
    nonConformities: 2,
  },
  {
    id: 6,
    name: "Audit – Quality Lab",
    auditor: "auditor1@company.com",
    month: "2025-03",
    score: 74,
    status: "In Progress",
    nonConformities: 4,
  },
];

// -----------------------------------------------------------------------------
// DATA MODEL FOR CHART 1: AUDIT DURATION PER MONTH (PER SITE)
// -----------------------------------------------------------------------------
type AuditsDurationPoint = {
  label: string; // e.g. "Jan 2025"
  sceet: number;
  frankfort: number;
  rayones: number;
  sts: number;
  sameNadhour: number;
  daegu: number;
  monterrey: number;
  anhui: number;
  galeana: number;
  poitiers: number;
  tianjin: number;
  kunshan: number;
  chennai: number;
  cyclam: number;
};

const SITE_SERIES: {
  key: keyof AuditsDurationPoint;
  label: string;
  color: string;
}[] = [
  { key: "sceet", label: "Sceet", color: "#579BFC" },
  { key: "frankfort", label: "Frankfort", color: "#FFADAD" },
  { key: "rayones", label: "Rayones", color: "#FFC75F" },
  { key: "sts", label: "STS", color: "#B5E48C" },
  { key: "sameNadhour", label: "Same Nadhour", color: "#9D4EDD" },
  { key: "daegu", label: "Daegu", color: "#00C9A7" },
  { key: "monterrey", label: "Monterrey", color: "#F15BB5" },
  { key: "anhui", label: "Anhui", color: "#845EC2" },
  { key: "galeana", label: "Galeana", color: "#FF9671" },
  { key: "poitiers", label: "Poitiers", color: "#2C73D9" },
  { key: "tianjin", label: "Tianjin", color: "#FF6F91" },
  { key: "kunshan", label: "Kunshan", color: "#00D2FC" },
  { key: "chennai", label: "Chennai", color: "#4D8076" },
  { key: "cyclam", label: "Cyclam", color: "#C34A36" },
];

// Fake duration data per month (hours), stacked by site
const AUDITS_DURATION_BY_MONTH: AuditsDurationPoint[] = [
  {
    label: "Jan 2025",
    sceet: 20,
    frankfort: 15,
    rayones: 10,
    sts: 8,
    sameNadhour: 5,
    daegu: 6,
    monterrey: 8,
    anhui: 7,
    galeana: 5,
    poitiers: 6,
    tianjin: 10,
    kunshan: 8,
    chennai: 6,
    cyclam: 4, // ~118h
  },
  {
    label: "Feb 2025",
    sceet: 25,
    frankfort: 18,
    rayones: 12,
    sts: 10,
    sameNadhour: 6,
    daegu: 8,
    monterrey: 9,
    anhui: 8,
    galeana: 7,
    poitiers: 8,
    tianjin: 12,
    kunshan: 9,
    chennai: 7,
    cyclam: 5, // ~144h
  },
  {
    label: "Mar 2025",
    sceet: 28,
    frankfort: 20,
    rayones: 15,
    sts: 12,
    sameNadhour: 8,
    daegu: 10,
    monterrey: 12,
    anhui: 10,
    galeana: 8,
    poitiers: 9,
    tianjin: 15,
    kunshan: 11,
    chennai: 9,
    cyclam: 7, // ~174h
  },
  {
    label: "Apr 2025",
    sceet: 24,
    frankfort: 17,
    rayones: 13,
    sts: 10,
    sameNadhour: 7,
    daegu: 9,
    monterrey: 11,
    anhui: 9,
    galeana: 7,
    poitiers: 8,
    tianjin: 13,
    kunshan: 10,
    chennai: 8,
    cyclam: 6, // ~152h
  },
  {
    label: "May 2025",
    sceet: 26,
    frankfort: 19,
    rayones: 14,
    sts: 11,
    sameNadhour: 7,
    daegu: 9,
    monterrey: 12,
    anhui: 10,
    galeana: 8,
    poitiers: 9,
    tianjin: 14,
    kunshan: 11,
    chennai: 9,
    cyclam: 6, // ~165h
  },
  {
    label: "Jun 2025",
    sceet: 22,
    frankfort: 16,
    rayones: 12,
    sts: 9,
    sameNadhour: 6,
    daegu: 8,
    monterrey: 10,
    anhui: 9,
    galeana: 7,
    poitiers: 8,
    tianjin: 13,
    kunshan: 10,
    chennai: 8,
    cyclam: 5, // ~143h
  },
];

// -----------------------------------------------------------------------------
// OTHER TYPES / HELPERS
// -----------------------------------------------------------------------------
type ChartId =
  | "auditsByMonth"       // duration per month (hours)
  | "scoreByMonth"        // avg score per month (bar or line)
  | "ncByMonth"
  | "statusDistribution"
  | "auditsPerAuditor"
  | "passRateByMonth"
  | null;

const formatMonthLabel = (month: string) => {
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

const mondayBlue = "#579BFC";
const mondayGreen = "#00C875";
const mondayOrange = "#FDAB3D";
const mondayRed = "#E2445C";
const mondayPink = "#FF5AC4";

export default function KpiAudits() {
  const [selectedAuditor, setSelectedAuditor] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [activeChart, setActiveChart] = useState<ChartId>(null);

  // OPTIONS
  const auditorOptions = useMemo(
    () => [
      { value: "all", label: "All Auditors" },
      ...Array.from(new Set(FAKE_DATA.map((a) => a.auditor))).map((email) => ({
        value: email,
        label: email,
      })),
    ],
    []
  );

  const monthOptions = useMemo(
    () => [
      { value: "all", label: "All Months" },
      ...Array.from(new Set(FAKE_DATA.map((a) => a.month))).map((month) => ({
        value: month,
        label: formatMonthLabel(month),
      })),
    ],
    []
  );

  // FILTERED DATA (for charts 3–7)
  const filteredData = useMemo(
    () =>
      FAKE_DATA.filter((a) => {
        const byAuditor =
          selectedAuditor === "all" || a.auditor === selectedAuditor;
        const byMonth =
          selectedMonth === "all" || a.month === selectedMonth;
        return byAuditor && byMonth;
      }),
    [selectedAuditor, selectedMonth]
  );

  // KPI SUMMARY
  const kpiSummary = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalAudits: 0, avgScore: 0, totalNc: 0, passRate: 0 };
    }
    const totalAudits = filteredData.length;
    const avgScore =
      filteredData.reduce((sum, a) => sum + a.score, 0) / totalAudits;
    const totalNc = filteredData.reduce(
      (sum, a) => sum + a.nonConformities,
      0
    );
    const passedCount = filteredData.filter((a) => a.status === "Passed")
      .length;
    const passRate = (passedCount / totalAudits) * 100;

    return { totalAudits, avgScore, totalNc, passRate };
  }, [filteredData]);

  // ---------------------------------------------------------------------------
  // CHART DATA
  // ---------------------------------------------------------------------------

  // 1) Audit duration per month (per site) – fixed fake data
  const auditsByMonth = AUDITS_DURATION_BY_MONTH;

  // 3) Non-conformities per month
  const ncByMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((a) => {
      map.set(a.month, (map.get(a.month) || 0) + a.nonConformities);
    });
    return Array.from(map.entries())
      .sort(([m1], [m2]) => (m1 < m2 ? -1 : 1))
      .map(([month, totalNc]) => ({
        month,
        label: formatMonthLabel(month),
        totalNc,
      }));
  }, [filteredData]);

  // 4) Status distribution
  const statusDistribution = useMemo(() => {
    const base = { Passed: 0, Failed: 0, "In Progress": 0 } as Record<
      AuditKpi["status"],
      number
    >;
    filteredData.forEach((a) => {
      base[a.status]++;
    });
    const total = filteredData.length || 1;
    return [
      {
        name: "Passed",
        value: base["Passed"],
      },
      {
        name: "Failed",
        value: base["Failed"],
      },
      {
        name: "In Progress",
        value: base["In Progress"],
      },
    ].map((s) => ({
      ...s,
      percentage: (s.value / total) * 100,
    }));
  }, [filteredData]);

  // 5) Average score per month (used for chart 2 small + chart 5 big)
  const scoreByMonth = useMemo(() => {
    const map = new Map<
      string,
      { totalScore: number; count: number }
    >();
    filteredData.forEach((a) => {
      if (!map.has(a.month)) {
        map.set(a.month, { totalScore: 0, count: 0 });
      }
      const entry = map.get(a.month)!;
      entry.totalScore += a.score;
      entry.count++;
    });
    return Array.from(map.entries())
      .sort(([m1], [m2]) => (m1 < m2 ? -1 : 1))
      .map(([month, val]) => ({
        month,
        label: formatMonthLabel(month),
        avgScore: val.totalScore / val.count,
      }));
  }, [filteredData]);

  // 6) Audits per auditor
  const auditsPerAuditor = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((a) => {
      map.set(a.auditor, (map.get(a.auditor) || 0) + 1);
    });
    return Array.from(map.entries()).map(([auditor, count]) => ({
      auditor,
      count,
    }));
  }, [filteredData]);

  // 7) Pass rate per month
  const passRateByMonth = useMemo(() => {
    const map = new Map<
      string,
      { passed: number; total: number }
    >();
    filteredData.forEach((a) => {
      if (!map.has(a.month)) {
        map.set(a.month, { passed: 0, total: 0 });
      }
      const entry = map.get(a.month)!;
      if (a.status === "Passed") entry.passed++;
      entry.total++;
    });
    return Array.from(map.entries())
      .sort(([m1], [m2]) => (m1 < m2 ? -1 : 1))
      .map(([month, val]) => ({
        month,
        label: formatMonthLabel(month),
        passRate: (val.passed / val.total) * 100,
      }));
  }, [filteredData]);

  const pieColors = [mondayGreen, mondayRed, mondayOrange];

  return (
    <div className="p-6 space-y-8">
      <PageMeta title="KPI – Audits" description="KPI dashboard for audits" />
      <PageBreadcrumb pageTitle="KPI – Audits" />

      {/* FILTER BAR */}
      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Auditor
            </p>
            <Select
              options={auditorOptions}
              defaultValue={selectedAuditor}
              onChange={(value: string) => setSelectedAuditor(value)}
              placeholder="Select Auditor"
              className="dark:bg-dark-900"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Month
            </p>
            <Select
              options={monthOptions}
              defaultValue={selectedMonth}
              onChange={(value: string) => setSelectedMonth(value)}
              placeholder="Select Month"
              className="dark:bg-dark-900"
            />
          </div>
          <div className="space-y-2 flex items-end">
            <button
              onClick={() => {
                setSelectedAuditor("all");
                setSelectedMonth("all");
              }}
              className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </ComponentCard>

      {/* KPI CARDS */}
      <ComponentCard title="KPI Overview">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-blue-600 uppercase">
              Total Audits
            </p>
            <p className="mt-2 text-2xl font-semibold text-blue-900 dark:text-blue-100">
              {kpiSummary.totalAudits}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-emerald-600 uppercase">
              Average Score
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
              {kpiSummary.avgScore.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-amber-600 uppercase">
              Non-Conformities
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-100">
              {kpiSummary.totalNc}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-900/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-indigo-600 uppercase">
              Passed Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-indigo-900 dark:text-indigo-100">
              {kpiSummary.passRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* 7 CHARTS – SMALL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1) Duration of audits per month (stacked by site) */}
        <ComponentCard title="Audit Duration per Month (All Sites)">
          <div
            role="button"
            onClick={() => setActiveChart("auditsByMonth")}
            className="cursor-pointer"
          >
            {auditsByMonth.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={auditsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis
                      allowDecimals={false}
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    {/* Min & Max reference lines */}
                    <ReferenceLine
                      y={150}
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                      label={{
                        value: "Min 150h",
                        position: "insideTopRight",
                        fill: "#4B5563",
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      y={170}
                      stroke="#111827"
                      strokeDasharray="4 4"
                      label={{
                        value: "Max 170h",
                        position: "insideTopRight",
                        fill: "#111827",
                        fontSize: 11,
                      }}
                    />

                    {SITE_SERIES.map((site) => (
                      <Bar
                        key={site.key as string}
                        dataKey={site.key as string}
                        stackId="duration"
                        fill={site.color}
                        name={site.label}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 2) Average score per month (bar, similar layout) */}
        <ComponentCard title="Average Score per Month">
          <div
            role="button"
            onClick={() => setActiveChart("scoreByMonth")}
            className="cursor-pointer"
          >
            {scoreByMonth.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" fill={mondayBlue} name="Average score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 3) Non-conformities per month */}
        <ComponentCard title="Non-Conformities per Month">
          <div
            role="button"
            onClick={() => setActiveChart("ncByMonth")}
            className="cursor-pointer"
          >
            {ncByMonth.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ncByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalNc" fill={mondayPink} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 4) Status distribution */}
        <ComponentCard title="Status Distribution">
          <div
            role="button"
            onClick={() => setActiveChart("statusDistribution")}
            className="cursor-pointer"
          >
            {statusDistribution.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={(entry) =>
                        `${entry.name} (${entry.value})`
                      }
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 5) Average score per month (line view, more detailed) */}
        <ComponentCard title="Average Score per Month (Trend)">
          <div
            role="button"
            onClick={() => setActiveChart("scoreByMonth")}
            className="cursor-pointer"
          >
            {scoreByMonth.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke={mondayBlue}
                      dot
                      name="Average score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 6) Audits per auditor */}
        <ComponentCard title="Audits per Auditor">
          <div
            role="button"
            onClick={() => setActiveChart("auditsPerAuditor")}
            className="cursor-pointer"
          >
            {auditsPerAuditor.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={auditsPerAuditor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="auditor" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={mondayGreen} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* 7) Pass rate per month */}
        <ComponentCard title="Pass Rate per Month">
          <div
            role="button"
            onClick={() => setActiveChart("passRateByMonth")}
            className="cursor-pointer"
          >
            {passRateByMonth.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={passRateByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      stroke={mondayGreen}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* POPUP / MODAL – BIGGER CHARTS */}
      <Modal
        isOpen={activeChart !== null}
        onClose={() => setActiveChart(null)}
        className="max-w-[900px] p-6 lg:p-10"
      >
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {activeChart === "auditsByMonth" &&
                "Audit Duration per Month (All Sites)"}
              {activeChart === "scoreByMonth" && "Average Score per Month"}
              {activeChart === "ncByMonth" && "Non-Conformities per Month"}
              {activeChart === "statusDistribution" && "Status Distribution"}
              {activeChart === "auditsPerAuditor" && "Audits per Auditor"}
              {activeChart === "passRateByMonth" && "Pass Rate per Month"}
            </h3>
            <button
              onClick={() => setActiveChart(null)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Close
            </button>
          </div>

          {/* Reuse same filters inside modal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Auditor
              </p>
              <Select
                options={auditorOptions}
                defaultValue={selectedAuditor}
                onChange={(value: string) => setSelectedAuditor(value)}
                className="dark:bg-dark-900"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Month
              </p>
              <Select
                options={monthOptions}
                defaultValue={selectedMonth}
                onChange={(value: string) => setSelectedMonth(value)}
                className="dark:bg-dark-900"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Split by
              </p>
              <Select
                options={[
                  { value: "default", label: "Default" },
                  { value: "auditor", label: "Auditor" },
                  { value: "month", label: "Month" },
                  { value: "status", label: "Status" },
                ]}
                defaultValue="default"
                onChange={() => {}}
                className="dark:bg-dark-900"
              />
            </div>
          </div>

          {/* Big chart area */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-[#111113] dark:to-[#050507] p-6 min-h-[340px]">
            {activeChart === "auditsByMonth" && auditsByMonth.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={auditsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Hours",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    y={150}
                    stroke="#9CA3AF"
                    strokeDasharray="4 4"
                    label={{
                      value: "Min 150h",
                      position: "insideTopRight",
                      fill: "#4B5563",
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    y={170}
                    stroke="#111827"
                    strokeDasharray="4 4"
                    label={{
                      value: "Max 170h",
                      position: "insideTopRight",
                      fill: "#111827",
                      fontSize: 11,
                    }}
                  />
                  {SITE_SERIES.map((site) => (
                    <Bar
                      key={site.key as string}
                      dataKey={site.key as string}
                      stackId="duration"
                      fill={site.color}
                      name={site.label}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "scoreByMonth" && scoreByMonth.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={scoreByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke={mondayBlue}
                    dot
                    name="Average score"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === "ncByMonth" && ncByMonth.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ncByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalNc" fill={mondayPink} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "statusDistribution" &&
              statusDistribution.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      label={(entry) =>
                        `${entry.name} (${entry.value})`
                      }
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

            {activeChart === "auditsPerAuditor" &&
              auditsPerAuditor.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={auditsPerAuditor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="auditor" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={mondayGreen} />
                  </BarChart>
                </ResponsiveContainer>
              )}

            {activeChart === "passRateByMonth" &&
              passRateByMonth.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={passRateByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      stroke={mondayGreen}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
