import { Modal } from "../ui/modal";
import { useState } from "react";
import ConfirmDialog from "../form/ConfirmDialogProps";

interface Question {
  id: number;
  description: string;
  status: string;
  chapter: string;
  qNumber: number;
  weight: number;
  value?: number;
  fail?: number;
  improve?: number;
  pass?: number;
  criticalSuccess?: number;
  score?: number;
  type?: string;
}

interface QuestionnaireType {
  id: number;
  name: string;
  status: string;
  framework: string;
  type: string;
  questions: Question[];
}

interface QuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaire: QuestionnaireType | null;
}

export default function QuestionsModal({
  isOpen,
  onClose,
  questionnaire,
}: QuestionsModalProps) {
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<Partial<Question>>({});

  /** NEW STATE FOR ADDING QUESTIONS */
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});

  /** --- COMMON INPUT HANDLER --- */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedRow((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewQuestion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /** --- EDIT EXISTING QUESTION --- */
  const handleEdit = (row: Question) => {
    setEditRowId(row.id);
    setEditedRow({ ...row });
  };

  const handleSave = () => {
    if (!questionnaire) return;

    const index = questionnaire.questions.findIndex((q) => q.id === editRowId);
    if (index !== -1) {
      questionnaire.questions[index] = editedRow as Question;
    }

    console.log("Updated question:", editedRow);

    setEditRowId(null);
    setEditedRow({});
  };

  const handleCancel = () => {
    setEditRowId(null);
    setEditedRow({});
  };

  /** --- ADD NEW QUESTION --- */
  const handleAddNew = () => {
    setIsAdding(true);
    setNewQuestion({
      id: Date.now(),
      description: "",
      status: "mandatory",
      chapter: "",
      qNumber: (questionnaire?.questions?.length || 0) + 1,
      weight: 1,
      type: "",
    });
  };

  const handleSaveNew = () => {
    if (!questionnaire) return;

    questionnaire.questions.push(newQuestion as Question);

    console.log("New question added:", newQuestion);

    setIsAdding(false);
    setNewQuestion({});
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewQuestion({});
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (!questionnaire || deleteId === null) return;

    questionnaire.questions = questionnaire.questions.filter(
      (q) => q.id !== deleteId
    );

    // Reset edit/add states if needed
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
              {questionnaire?.framework || "N/A"}
            </p>
          </div>

          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Type:
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              {questionnaire?.type || "N/A"}
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
                    #
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Description
                  </th>
                  {/* <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Status
                  </th> */}
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Chapter
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Weight
                  </th>
                  {/* <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Value
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Fail
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Improve
                  </th>
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Pass
                  </th> */}
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Critical
                  </th>
                  {/* <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Score
                  </th> */}
                  <th className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                    Type
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
                      NEW
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        name="description"
                        value={newQuestion.description || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    {/* <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <select
                        name="status"
                        value={newQuestion.status || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="mandatory">Mandatory</option>
                        <option value="not mandatory">Not Mandatory</option>
                      </select>
                    </td> */}
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        name="chapter"
                        value={newQuestion.chapter || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      {newQuestion.qNumber}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="number"
                        name="weight"
                        value={newQuestion.weight || 0}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      —
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                      <input
                        name="type"
                        value={newQuestion.type || ""}
                        onChange={handleNewInputChange}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2 text-center sticky right-0 bg-blue-50 dark:bg-gray-800/40 z-10">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleSaveNew}
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
                    </td>
                  </tr>
                )}

                {questionnaire?.questions?.length ? (
                  questionnaire.questions.map((q, index) => (
                    <tr
                      key={q.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {index + 1}
                      </td>
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
                      {/* <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <select
                            name="status"
                            value={editedRow.status || ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="not mandatory">Not Mandatory</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              q.status?.toLowerCase() === "not mandatory"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : q.status?.toLowerCase() === "mandatory"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : q.status?.toLowerCase() === "improve"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : q.status?.toLowerCase().includes("critical")
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {q.status || "N/A"}
                          </span>
                        )}
                      </td> */}
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
                            value={editedRow.weight || 0}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          q.weight
                        )}
                      </td>
                      {/* <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {q.value}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {q.fail}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {q.improve}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {q.pass}
                      </td> */}
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <input
                            type="number"
                            name="criticalSuccess"
                            value={editedRow.criticalSuccess || ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          q.criticalSuccess
                        )}
                      </td>
                      {/* <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {q.score}
                      </td> */}
                      <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                        {editRowId === q.id ? (
                          <input
                            name="type"
                            value={editedRow.type || ""}
                            onChange={handleInputChange}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          q.type || "—"
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
                              onClick={handleCancel}
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
