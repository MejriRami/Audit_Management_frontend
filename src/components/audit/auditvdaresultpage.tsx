import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import vdaQuestions from "./vda63_questions.json";
import { computeVda63Results, Rating } from "./vda63Scoring";

type AuditValue = "" | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
type AuditItem = {
  questionId: number;
  question: string;
  value: AuditValue;
};

async function fetchAuditAnswers(auditId: string): Promise<AuditItem[]> {
  // replace with your endpoint
  const res = await fetch(`/api/audits/${auditId}/answers`);
  if (!res.ok) throw new Error("Failed to load answers");
  return res.json();
}

function badgeClass(r: Rating) {
  if (r === "A") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (r === "B") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

export default function AuditResultMatrixPage() {
  const { auditId } = useParams<{ auditId: string }>();
  const [answers, setAnswers] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    fetchAuditAnswers(auditId)
      .then(setAnswers)
      .finally(() => setLoading(false));
  }, [auditId]);

  const result = useMemo(() => {
    return computeVda63Results({
      answers,
      meta: vdaQuestions as any,
      // ✅ optional customer rules (turn on only when needed)
      optionalCustomerRules: {
        // for MAHLE example:
        // blockAIfAnyElementBelow: 80,
        // forceCIfAnyElementBelow: 70,
      },
    });
  }, [answers]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top summary box (like Excel bottom-right) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-6">
        <div>
          <div className="text-sm text-slate-600">Overall compliance EG</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">
            {result.total.egPercent}%
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Points: {result.total.achievedPoints}/{result.total.maxPoints}
          </div>
        </div>

        <div className={`px-4 py-2 rounded-xl border text-lg font-bold ${badgeClass(result.total.finalRating)}`}>
          {result.total.finalRating}
        </div>
      </div>

      {/* Elements table (P2..P7) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-900">
            Level of compliance by element
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Element</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">EG [%]</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.elements.map((e) => (
              <tr key={e.element} className="hover:bg-slate-50/60">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{e.element}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {e.egPercent == null ? "n.e." : `${e.egPercent}%`}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {e.achievedPoints}/{e.maxPoints === 0 ? "--" : e.maxPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Downgrade explanations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900">Downgrade reasons</h3>

        {result.downgradeReasons.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2">No downgrades applied.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-800 list-disc pl-5">
            {result.downgradeReasons.map((r, idx) => {
              if (r.type === "ASTERISK_0")
                return (
                  <li key={idx}>
                    Critical question <b>{r.question_code}</b> scored <b>0</b> → result forced to <b>C</b>
                  </li>
                );
              if (r.type === "ASTERISK_4")
                return (
                  <li key={idx}>
                    Critical question <b>{r.question_code}</b> scored <b>4</b> → result cannot be <b>A</b>
                  </li>
                );
              if (r.type === "CUSTOM_FORCE_C")
                return (
                  <li key={idx}>
                    Customer rule: element <b>{r.element}</b> is <b>{r.elementEG}%</b> (&lt; {r.threshold}%) → forced <b>C</b>
                  </li>
                );
              return (
                <li key={idx}>
                  Customer rule: element <b>{r.element}</b> is <b>{r.elementEG}%</b> (&lt; {r.threshold}%) → cannot be <b>A</b>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}  