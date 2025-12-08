import React, { useState } from "react";
import { format } from "date-fns";

interface RescheduleAuditModalProps {
  audit: any;
  onClose: () => void;
}

const RescheduleAuditModal: React.FC<RescheduleAuditModalProps> = ({
  audit,
  onClose,
}) => {
  const [newStart, setNewStart] = useState(
    audit.planned_start_date
      ? format(new Date(audit.planned_start_date), "yyyy-MM-dd'T'HH:mm")
      : ""
  );

  const [newEnd, setNewEnd] = useState(
    audit.planned_end_date
      ? format(new Date(audit.planned_end_date), "yyyy-MM-dd'T'HH:mm")
      : ""
  );

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!newStart || !newEnd) {
      setError("Start and end dates are required.");
      return;
    }

    if (new Date(newStart) >= new Date(newEnd)) {
      setError("Start time must be before end time.");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/audits/${audit.id}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_start_date: newStart,
            new_end_date: newEnd,
            reason,
            changed_by: audit.auditor_id, // or current logged-in user!
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reschedule audit");
      }

      onClose();
      window.location.reload(); // optional
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999 backdrop-blur-[2px]">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Reschedule Audit</h2>

        {/* Current schedule info */}
        <div className="mb-4 text-sm text-gray-600">
          <p>
            <strong>Current Start:</strong>{" "}
            {format(new Date(audit.planned_start_date), "PPpp")}
          </p>
          <p>
            <strong>Current End:</strong>{" "}
            {format(new Date(audit.planned_end_date), "PPpp")}
          </p>
        </div>

        {/* New start */}
        <label className="block text-sm font-medium mb-1">New Start</label>
        <input
          type="datetime-local"
          value={newStart}
          onChange={(e) => setNewStart(e.target.value)}
          className="w-full border px-3 py-2 rounded-md mb-3"
        />

        {/* New end */}
        <label className="block text-sm font-medium mb-1">New End</label>
        <input
          type="datetime-local"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          className="w-full border px-3 py-2 rounded-md mb-3"
        />

        {/* Reason */}
        <label className="block text-sm font-medium mb-1">Reason</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border px-3 py-2 rounded-md mb-3"
          placeholder="Explain why the audit is being rescheduled..."
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleAuditModal;
