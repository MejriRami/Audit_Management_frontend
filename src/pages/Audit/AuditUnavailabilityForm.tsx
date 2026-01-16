import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

type ApiResponse =
  | { message: string; audit_id: number; unavailability_id: number }
  | { detail: string };

function isApiError(x: any): x is { detail: string } {
  return x && typeof x === "object" && typeof x.detail === "string";
}

export default function AuditUnavailabilityForm() {
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const canSubmit =
    !!token &&
    startDate.length === 10 &&
    endDate.length === 10 &&
    startDate <= endDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!token) {
      setErrorMsg("token manquant dans l'URL.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Veuillez renseigner les dates.");
      return;
    }
    if (startDate > endDate) {
      setErrorMsg("La date de début doit être <= la date de fin.");
      return;
    }

    setLoading(true);
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/car/audits/unavailability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim() || null,
        }),
      });

      const data: ApiResponse = await res
        .json()
        .catch(() => ({ detail: "Invalid server response." } as any));

      if (!res.ok) {
        setErrorMsg(isApiError(data) ? data.detail : "Server error.");
        return;
      }

      setSuccessMsg(
        "Absences recorded ✅ The CAR deadlines have been recalculated."
      );
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden ">
      <div className="absolute inset-0 bg-[url(''assets/images/form-image.jpg')] bg-cover bg-center"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="text-4xl font-bold flex items-center">
                <div className="text-4xl font-bold">
                  <span className="text-blue-800 uppercase">AVO</span>
                  <span className="text-gray-500">Carbon</span>
                </div>
              </div>
              <div className="w-full border-t border-gray-300 my-1"></div>

              <div className="absolute right-0 -bottom-6 text-orange-500 font-semibold tracking-wide">
                STS
              </div>
            </div>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">
                Audit Unavailability Request Form
              </h1>
              <p className="mt-2 text-blue-100 text-sm">
                The declared absence days (working days) will be deducted from
                the window, and the CAR deadline will be updated.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Info notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Note that: the date will be verified with your Manager
                  </p>
                </div>
              </div>

              {/* Date début */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={true}
                />
              </div>

              {/* Date fin */}
              <div>
                <Label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required={true}
                />
                {startDate && endDate && startDate > endDate && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    End date must be ≥ start date
                  </div>
                )}
              </div>

              {/* Raison */}
              <div>
                <Label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for the request
                </Label>
                <div className="relative">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
                    placeholder="Please provide the reason for your request (e.g., Annual leave, business trip, sick leave...)"
                  />
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-red-800">
                      {errorMsg}
                    </p>
                  </div>
                </div>
              )}

              {/* Success message */}
              {successMsg && (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm font-medium text-green-800">
                      {successMsg}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving in Progress...
                  </span>
                ) : (
                  "Submit the request"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-white">
              © 2025 AVOCarbon - All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
