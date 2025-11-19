import { useState } from "react";

export default function RescheduleModal({
  audit,
  onClose,
  onSave,
}: {
  audit: any;
  onClose: () => void;
  onSave: (a: any) => void;
}) {
  const [newDate, setNewDate] = useState(audit.expectedDate);

  const handleSave = () => {
    const updatedAudit = {
      ...audit,
      expectedDate: newDate,
      scheduleHistory: [
        ...(audit.scheduleHistory || []),
        {
          id: crypto.randomUUID(),
          oldDate: audit.expectedDate,
          newDate,
          changedAt: new Date().toISOString(),
        },
      ],
    };

    onSave(updatedAudit);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg p-6 w-[380px] shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Reschedule Audit</h2>

        <label className="text-sm text-gray-600 block mb-1">
          New Date & Time
        </label>

        <input
          type="datetime-local"
          className="border p-2 rounded-lg w-full"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
