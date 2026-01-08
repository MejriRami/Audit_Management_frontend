import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isError?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isError = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999 backdrop-blur-[2px]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {isError ? (
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          ) : (
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
              <svg
                className="w-6 h-6 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}
        </div>

        <h2
          className={`text-lg font-semibold text-center mb-2 ${
            isError
              ? "text-red-600 dark:text-red-400"
              : "text-gray-800 dark:text-white"
          }`}
        >
          {title}
        </h2>
        <p
          className={`text-center mb-6 ${
            isError
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {message}
        </p>

        <div className="flex justify-end space-x-3">
          {!isError && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-opacity ${
              isError
                ? "bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                : "bg-gradient-to-r from-[#F68C1F] to-[#EF7807] dark:from-[#B55A00] dark:to-[#8A4600] hover:opacity-90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
