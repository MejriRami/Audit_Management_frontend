export type ScoreValue = 0 | 4 | 6 | 8 | 10;
export type Rating = "A" | "B" | "C";

export type VdaMeta = {
  question_id: string;
  element: string; // P2..P7
  question_code: string; // e.g. P6.2.3
  question_text_en: string;
  is_asterisk: boolean;
};

export type AnswerItem = {
  questionId: number;
  question: string;
  value: "" | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10; // your current type
  // optional: any extra fields you want
};

export type OptionalCustomerRules = {
  // Example MAHLE:
  // if any element score < 80 => cannot be A
  blockAIfAnyElementBelow?: number; // e.g. 80
  // if any element score < 70 => force C
  forceCIfAnyElementBelow?: number; // e.g. 70
};

export type DowngradeReason =
  | { type: "ASTERISK_0"; question_id: string; question_code: string; value: number }
  | { type: "ASTERISK_4"; question_id: string; question_code: string; value: number }
  | { type: "CUSTOM_BLOCK_A"; element: string; elementEG: number; threshold: number }
  | { type: "CUSTOM_FORCE_C"; element: string; elementEG: number; threshold: number };

export type Vda63Result = {
  total: {
    achievedPoints: number;
    maxPoints: number;
    egPercent: number; // 0..100
    initialRating: Rating;
    finalRating: Rating;
  };
  elements: Array<{
    element: string; // P2..P7
    achievedPoints: number;
    maxPoints: number;
    egPercent: number | null; // null => n.e.
  }>;
  downgradeReasons: DowngradeReason[];
  criticalFindings: Array<{
    question_id: string;
    question_code: string;
    value: number;
    rule: "0_forces_C" | "4_blocks_A";
  }>;
};

// Helpers
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function ratingFromEG(eg: number): Rating {
  if (eg >= 90) return "A";
  if (eg >= 80) return "B";
  return "C";
}

function clampRating(current: Rating, maxAllowed: Rating): Rating {
  // maxAllowed = "B" means you cannot be "A"
  // Order: A > B > C
  const rank = (r: Rating) => (r === "A" ? 3 : r === "B" ? 2 : 1);
  return rank(current) > rank(maxAllowed) ? maxAllowed : current;
}

