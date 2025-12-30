import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteQuestionnaire,
  getQuestionnaires,
} from "../../redux/questionnaire/questionnaire";
import { Questionnaire } from "../../redux/questionnaire/questionnaire-slice-types";
import ConfirmDialog from "../../components/form/ConfirmDialogProps";
import EditQuestionnaireModal from "../../components/questionnaire/edit-questionnaire";
import { getFrameworks } from "../../redux/framework/framework";
import Enum from "../../components/enum/Enum";
import { resetQuestioannairesState } from "../../redux/questionnaire/questionnaire-slice";
import QuestionsModal from "../../components/Questions.tsx/QuestionsModal";

export default function FormElements() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { questionnairesList } = useSelector(
    (state: any) => state.questionnaire
  );

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { frameworkOptions, auditTypeOptions, auditorOptions } = Enum();
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire>({} as Questionnaire);
  const [isModalOpenQuestions, setIsModalOpenQuestions] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const handleClick = () => {
    navigate("/add-questionnaire");
  };

  const openDeleteConfirm = (q: Questionnaire) => {
    setSelectedQuestionnaire(q);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteQuestionnaire(selectedQuestionnaire?.id, dispatch);
    setIsConfirmOpen(false);
  };

  const handleEditQuestionnaire = (q: Questionnaire) => {
    setIsOpen(true);
    setSelectedQuestionnaire(q);
  };

  const closeModalQuestions = () => {
    setIsModalOpenQuestions(false);
  };

  const openModalQuestions = (q: Questionnaire) => {
    setSelectedQuestionnaire(q);
    setIsModalOpenQuestions(true);
  };

  const toggleGroup = (status: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  useEffect(() => {
    getQuestionnaires(dispatch);
    getFrameworks(dispatch);
    dispatch(resetQuestioannairesState());
  }, [dispatch]);

  // Group questionnaires by status
  const groupedQuestionnaires = questionnairesList.reduce(
    (groups: Record<string, Questionnaire[]>, q: Questionnaire) => {
      const status = q.status || "Unknown";
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(q);
      return groups;
    },
    {}
  );

  // Sort groups by priority (only 2 statuses)
  const statusOrder = ["Ready to Use", "Under Revision"];
  const sortedStatuses = Object.keys(groupedQuestionnaires).sort((a, b) => {
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Status color mapping (only 2 statuses)
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        "Ready to Use": {
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "text-green-700 dark:text-green-400",
          border: "border-green-300 dark:border-green-700",
        },
        "Under Revision": {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          text: "text-orange-700 dark:text-orange-400",
          border: "border-orange-300 dark:border-orange-700",
        },
      };
    return (
      colors[status] || {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-300 dark:border-gray-700",
      }
    );
  };

  const renderQuestionnaireRow = (q: Questionnaire, index: number) => (
    <tr
      key={q.id}
      className={`border-b border-gray-100 dark:border-gray-800 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200
        ${
          index % 2 === 0
            ? "bg-white dark:bg-gray-900"
            : "bg-gray-50/30 dark:bg-gray-900/50"
        }`}
    >
      {/* Name - Sticky */}
      <td className="sticky left-0 z-20 px-6 py-5 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
        <button
          className="text-sm font-medium text-[#0073ea] hover:text-[#0060b9] hover:underline transition-colors"
          onClick={() => openModalQuestions(q)}
        >
          {q.name}
        </button>
      </td>

      {/* Version */}
      <td className="px-6 py-5">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {q.version}
        </div>
      </td>

      {/* Framework */}
      <td className="px-6 py-5">
        <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
          <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">
            {q.framework?.code.toUpperCase() || "N/A"}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="px-6 py-5">
        <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
            {q.auditType?.value.replace(/\b\w/g, (char: string) =>
              char.toUpperCase()
            ) || "N/A"}
          </span>
        </div>
      </td>

      {/* Auditors */}
      <td className="px-6 py-5">
        <div className="space-y-1">
          {q.auditors?.length > 0 ? (
            q.auditors.map((p: any) => (
              <div
                key={p.email}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {p.email}
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </div>
      </td>

      {/* Target Duration */}
      <td className="px-6 py-5">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {q.target_duration || "-"}
        </div>
      </td>

      {/* Guide File */}
      <td className="px-6 py-5">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {q.guideline_file || "N/A"}
        </div>
      </td>

      {/* Actions - Sticky */}
      <td className="sticky right-0 z-20 px-6 py-5 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEditQuestionnaire(q)}
            className="px-3 py-1.5 rounded text-xs font-medium text-[#0073ea] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="Edit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => openDeleteConfirm(q)}
            className="px-3 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6 space-y-8 h-screen flex flex-col bg-white dark:bg-gray-950">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />

      {/* Header - Fixed */}
      <div className="flex-shrink-0">
        <button
          onClick={handleClick}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          create a new
        </button>
      </div>

      {/* Table Container - Scrollable */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* Table Wrapper */}
          <div
            className="flex-1 overflow-auto bg-whit dark:bg-gray-950 p-4"
            style={{ minHeight: 0 }}
          >
            {questionnairesList.length > 0 ? (
              <div className="space-y-4">
                {sortedStatuses.map((status) => {
                  const items = groupedQuestionnaires[status].sort(
                    (a: Questionnaire, b: Questionnaire) => a.id - b.id
                  );
                  const isCollapsed = collapsedGroups.has(status);
                  const statusColors = getStatusColor(status);

                  return (
                    <div
                      key={status}
                      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(status)}
                        className={`w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-l-4 ${statusColors.border}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Collapse Icon */}
                          <svg
                            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                              isCollapsed ? "-rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>

                          {/* Status Badge */}
                          <div
                            className={`px-3 py-1.5 rounded-full ${statusColors.bg} border ${statusColors.border}`}
                          >
                            <span
                              className={`text-sm font-semibold ${statusColors.text}`}
                            >
                              {status}
                            </span>
                          </div>

                          {/* Count */}
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {items.length}{" "}
                            {items.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </button>

                      {/* Group Content */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isCollapsed ? "max-h-0" : "max-h-[10000px]"
                        }`}
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            {/* Table Header (only show for first group or always) */}
                            <thead className="bg-[#f6f7fb] dark:bg-gray-800">
                              <tr>
                                <th className="sticky left-0 z-30 text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-[#f6f7fb] dark:bg-gray-800 min-w-[300px]">
                                  Name
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[120px]">
                                  Version
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[150px]">
                                  Framework
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[150px]">
                                  Type
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[250px]">
                                  Auditors
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[180px]">
                                  Target Duration
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[200px]">
                                  Guide File
                                </th>
                                <th className="sticky right-0 z-30 text-center px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-[#f6f7fb] dark:bg-gray-800 min-w-[160px]">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {items.map((q: Questionnaire, index: number) =>
                                renderQuestionnaireRow(q, index)
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                  <svg
                    className="w-16 h-16 mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-1">
                    No questionnaires yet
                  </p>
                  <p className="text-sm">Click "create a new" to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuestionsModal
        isOpen={isModalOpenQuestions}
        onClose={closeModalQuestions}
        questionnaire={selectedQuestionnaire}
      />

      <EditQuestionnaireModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedQuestionnaire={selectedQuestionnaire}
        frameworkOptions={frameworkOptions}
        auditTypeOptions={auditTypeOptions}
        auditorOptions={auditorOptions}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Questionnaire"
        message="Are you sure you want to delete this Questionnaire? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
