import React from "react";
import { Audit } from "../../types";

// Props interface
interface AuditDetailsModalProps {
  audit?: Audit;
  onClose: () => void;
}

const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({
  audit,
  onClose,
}) => {
  if (!audit) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full p-6 overflow-y-auto max-h-[70vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Audit #{audit.id} Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Framework
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {audit.framework || "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Entity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {audit.entity || "N/A"}
            </p>
          </div>
        </div>

        {/* Sessions & Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Sessions
            </h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {audit.sessions?.length ? (
                audit.sessions.map((session, idx) => (
                  <li key={idx}>
                    {new Date(session.start_time).toLocaleString()} -{" "}
                    {new Date(session.end_time).toLocaleString()}
                  </li>
                ))
              ) : (
                <li>No sessions recorded.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Participants
            </h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {audit.participants?.length ? (
                audit.participants.map((p, idx) => (
                  <li key={idx}>
                    {p.user.email} -{" "}
                    <span className="font-semibold text-blue-500">
                      {p.local_role}
                    </span>
                  </li>
                ))
              ) : (
                <li>No participants recorded.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Questions & Findings */}
        <div className="space-y-4">
          {audit.questions_and_responses?.length ? (
            audit.questions_and_responses.map((q, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
              >
                {/* Question */}
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Q{idx + 1}: {q.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Criticality: {q.criticality || "N/A"}
                </p>

                {/* Response */}
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Response:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {q.response || "No response provided"}
                  </p>
                </div>

                {/* Findings */}
                {audit.findings
                  ?.filter((f) => f.question_id === q.id)
                  .map((f, fIdx) => (
                    <div key={fIdx} className="mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Finding:
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {f.finding_type}
                      </p>

                      {/* Corrective Actions */}
                      {f.corrective_action && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Corrective Action: {f.corrective_action}{" "}
                          {f.corrective_action_status && (
                            <span
                              className={`font-semibold ${
                                f.corrective_action_status === "Pending"
                                  ? "text-blue-500"
                                  : f.corrective_action_status === "Submitted"
                                  ? "text-yellow-500"
                                  : f.corrective_action_status === "Accepted"
                                  ? "text-green-500"
                                  : f.corrective_action_status === "Rejected"
                                  ? "text-red-500"
                                  : f.corrective_action_status === "Completed"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              ({f.corrective_action_status})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">
              No questions and responses recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditDetailsModal;
