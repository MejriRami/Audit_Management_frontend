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
// D3 stacked bar
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

  useEffect(() => {
    if (!ref.current) return;
    if (!data?.length || !keys?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = ref.current.parentElement?.clientWidth ?? 900;
    const margin = { top: 18, right: 14, bottom: 44, left: 60 };

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

    const palette = (d3.schemeTableau10 as string[]).concat(
      d3.schemeSet3 as unknown as string[]
    );
    const color = d3.scaleOrdinal<string>().domain(keys).range(palette);

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
        return `${d.data.group} • ${d.key}\n${label}`;
      });

    referenceLines.forEach((rl) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(rl.value))
        .attr("y2", y(rl.value))
        .attr("stroke", "#9CA3AF")
        .attr("stroke-dasharray", "6 4");

      if (rl.label) {
        svg
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", y(rl.value) - 6)
          .attr("text-anchor", "end")
          .style("font-size", "12px")
          .style("fill", "#6B7280")
          .text(`${rl.label} (${rl.value})`);
      }
    });

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6));
  }, [data, keys, height, unit, referenceLines]);

  return <svg ref={ref} />;
}

// ---------------------------
// D3 Combo chart (bars=count, line=score)
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
  }, [data, height, gradeLines]);

  return <svg ref={ref} />;
}

// ---------------------------
// KPI page
// ---------------------------
export default function KpiAuditsD3() {
  const [plant, setPlant] = useState("all");
  const [auditTypeId, setAuditTypeId] = useState("all");
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2026-01-31");

  const [auditHours, setAuditHours] = useState<KpiStackedResponse | null>(null);
  const [lateCar, setLateCar] = useState<KpiStackedResponse | null>(null);
  const [countScore, setCountScore] = useState<KpiCountScoreResponse | null>(
    null
  );
  const [typePerPlant, setTypePerPlant] = useState<KpiStackedResponse | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plantOptions = useMemo(
    () => [
      { value: "all", label: "All plants" },
      { value: "Sceet", label: "Sceet" },
      { value: "Same", label: "Same" },
      { value: "Nadhour", label: "Nadhour" },
      { value: "Monterrey", label: "Monterrey" },
      { value: "Tianjin", label: "Tianjin" },
      { value: "Kunshan", label: "Kunshan" },
      { value: "Chennai", label: "Chennai" },
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
        const [hours, car, cs, tpp] = await Promise.all([
          fetchJson<KpiStackedResponse>(
            `/kpi/audit-hours?interval=month&date_basis=planned&${qs}`
          ),
          fetchJson<KpiStackedResponse>(`/kpi/late-car?interval=week&${qs}`),
          fetchJson<KpiCountScoreResponse>(
            `/kpi/audit-count-score?interval=month&date_basis=planned&${qs}`
          ),
          fetchJson<KpiStackedResponse>(`/kpi/audits-by-type-plant?${qs}`),
        ]);

        setAuditHours(hours);
        setLateCar(car);
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

      <ComponentCard title="Hours of Audits by date (stacked by plant)">
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

      <ComponentCard title="Late CAR by week (stacked by plant)">
        {lateCar?.data?.length ? (
          <StackedBarD3 data={lateCar.data} keys={lateCar.keys} unit="count" />
        ) : (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </ComponentCard>
    </div>
  );
}
