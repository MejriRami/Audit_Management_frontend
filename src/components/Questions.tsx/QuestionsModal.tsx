import { Modal } from "../ui/modal";
import { useState, useEffect } from "react";
import ConfirmDialog from "../form/ConfirmDialogProps";
import { Question } from "../../types";
import {
  createQuestion,
  deleteQuestion,
  updateQuestion,
} from "../../api/questions";
import { Questionnaire } from "../../redux/questionnaire/questionnaire-slice-types";

interface QuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaire: Questionnaire | null;
}

export default function QuestionsModal({
  isOpen,
  onClose,
  questionnaire,
}: QuestionsModalProps) {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(
    questionnaire?.questions || []
  );

  useEffect(() => {
    setLocalQuestions(questionnaire?.questions || []);
  }, [questionnaire]);

  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<Partial<Question>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});

  /* UPDATE INPUT */
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setEditedRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewInputChange = (e: any) => {
    const { name, value } = e.target;
    setNewQuestion((prev) => ({ ...prev, [name]: value }));
  };

  /* EDIT QUESTION */
  const handleEdit = (row: Question) => {
    setEditRowId(row.id);
    setEditedRow(row);
  };

  const handleSave = async () => {
    if (!questionnaire || !editRowId) return;

    try {
      await updateQuestion(editRowId, editedRow);

      setLocalQuestions((prev) =>
        prev.map((q) => (q.id === editRowId ? { ...q, ...editedRow } : q))
      );

      setEditRowId(null);
      setEditedRow({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditRowId(null);
    setEditedRow({});
  };

  /* ADD NEW QUESTION */
  const handleAddNew = () => {
    setIsAdding(true);
    setNewQuestion({
      description: "",
      chapter: "",
      weight: 0,
      critical_value: 0,
    });
  };

  const handleSaveNew = async () => {
    if (!questionnaire) return;

    try {
      const created = await createQuestion(newQuestion, questionnaire.id);

      setLocalQuestions((prev) => [...prev, created]);

      setIsAdding(false);
      setNewQuestion({});
    } catch (err: any) {
      console.error("Failed to create question:", err.message);
    }
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewQuestion({});
  };

  /* DELETE QUESTION */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDeleteClick = async (id: number) => {
    setDeleteId(id);
    await deleteQuestion(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;

    setLocalQuestions((prev) => prev.filter((q) => q.id !== deleteId));

    if (editRowId === deleteId) {
      setEditRowId(null);
      setEditedRow({});
    }

    setDeleteId(null);
    setIsConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
    setIsConfirmOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[95vw] !w-full !h-[90vh] !p-0 !m-0"
    >
      <div className="flex flex-col h-[90vh] w-full">
        {/* Header - Fixed */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {questionnaire?.name || "Questionnaire Details"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your questions with ease
              </p>
            </div>
          </div>

          {/* Meta Info - Compact Pills */}
          <div className="flex gap-3 flex-wrap items-center">
            {/* Status Section */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Status:
              </span>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                {questionnaire?.status || "N/A"}
              </span>
            </div>

            {/* Framework Section */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                Framework:
              </span>
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                {questionnaire?.framework?.label.toUpperCase() || "N/A"}
              </span>
            </div>

            {/* Type Section */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Type:
              </span>
              <span className="text-xs font-semibold text-green-900 dark:text-green-300">
                {questionnaire?.auditType?.value || "N/A"}
              </span>
            </div>

            {/* New Question Button */}
            <div className="ml-auto">
              <button
                onClick={handleAddNew}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-lg 
               bg-[#0073ea] hover:bg-[#0060b9] 
               transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <span className="text-lg font-bold">+</span>
                New Question
              </button>
            </div>
          </div>
        </div>

        {/* Table Container - Scrollable */}
        <div
          className="flex-1 bg-white dark:bg-gray-950 p-6 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f6f7fb] dark:bg-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 w-[45%]">
                      Question
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 w-[20%]">
                      Chapter
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 w-[12%]">
                      Weight
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 w-[12%]">
                      Critical
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 w-[11%]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-900">
                  {isAdding && (
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/10 group">
                      <td className="px-6 py-4">
                        <textarea
                          name="description"
                          value={newQuestion.description || ""}
                          onChange={handleNewInputChange}
                          placeholder="Type your question here..."
                          className="w-full min-h-[100px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                   focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                   dark:bg-gray-800 dark:text-white resize-none"
                          required
                        />
                      </td>

                      <td className="px-6 py-4">
                        <input
                          name="chapter"
                          value={newQuestion.chapter || ""}
                          onChange={handleNewInputChange}
                          placeholder="Enter chapter"
                          className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                   focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                   dark:bg-gray-800 dark:text-white"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="number"
                          name="weight"
                          value={newQuestion.weight}
                          onChange={handleNewInputChange}
                          placeholder="0"
                          className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                   focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                   dark:bg-gray-800 dark:text-white"
                          min={0}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="number"
                          name="critical_value"
                          value={newQuestion.critical_value ?? ""}
                          onChange={handleNewInputChange}
                          placeholder="0"
                          className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                   focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                   dark:bg-gray-800 dark:text-white"
                          min={0}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={handleSaveNew}
                            disabled={!newQuestion.description?.trim()}
                            className={`px-4 py-2 rounded-md text-xs font-medium transition-all
                              ${
                                newQuestion.description?.trim()
                                  ? "bg-[#0073ea] text-white hover:bg-[#0060b9]"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }
                            `}
                          >
                            Save
                          </button>

                          <button
                            onClick={handleCancelNew}
                            className="px-4 py-2 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 
                                     text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 
                                     transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {localQuestions?.length ? (
                    localQuestions?.map((q, index) => (
                      <tr
                        key={q.id}
                        className={`border-b border-gray-100 dark:border-gray-800 group hover:bg-[#f4f9ff] dark:hover:bg-gray-800/50 transition-colors
                          ${
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50/30 dark:bg-gray-900/50"
                          }`}
                      >
                        <td className="px-6 py-5">
                          {editRowId === q.id ? (
                            <textarea
                              name="description"
                              value={editedRow.description || ""}
                              onChange={handleInputChange}
                              className="w-full min-h-[100px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                       focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                       dark:bg-gray-800 dark:text-white resize-none"
                            />
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words py-1">
                              {q.description}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {editRowId === q.id ? (
                            <input
                              name="chapter"
                              value={editedRow.chapter || ""}
                              onChange={handleInputChange}
                              className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                       focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                       dark:bg-gray-800 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm text-gray-700 dark:text-gray-300 py-1">
                              {q.chapter || "-"}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {editRowId === q.id ? (
                            <input
                              type="number"
                              name="weight"
                              value={editedRow.weight ?? ""}
                              onChange={handleInputChange}
                              className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                       focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                       dark:bg-gray-800 dark:text-white"
                              min={0}
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1">
                              {q.weight}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {editRowId === q.id ? (
                            <input
                              type="number"
                              name="critical_value"
                              value={editedRow.critical_value ?? ""}
                              onChange={handleInputChange}
                              className="w-full h-[44px] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm
                                       focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] focus:outline-none
                                       dark:bg-gray-800 dark:text-white"
                              min={0}
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1">
                              {q.critical_value}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {editRowId === q.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-md text-xs font-medium bg-[#00c875] text-white 
                                         hover:bg-[#00b36b] transition-all"
                              >
                                Update
                              </button>
                              <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 
                                         text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 
                                         transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(q)}
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
                                onClick={() => handleDeleteClick(q.id)}
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
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
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
                            No questions yet
                          </p>
                          <p className="text-sm">
                            Click "New Question" to add your first question
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Modal>
  );
}
