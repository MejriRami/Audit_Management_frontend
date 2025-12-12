import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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

  const headers = [
    "Name",
    "Version",
    "Framework",
    "Type",
    "Auditors",
    "Target Duration Time",
    "Score Calculation",
    "Guide File",
    "Actions",
  ];
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { frameworkOptions, auditTypeOptions, auditorOptions } = Enum();
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire>({} as Questionnaire);
  const [isModalOpenQuestions, setIsModalOpenQuestions] = useState(false);

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

  useEffect(() => {
    getQuestionnaires(dispatch);
    getFrameworks(dispatch);
    dispatch(resetQuestioannairesState());
  }, [dispatch]);

  return (
    <div className="p-6 space-y-8">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClick}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            create a new
          </button>
        </div>
        <ComponentCard title="Questionnaires List">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900 shadow-lg">
            <div className="max-w-full overflow-x-auto relative">
              <Table className="min-w-full border-collapse table-auto">
                <TableHeader className="sticky top-0 z-30 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-[#1C1C1E] dark:via-[#2A2A2C] dark:to-[#111113] border-b border-gray-200 dark:border-white/[0.1]">
                  <TableRow className="divide-x divide-gray-200 dark:divide-white/[0.05]">
                    {headers?.map((header, index) => {
                      let stickyClasses = "";
                      if (index === 0)
                        stickyClasses =
                          "sticky left-0 z-40 w-[80px] shadow-[2px_0_6px_-3px_rgba(0,0,0,0.1)]";
                      else if (index === 1)
                        stickyClasses =
                          "sticky left-[80px] z-40 w-[250px] shadow-[2px_0_6px_-3px_rgba(0,0,0,0.1)]";
                      else if (index === 9)
                        stickyClasses =
                          "sticky right-0 z-40 w-[200px] shadow-[-2px_0_6px_-3px_rgba(0,0,0,0.1)]";

                      return (
                        <TableCell
                          key={header}
                          isHeader
                          className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-[#1C1C1E] dark:via-[#2A2A2C] dark:to-[#111113] ${stickyClasses}`}
                        >
                          {header}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {questionnairesList.length > 0 ? (
                    questionnairesList
                      .slice()
                      .sort((a: Questionnaire, b: Questionnaire) => a.id - b.id)
                      .map((q: Questionnaire) => (
                        <TableRow
                          key={q.id}
                          className="divide-x divide-gray-100 dark:divide-white/[0.05] group hover:bg-blue-50 dark:hover:bg-white/[0.05] transition-colors duration-200"
                        >
                          {/* Sticky ID */}
                          <TableCell className="sticky left-0 z-20 w-[80px] bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            <button
                              className="text-gray-700 dark:text-gray-200 hover:underline text-sm font-medium transition-transform duration-200"
                              onClick={() => openModalQuestions(q)}
                            >
                              {q.name}
                            </button>
                          </TableCell>

                          {/* Sticky Name */}
                          <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {q.version}
                          </TableCell>

                          {/* Normal Columns */}
                          <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {q.framework?.code.toUpperCase()}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200">
                              {q.auditType?.value.replace(
                                /\b\w/g,
                                (char: string) => char.toUpperCase()
                              ) || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {q.auditors?.map((p: any) => (
                              <div
                                key={p.email}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                {p.email}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {q.target_duration}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                            {q.score_calculation}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                            {q.guideline_file || "N/A"}
                          </TableCell>

                          {/* Sticky Actions */}
                          <TableCell className="sticky right-0 z-20 w-[200px] bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                className="px-2 py-1 text-xs bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md shadow hover:scale-105 transition-transform duration-200"
                                onClick={() => handleEditQuestionnaire(q)}
                              >
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 text-xs bg-gradient-to-r from-red-400 to-red-500 text-white rounded-md shadow hover:scale-105 transition-transform duration-200"
                                onClick={() => openDeleteConfirm(q)}
                              >
                                Delete
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <p className="text-gray-500 p-6 text-center">
                          No Questionnaires found.
                        </p>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        <QuestionsModal
          isOpen={isModalOpenQuestions}
          onClose={closeModalQuestions}
          questionnaire={selectedQuestionnaire}
        />

        {/* Edit Questionnaire Modal */}
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
          message="Are you sure you want to delete this Questionnare? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
