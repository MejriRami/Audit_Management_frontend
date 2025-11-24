import React from "react";

interface ReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const ReasonModal: React.FC<ReasonModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [text, setText] = React.useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
        <h2 className="text-lg font-semibold mb-3">Reason Required</h2>

        <textarea
          className="w-full rounded-md border p-2 text-sm dark:bg-gray-700"
          rows={4}
          placeholder="Enter reason for rejection..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-3 py-1 rounded-md bg-blue-600 text-white"
            onClick={() => {
              if (text.trim().length > 0) {
                onSubmit(text);
                setText("");
              }
            }}
          >
            Submit Reason
          </button>
        </div>
      </div>
    </div>
  );
};
