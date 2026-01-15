import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";

type ReferenceLine = { value: number; label?: string };

type KpiStackedResponse = {
  groupBy: string;
  stackBy: string;
  unit?: "hours" | "count";
  keys: string[];
  data: Array<{ group: string; [k: string]: number | string }>;
  referenceLines?: ReferenceLine[];
};

type KpiCountScoreResponse = {
  groupBy: string;
  unitLeft: "count";
  unitRight: "score";
  data: Array<{ group: string; count: number; score: number }>;
  gradeLines: Array<{ value: number; label: string }>;
};

type KpiSimpleSeriesResponse = {
  groupBy: string;
  unit: "days" | "count";
  data: Array<{ group: string; value: number }>;
  referenceLines?: ReferenceLine[];
};

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

async function fetchJson<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set (.env).");

  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  const text = await res.text();

  if (!res.ok)
    throw new Error(`Request failed ${res.status}: ${text.slice(0, 200)}...`);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Expected JSON from ${API_BASE}${path} but got:\n${text.slice(0, 200)}...`
    );
  }
}

// ---------------------------
// Plant labels/colors (stable, Monday-like)
// ---------------------------
const toTitle = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const PLANT_COLORS: Record<string, string> = {
  sceet: "#0062ff",
  same: "#1bb1d3",
  nadhour: "#f65ce7",
  monterrey: "#9e6e1b",
  tianjin: "#000000",
  kunshan: "#ef2c2c",
  chennai: "#4b024b",
  frankfort: "#F97316",
  rayones: "#A3A3A3",
  daegu: "#0EA5E9",
  anhui: "#14B8A6",
  galeana: "#cc1616",
  poitiers: "#fb7171",
  cyclam: "#519391a8",
};

// ---------------------------
// Responsive observer helper
// ---------------------------
function useResizeObserver(targetRef: React.RefObject<HTMLElement | SVGElement>) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = targetRef.current as any;
    if (!el) return;

    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    // If svg passed, observe its parent
    const node: Element =
      el instanceof SVGElement ? (el.parentElement ?? el) : el;

    ro.observe(node);
    return () => ro.disconnect();
  }, [targetRef]);

  return tick;
}

// ---------------------------
// D3 stacked bar (Monday-like)
// - stable colors by key
// - totals on top of stacks
// - dashed ref lines + labels
// ---------------------------
function StackedBarD3({
  data,
  keys,
  unit,
  height = 420,
  referenceLines = [],
}: {
  data: Array<{ group: string; [k: string]: number | string }>;
  keys: string[];
  unit?: "hours" | "count";
  height?: number;
  referenceLines?: ReferenceLine[];
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const resizeTick = useResizeObserver(ref as any);

  useEffect(() => {
    if (!ref.current) return;
    if (!data?.length || !keys?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = ref.current.parentElement?.clientWidth ?? 900;
    const margin = { top: 22, right: 14, bottom: 44, left: 60 };

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    const rows = data.map((d) => {
      const out: any = { ...d };
      for (const k of keys) out[k] = Number(out[k] ?? 0);
      return out;
    });

    const series = d3.stack<any>().keys(keys)(rows);

    const x = d3
      .scaleBand<string>()
      .domain(rows.map((d) => String(d.group)))
      .range([margin.left, width - margin.right])
      .padding(0.12);

    const yMax = d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 0;

    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(keys)
      .range(keys.map((k) => PLANT_COLORS[k] ?? "#9CA3AF"));

    // Bars
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => String(color(d.key)))
      .selectAll("rect")
      .data((s) => s.map((d) => ({ ...d, key: s.key } as any)))
      .join("rect")
      .attr("x", (d: any) => x(String(d.data.group))!)
      .attr("y", (d: any) => y(d[1]))
      .attr("height", (d: any) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .append("title")
      .text((d: any) => {
        const v = Number(d.data[d.key] ?? 0);
        const label = unit === "hours" ? `${v.toFixed(1)} h` : `${v}`;
        const name =
          d.key in PLANT_COLORS ? toTitle(String(d.key)) : String(d.key);
        return `${d.data.group} • ${name}\n${label}`;
      });

    // Totals on top of each stack (Monday-like)
    svg
      .append("g")
      .selectAll("text.total")
      .data(rows)
      .join("text")
      .attr("class", "total")
      .attr("x", (d: any) => x(String(d.group))! + x.bandwidth() / 2)
      .attr("y", (d: any) => {
        const total = keys.reduce((s, k) => s + Number(d[k] ?? 0), 0);
        return y(total) - 6;
      })
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#111827")
      .text((d: any) => {
        const total = keys.reduce((s, k) => s + Number(d[k] ?? 0), 0);
        if (unit === "hours") return `${Math.round(total)} Hrs`;
        return `${Math.round(total)}`;
      });

    // Reference lines (Min red / Max green / default gray)
    const refColor = (label?: string) => {
      const t = (label ?? "").toLowerCase();
      if (t.includes("min")) return "#EF4444";
      if (t.includes("max")) return "#22C55E";
      return "#9CA3AF";
    };

    referenceLines.forEach((rl) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(rl.value))
        .attr("y2", y(rl.value))
        .attr("stroke", refColor(rl.label))
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "6 4");

      if (rl.label) {
        svg
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", y(rl.value) - 6)
          .attr("text-anchor", "end")
          .style("font-size", "12px")
          .style("fill", refColor(rl.label))
          .text(`${rl.label} (${rl.value})`);
      }
    });

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6));
  }, [data, keys, height, unit, referenceLines, resizeTick]);

  return <svg ref={ref} />;
}

// ---------------------------
// D3 Combo chart (bars=count, line=score)
// (kept as-is, already close to Monday style)
// ---------------------------
function ComboBarLineD3({
  data,
  height = 420,
  gradeLines = [],
}: {
  data: Array<{ group: string; count: number; score: number }>;
  height?: number;
  gradeLines?: Array<{ value: number; label: string }>;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const resizeTick = useResizeObserver(ref as any);

  useEffect(() => {
    if (!ref.current) return;
    if (!data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = ref.current.parentElement?.clientWidth ?? 900;
    const margin = { top: 18, right: 56, bottom: 44, left: 60 };

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.group))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const yRight = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Grade lines (A/B/C/D)
    gradeLines.forEach((g) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yRight(g.value))
        .attr("y2", yRight(g.value))
        .attr("stroke", "#9CA3AF")
        .attr("stroke-dasharray", "6 4");

      svg
        .append("text")
        .attr("x", margin.left + 6)
        .attr("y", yRight(g.value) - 6)
        .style("font-size", "12px")
        .style("fill", "#6B7280")
        .text(g.label);
    });

    // Bars (count)
    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.group)!)
      .attr("y", (d) => yLeft(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => yLeft(0) - yLeft(d.count))
      .attr("fill", "#FBBF24") // yellow-like monday
      .append("title")
      .text((d) => `Count: ${d.count}`);

    // Line (score)
    const line = d3
      .line<{ group: string; count: number; score: number }>()
      .x((d) => x(d.group)! + x.bandwidth() / 2)
      .y((d) => yRight(d.score));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3B82F6")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.group)! + x.bandwidth() / 2)
      .attr("cy", (d) => yRight(d.score))
      .attr("r", 3)
      .attr("fill", "#3B82F6")
      .append("title")
      .text((d) => `Score: ${d.score.toFixed(1)}`);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yLeft).ticks(6));

    svg
      .append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(d3.axisRight(yRight).ticks(5));
  }, [data, height, gradeLines, resizeTick]);

  return <svg ref={ref} />;
}

// ---------------------------
// D3 Simple bar (single series + optional target line)
// Used for "Average Days..." and other single-metric time charts
// ---------------------------
function SimpleBarD3({
  data,
  unit,
  height = 420,
  referenceLines = [],
  valueFormat,
}: {
  data: Array<{ group: string; value: number }>;
  unit: "days" | "count";
  height?: number;
  referenceLines?: ReferenceLine[];
  valueFormat?: (v: number) => string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const resizeTick = useResizeObserver(ref as any);

  useEffect(() => {
    if (!ref.current) return;
    if (!data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = ref.current.parentElement?.clientWidth ?? 900;
    const margin = { top: 22, right: 14, bottom: 44, left: 60 };

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.group))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const yMax = d3.max(data, (d) => d.value) ?? 0;

    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Bars
    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.group)!)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", "#FBBF24") // Monday-ish yellow
      .append("title")
      .text((d) => `${d.group}: ${d.value.toFixed(2)} ${unit}`);

    // Labels on top (Monday-like)
    svg
      .append("g")
      .selectAll("text.value")
      .data(data)
      .join("text")
      .attr("class", "value")
      .attr("x", (d) => x(d.group)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#111827")
      .text((d) =>
        valueFormat ? valueFormat(d.value) : unit === "days" ? d.value.toFixed(2) : String(Math.round(d.value))
      );

    // Reference lines
    referenceLines.forEach((rl) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(rl.value))
        .attr("y2", y(rl.value))
        .attr("stroke", "#22C55E") // green target like Monday
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "6 4");

      if (rl.label) {
        svg
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", y(rl.value) - 6)
          .attr("text-anchor", "end")
          .style("font-size", "12px")
          .style("fill", "#22C55E")
          .text(rl.label);
      }
    });

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6));
  }, [data, unit, height, referenceLines, valueFormat, resizeTick]);

  return <svg ref={ref} />;
}

// ---------------------------
// D3 Category bars (plant/audit ranking)
// ---------------------------
function CategoryBarD3({
  data,
  unit,
  height = 420,
  referenceLines = [],
  colorByGroup = false,
}: {
  data: Array<{ group: string; value: number }>;
  unit: "days" | "count";
  height?: number;
  referenceLines?: ReferenceLine[];
  colorByGroup?: boolean; // plants use stable colors
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const resizeTick = useResizeObserver(ref as any);

  useEffect(() => {
    if (!ref.current) return;
    if (!data?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = ref.current.parentElement?.clientWidth ?? 900;
    const margin = { top: 18, right: 14, bottom: 90, left: 60 };

    const sorted = [...data].sort((a, b) => b.value - a.value);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    const x = d3
      .scaleBand<string>()
      .domain(sorted.map((d) => d.group))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(sorted, (d) => d.value) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Reference lines (often red target in Monday for working days chart)
    referenceLines.forEach((rl) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(rl.value))
        .attr("y2", y(rl.value))
        .attr("stroke", "#EF4444")
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "6 4");

      if (rl.label) {
        svg
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", y(rl.value) - 6)
          .attr("text-anchor", "end")
          .style("font-size", "12px")
          .style("fill", "#EF4444")
          .text(rl.label);
      }
    });

    // Bars
    svg
      .append("g")
      .selectAll("rect")
      .data(sorted)
      .join("rect")
      .attr("x", (d) => x(d.group)!)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d) =>
        colorByGroup ? PLANT_COLORS[d.group] ?? "#9CA3AF" : "#FBBF24"
      )
      .append("title")
      .text((d) => `${d.group}: ${d.value.toFixed(2)} ${unit}`);

    // Value labels
    svg
      .append("g")
      .selectAll("text.value")
      .data(sorted)
      .join("text")
      .attr("class", "value")
      .attr("x", (d) => x(d.group)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 6)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#111827")
      .text((d) =>
        unit === "days" ? d.value.toFixed(2) : String(Math.round(d.value))
      );

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickSizeOuter(0)
          .tickFormat((d) => {
            // pretty labels for plants
            const s = String(d);
            return s.length <= 10 ? toTitle(s) : s;
          })
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-35)");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6));
  }, [data, unit, height, referenceLines, colorByGroup, resizeTick]);

  return <svg ref={ref} />;
}

// ---------------------------
// KPI page (updated to match Monday charts)
// ---------------------------
export default function KpiAuditsD3() {
  const [plant, setPlant] = useState("all");
  const [auditTypeId, setAuditTypeId] = useState("all");
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2026-01-31");

  // Existing
  const [auditHours, setAuditHours] = useState<KpiStackedResponse | null>(null);
  const [lateCar, setLateCar] = useState<KpiStackedResponse | null>(null);
  const [countScore, setCountScore] = useState<KpiCountScoreResponse | null>(
    null
  );
  const [typePerPlant, setTypePerPlant] = useState<KpiStackedResponse | null>(
    null
  );

  // Monday missing charts (new)
  const [carCount, setCarCount] = useState<KpiStackedResponse | null>(null);
  const [avgDaysClose, setAvgDaysClose] =
    useState<KpiSimpleSeriesResponse | null>(null);
  const [workingDaysByPlant, setWorkingDaysByPlant] =
    useState<KpiSimpleSeriesResponse | null>(null);
  const [openCarByPlant, setOpenCarByPlant] =
    useState<KpiSimpleSeriesResponse | null>(null);
  const [lateOpenCarByPlant, setLateOpenCarByPlant] =
    useState<KpiSimpleSeriesResponse | null>(null);
  const [openCarByAudit, setOpenCarByAudit] =
    useState<KpiSimpleSeriesResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: backend enums are lowercase (sceet/same/...)
  const plantOptions = useMemo(
    () => [
      { value: "all", label: "All plants" },
      { value: "sceet", label: "Sceet" },
      { value: "same", label: "Same" },
      { value: "nadhour", label: "Nadhour" },
      { value: "monterrey", label: "Monterrey" },
      { value: "tianjin", label: "Tianjin" },
      { value: "kunshan", label: "Kunshan" },
      { value: "chennai", label: "Chennai" },
      { value: "frankfort", label: "Frankfort" },
      { value: "rayones", label: "Rayones" },
      { value: "daegu", label: "Daegu" },
      { value: "anhui", label: "Anhui" },
      { value: "galeana", label: "Galeana" },
      { value: "poitiers", label: "Poitiers" },
      { value: "cyclam", label: "Cyclam" },
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "All types" },
      // later: populate from GET /audit-types/
    ],
    []
  );

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    if (plant !== "all") p.set("plant", plant);
    if (auditTypeId !== "all") p.set("audit_type_id", auditTypeId);
    return p.toString();
  }, [from, to, plant, auditTypeId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          hours,
          lateWeekly,
          carMonthly,
          avgClose,
          workByPlant,
          openByPlant,
          lateOpenByPlant,
          openByAudit,
          cs,
          tpp,
        ] = await Promise.all([
          // Monday #1
          fetchJson<KpiStackedResponse>(
            `/kpi/audit-hours?interval=month&date_basis=planned&${qs}`
          ),
          // Monday #8
          fetchJson<KpiStackedResponse>(`/kpi/late-car?interval=week&${qs}`),

          // Monday #3
          fetchJson<KpiStackedResponse>(`/kpi/car-count?interval=month&${qs}`),

          // Monday #2
          fetchJson<KpiSimpleSeriesResponse>(
            `/kpi/avg-days-close-car?interval=month&${qs}`
          ),

          // Monday #4
          fetchJson<KpiSimpleSeriesResponse>(
            `/kpi/working-days-close-car-by-plant?${qs}`
          ),

          // Monday #5
          fetchJson<KpiSimpleSeriesResponse>(
            `/kpi/open-car-by-plant?${qs}`
          ),

          // Monday #6
          fetchJson<KpiSimpleSeriesResponse>(
            `/kpi/late-open-car-by-plant?${qs}`
          ),

          // Monday #7
          fetchJson<KpiSimpleSeriesResponse>(`/kpi/open-car-by-audit?${qs}&limit=25`),

          // Keep existing extras (optional)
          fetchJson<KpiCountScoreResponse>(
            `/kpi/audit-count-score?interval=month&date_basis=planned&${qs}`
          ),
          fetchJson<KpiStackedResponse>(`/kpi/audits-by-type-plant?${qs}`),
        ]);

        setAuditHours(hours);
        setLateCar(lateWeekly);

        setCarCount(carMonthly);
        setAvgDaysClose(avgClose);
        setWorkingDaysByPlant(workByPlant);
        setOpenCarByPlant(openByPlant);
        setLateOpenCarByPlant(lateOpenByPlant);
        setOpenCarByAudit(openByAudit);

        setCountScore(cs);
        setTypePerPlant(tpp);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load KPI");
      } finally {
        setLoading(false);
      }
    })();
  }, [qs]);

  return (
    <div className="p-6 space-y-6">
      <PageMeta title="KPI – Audits" description="KPI dashboard (D3)" />
      <PageBreadcrumb pageTitle="KPI – Audits" />

      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Plant
            </p>
            <Select
              options={plantOptions}
              defaultValue={plant}
              onChange={setPlant}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Audit Type
            </p>
            <Select
              options={typeOptions}
              defaultValue={auditTypeId}
              onChange={setAuditTypeId}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              From
            </p>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              To
            </p>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>
      </ComponentCard>

      {loading && <div className="text-sm text-gray-500">Loading KPI…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* -----------------------
          Monday layout order (as close as possible)
         ----------------------- */}
      <ComponentCard title="Hours of Audits by date (all plants / all type)">
        {auditHours?.data?.length ? (
          <StackedBarD3
            data={auditHours.data}
            keys={auditHours.keys}
            unit="hours"
            referenceLines={auditHours.referenceLines ?? []}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Average Days for closing Actions by date">
        {avgDaysClose?.data?.length ? (
          <SimpleBarD3
            data={avgDaysClose.data}
            unit="days"
            referenceLines={avgDaysClose.referenceLines ?? []}
            valueFormat={(v) => `${v.toFixed(2)}`}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Number of CAR by date">
        {carCount?.data?.length ? (
          <StackedBarD3 data={carCount.data} keys={carCount.keys} unit="count" />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Number of Working days for closing actions by plants">
        {workingDaysByPlant?.data?.length ? (
          <CategoryBarD3
            data={workingDaysByPlant.data}
            unit="days"
            referenceLines={workingDaysByPlant.referenceLines ?? []}
            colorByGroup={true}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Number of open CAR by plant">
        {openCarByPlant?.data?.length ? (
          <CategoryBarD3
            data={openCarByPlant.data}
            unit="count"
            colorByGroup={true}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Number of Late open CAR by plant">
        {lateOpenCarByPlant?.data?.length ? (
          <CategoryBarD3
            data={lateOpenCarByPlant.data}
            unit="count"
            colorByGroup={true}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Number of open CAR by Audit">
        {openCarByAudit?.data?.length ? (
          <CategoryBarD3
            data={openCarByAudit.data}
            unit="count"
            colorByGroup={false}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Late CAR by week by plant">
        {lateCar?.data?.length ? (
          <StackedBarD3 data={lateCar.data} keys={lateCar.keys} unit="count" />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      {/* Keep existing non-Monday charts (optional) */}
      <ComponentCard title="Number of audits and score">
        {countScore?.data?.length ? (
          <ComboBarLineD3
            data={countScore.data}
            gradeLines={countScore.gradeLines}
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>

      <ComponentCard title="Audits per type per plant">
        {typePerPlant?.data?.length ? (
          <StackedBarD3
            data={typePerPlant.data}
            keys={typePerPlant.keys}
            unit="count"
          />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>
    </div>
  );
}
