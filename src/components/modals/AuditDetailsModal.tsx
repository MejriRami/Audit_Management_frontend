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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full p-6 overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Audit #{audit.id} Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Framework and Entity Info */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Framework : {audit.framework}
            </h3>
            {/* <p>{audit.framework} v{audit.questionnaire.version}</p> */}
          </div>

          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Entity : {audit.entity}
            </h3>
            {/* <p></p> */}
            {/* {audit.entity.label} ({audit.entity.code}) */}
            {/* {audit.entity} */}
          </div>

          {/* Sessions */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Sessions:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              {audit.sessions?.map((session, index) => (
                <li key={index}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(session.start_time).toLocaleString()} -{" "}
                    {new Date(session.end_time).toLocaleString()}
                  </p>
                </li>
              )) || ""}
            </ul>
          </div>

          {/* Participants */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Participants:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              {audit.participants.map((participant, index) => (
                <li key={index}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {participant.user.email} -
                    <span className="font-semibold text-blue-500">
                      {" "}
                      {participant.local_role}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions & Responses */}
          {/* Questions & Responses */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Questions & Answers:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              {audit.questions_and_responses?.length ? (
                audit.questions_and_responses.map((q, index) => (
                  <li key={index}>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Question: {q.description}
                    </p>{" "}
                    {/* Display the question */}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Criticality: {q.criticality}{" "}
                      {/* Display the criticality */}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Response: {q.response} {/* Display the response */}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No questions and responses recorded.
                </p>
              )}
            </ul>
          </div>

          {/* Findings */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Findings:
            </h3>

            <ul className="list-disc pl-6 space-y-2">
              {audit.findings?.length ? (
                audit.findings?.map((f, index) => (
                  <li key={index}>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Finding Type: {f.finding_type}{" "}
                      {/* Use finding_type from backend */}
                    </p>
                    {f.corrective_action && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Corrective Action: {f.corrective_action}{" "}
                        {/* Now it’s a string, not an object */}
                        {f.corrective_action_status && (
                          <>
                            {" "}
                            {/* Conditionally style based on corrective_action_status */}
                            <span
                              className={`font-semibold ${
                                f.corrective_action_status === "in_progress"
                                  ? "text-yellow-500"
                                  : f.corrective_action_status === "completed"
                                  ? "text-green-500"
                                  : f.corrective_action_status === "pending"
                                  ? "text-blue-500"
                                  : "text-gray-500"
                              }`}
                            >
                              ({f.corrective_action_status})
                            </span>{" "}
                          </>
                        )}
                      </p>
                    )}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No findings recorded.</p>
              )}{" "}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailsModal;
