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
        prev.map((q) =>
          q.id === editRowId ? { ...q, ...editedRow } : q
        )
      );

      setEditRowId(null);
      setEditedRow({});
    } catch (err) {
      console.error(err);
    }
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
      className="max-w-[900px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div>
          <h2 className="mb-2 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
            {questionnaire?.name || "Questionnaire Details"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review the data and related questions for this questionnaire.
          </p>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {questionnaire?.status || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Framework:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {questionnaire?.framework?.label.toUpperCase() || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Type:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {questionnaire?.auditType?.value || "N/A"}
            </p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Questions
          </h3>

          {/* ADD QUESTION BUTTON */}
          <button
            onClick={handleAddNew}
            className="mb-3 px-3 py-1.5 text-sm text-white rounded 
           bg-gradient-to-r from-[#0584CE] to-[#046EAF] 
           dark:from-[#035C91] dark:to-[#023C64] 
           hover:opacity-90"
          >
            + Add Question
          </button>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800/70">
                <tr>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Chapter
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Weight
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Critical
                  </th>
                  <th className="px-4 py-2 text-center sticky right-0 bg-gray-100 dark:bg-gray-800/70 z-20">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isAdding && (
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-800/40">
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        name="description"
                        value={newQuestion.description || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </td>

                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        name="chapter"
                        value={newQuestion.chapter || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>

                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="number"
                        name="weight"
                        value={newQuestion.weight}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="number"
                        name="critical_value"
                        value={newQuestion.critical_value ?? ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                        min={0}
                      />
                    </td>

                    <td className="px-4 py-2 text-center sticky right-0 bg-blue-50 dark:bg-gray-800/40 z-10">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleSaveNew}
                          disabled={!newQuestion.description?.trim()}
                          className={`px-4 py-2 rounded
    ${
      newQuestion.description?.trim()
        ? "text-green-600 hover:text-green-800"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }
  `}
                        >
                          Save
                        </button>

                        <button
                          onClick={handleCancelNew}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {localQuestions?.length ? (
                  localQuestions?.map((q) => (
                    <tr
                      key={q.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700 min-w-[250px]">
                        {editRowId === q.id ? (
                          <input
                            name="description"
                            value={editedRow.description || ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          q.description
                        )}
                      </td>

                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <input
                            name="chapter"
                            value={editedRow.chapter || ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          q.chapter
                        )}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <input
                            type="number"
                            name="weight"
                            value={editedRow.weight ?? ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                            min={0}
                          />
                        ) : (
                          q.weight
                        )}
                      </td>

                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <input
                            type="number"
                            name="critical_value"
                            value={editedRow.critical_value ?? ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                            min={0}
                          />
                        ) : (
                          q.critical_value
                        )}
                      </td>

                      <td className="px-4 py-2 text-center sticky right-0 bg-white dark:bg-gray-800 z-10">
                        {editRowId === q.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleSave}
                              className="text-green-600 hover:text-green-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelNew}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(q)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(q.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No questions available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
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