export function computeVda63Results(params: {
  answers: AnswerItem[];
  meta: VdaMeta[];
  optionalCustomerRules?: OptionalCustomerRules;
  elementOrder?: string[]; // default P2..P7
}): Vda63Result {
  const { answers, meta, optionalCustomerRules } = params;
  const elementOrder = params.elementOrder ?? ["P2", "P3", "P4", "P5", "P6", "P7"];

  // Build lookups
  const metaByQuestionText = new Map<string, VdaMeta>();
  for (const m of meta) metaByQuestionText.set(m.question_text_en.trim(), m);

  // Convert answers -> scored rows with meta
  const rows = answers
    .map((a) => {
      const m = metaByQuestionText.get(a.question.trim());
      const raw = a.value;

      // N/A in your system is -1 or "" (you said N/A)
      const isNA = raw === -1 || raw === "";
      const isScored = !isNA;

      // Only valid scores: 0/4/6/8/10
      const score = isScored ? Number(raw) : null;

      // Ignore if meta missing
      return { a, m, isNA, isScored, score };
    })
    .filter((r) => !!r.m);

  // TOTAL EG
  let achieved = 0;
  let applicableCount = 0;

  for (const r of rows) {
    if (!r.isScored) continue;
    // ignore invalid values
    if (![0, 4, 6, 8, 10].includes(Number(r.score))) continue;
    achieved += Number(r.score);
    applicableCount += 1;
  }

  const maxPoints = applicableCount * 10;
  const egPercent = maxPoints === 0 ? 0 : round1((achieved / maxPoints) * 100);
  const initialRating = ratingFromEG(egPercent);

  // ELEMENT SCORES P2..P7
  const elementsMap = new Map<string, { achieved: number; count: number }>();
  for (const el of elementOrder) elementsMap.set(el, { achieved: 0, count: 0 });

  for (const r of rows) {
    const el = r.m!.element || "Other";
    if (!elementsMap.has(el)) elementsMap.set(el, { achieved: 0, count: 0 });

    if (!r.isScored) continue;
    if (![0, 4, 6, 8, 10].includes(Number(r.score))) continue;

    const bucket = elementsMap.get(el)!;
    bucket.achieved += Number(r.score);
    bucket.count += 1;
  }

  const elements = elementOrder.map((el) => {
    const b = elementsMap.get(el) ?? { achieved: 0, count: 0 };
    const max = b.count * 10;
    return {
      element: el,
      achievedPoints: b.achieved,
      maxPoints: max,
      egPercent: max === 0 ? null : round1((b.achieved / max) * 100),
    };
  });

  // DOWNGRADES (Mandatory VDA)
  const downgradeReasons: DowngradeReason[] = [];
  const criticalFindings: Vda63Result["criticalFindings"] = [];

  // Rule 1: any asterisk scored 0 => C
  const anyAsterisk0 = rows.some((r) => r.m!.is_asterisk && r.isScored && Number(r.score) === 0);
  if (anyAsterisk0) {
    for (const r of rows) {
      if (r.m!.is_asterisk && r.isScored && Number(r.score) === 0) {
        downgradeReasons.push({
          type: "ASTERISK_0",
          question_id: r.m!.question_id,
          question_code: r.m!.question_code,
          value: 0,
        });
        criticalFindings.push({
          question_id: r.m!.question_id,
          question_code: r.m!.question_code,
          value: 0,
          rule: "0_forces_C",
        });
      }
    }
  }

  // Rule 2: any asterisk scored 4 => cannot be A (max B)
  const anyAsterisk4 = rows.some((r) => r.m!.is_asterisk && r.isScored && Number(r.score) === 4);
  if (anyAsterisk4) {
    for (const r of rows) {
      if (r.m!.is_asterisk && r.isScored && Number(r.score) === 4) {
        downgradeReasons.push({
          type: "ASTERISK_4",
          question_id: r.m!.question_id,
          question_code: r.m!.question_code,
          value: 4,
        });
        criticalFindings.push({
          question_id: r.m!.question_id,
          question_code: r.m!.question_code,
          value: 4,
          rule: "4_blocks_A",
        });
      }
    }
  }

  // Apply mandatory downgrade to rating
  let finalRating: Rating = initialRating;

  if (anyAsterisk0) {
    finalRating = "C";
  } else if (anyAsterisk4) {
    finalRating = clampRating(finalRating, "B");
  }

  // OPTIONAL CUSTOMER RULES (configurable)
  if (optionalCustomerRules?.forceCIfAnyElementBelow != null) {
    const th = optionalCustomerRules.forceCIfAnyElementBelow;
    for (const e of elements) {
      if (e.egPercent != null && e.egPercent < th) {
        downgradeReasons.push({
          type: "CUSTOM_FORCE_C",
          element: e.element,
          elementEG: e.egPercent,
          threshold: th,
        });
        finalRating = "C";
      }
    }
  }

  if (optionalCustomerRules?.blockAIfAnyElementBelow != null) {
    const th = optionalCustomerRules.blockAIfAnyElementBelow;
    for (const e of elements) {
      if (e.egPercent != null && e.egPercent < th) {
        downgradeReasons.push({
          type: "CUSTOM_BLOCK_A",
          element: e.element,
          elementEG: e.egPercent,
          threshold: th,
        });
        finalRating = clampRating(finalRating, "B");
      }
    }
  }

  return {
    total: {
      achievedPoints: achieved,
      maxPoints,
      egPercent,
      initialRating,
      finalRating,
    },
    elements,
    downgradeReasons,
    criticalFindings,
  };
}
