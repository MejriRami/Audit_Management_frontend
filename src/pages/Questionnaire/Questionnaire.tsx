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
import {
  deleteQuestionnaire,
  getAllQuestionnaire,
  updateQuestionnaire,
} from "../../api/Questionnaire";
import { Modal } from "../../components/ui/modal";
import { Auditor, Questionnaire } from "../../types";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { TimeIcon } from "../../icons";
import TextArea from "../../components/form/input/TextArea";
import FileInput from "../../components/form/input/FileInput";
//import { getFrameworks } from "../../api/frameworks";
import MultiSelect from "../../components/form/MultiSelect";
import { getAuditors } from "../../api/users";
import ConfirmDialog from "../../components/form/ConfirmDialogProps";
import QuestionsModal from "../../components/Questions.tsx/QuestionsModal";
import { fetchQuestionsByQuestionnaire } from "../../api/questions";
import { fetchAuditTypes } from "../../api/audit_types";
import EditQuestionnaireModal from "../../components/questionnaire/edit-questionnaire";
import { useNavigate } from "react-router";

export default function FormElements() {
  const [loading, setLoading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  // const [modalLoading, setModalLoading] = useState(false);
  const [auditorOptions, setAuditorOptions] = useState<
    { value: string; text: string; selected: boolean }[]
  >([]);
  const [frameworkOptions, setFrameworkOptions] = useState<
    { label: string; value: Number }[]
  >([]);
  const navigate = useNavigate();
  const handleClick = () => {
    // Navigate to the /add-questionnaire route
    navigate("/add-questionnaire");
  };
  const fetchAuditors = async () => {
    const auditors: Auditor[] = await getAuditors();
    const formatted = auditors.map((a) => ({
      text: a.email,
      value: a.email,
      selected: false,
    }));
    console.log("Fetched auditors:", formatted);
    setAuditorOptions(formatted);
  };

  const fetchFrameworks = async () => {
    try {
      const data = await [];
      const formatted = data.map((fw: any) => ({
        label: fw.code, // what is shown in dropdown
        value: fw.id, // what is returned on select
      }));
      setFrameworkOptions(formatted);
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  // Modal handlers
  const openModal = async (questionnaire: any) => {
    // setModalLoading(true);

    // Fetch related questions
    const relatedQuestions = await fetchQuestionsByQuestionnaire(
      questionnaire.id
    );
    // add questions to the questionnaire object
    questionnaire.questions = relatedQuestions;
    setSelectedQuestionnaire(questionnaire);

    // Store them in state for modal rendering
    setQuestions(relatedQuestions);
    setIsModalOpen(true);
    // setModalLoading(false);
  };

  const closeModal = () => {
    setSelectedQuestionnaire(null);
    setIsModalOpen(false);
  };

  // Open edit modal
  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setIsOpen(true);
  };

  // Fetch list of frameworks
  const fetchQuestionnaires = async () => {
    setLoading(true);
    try {
      const data = await getAllQuestionnaire();
      const mapped = data.map((v: any) => ({
        id: v.id,
        name: v.name,
        version: v.version,
        status: v.status,
        framework: v.framework || "", // display code
        framework_id: v.framework_id ? String(v.framework_id) : "", // dropdown value
        type: v.type || "",
        target_duration: v.target_duration || "",
        score_calculation: v.score_calculation || "",
        guideline_file: v.guideline_file || "",
        auditors: v.auditors?.map((a: any) => ({ email: a.email })) || [],
        questions: v.questions || [],
      }));
      setQuestionnaires(mapped);

      console.log("Fetched Questionnaires:", mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Update framework API call
  const handleUpdateQuestionnaire = async (
    questionnaire: QuestionnaireUpdate
  ) => {
    try {
      const {
        id,
        name,
        type,
        version,
        status,
        target_duration,
        guideline_file,
        auditors_emails,
        framework_id,
      } = questionnaire;

      const auditor_emails = auditors_emails?.map((a) => a.email) || [];
      console.log("auditor emails", auditor_emails);

      const payload = {
        name,
        type,
        version,
        status,
        target_duration: target_duration,
        guideline_file,
        auditor_emails,
        framework_id,
      };
      console.log("Payload being sent:", payload);

      await updateQuestionnaire(id, payload);
      fetchQuestionnaires();
      closeEditModal();
    } catch (error) {
      console.error("Error updating questionnaire:", error);
    }
  };

  // Close modal
  const closeEditModal = () => {
    setSelectedQuestionnaire(null);
    setIsOpen(false);
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteQuestionnaire(deleteId);
      fetchQuestionnaires();
    } catch (error) {
      console.error("Error deleting framework:", error);
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const [auditTypeOptions, setAuditTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  //  Fetch questionnaire data
  useEffect(() => {
    fetchQuestionnaires();
    fetchFrameworks();
    fetchAuditTypes().then(setAuditTypeOptions).catch(console.error);

    fetchAuditors();
  }, []);

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
              {loading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Loading Questionnaires...
                </div>
              ) : (
                <Table className="min-w-full border-collapse table-auto">
                  {/* Sticky Header */}
                  <TableHeader className="sticky top-0 z-30 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-[#1C1C1E] dark:via-[#2A2A2C] dark:to-[#111113] border-b border-gray-200 dark:border-white/[0.1]">
                    <TableRow className="divide-x divide-gray-200 dark:divide-white/[0.05]">
                      {[
                        "#ID",
                        "Name",
                        "Version",
                        "Framework",
                        "Type",
                        "Auditors",
                        "Target Duration Time",
                        "Score Calculation",
                        "Guide File",
                        "Actions",
                      ].map((header, index) => {
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
                    {questionnaires.length > 0 ? (
                      questionnaires
                        .slice()
                        .sort((a, b) => a.id - b.id)
                        .map((q) => (
                          <TableRow
                            key={q.id}
                            className="divide-x divide-gray-100 dark:divide-white/[0.05] group hover:bg-blue-50 dark:hover:bg-white/[0.05] transition-colors duration-200"
                          >
                            {/* Sticky ID */}
                            <TableCell className="sticky left-0 z-20 w-[80px] bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {q.id}
                            </TableCell>

                            {/* Sticky Name */}
                            <TableCell className="sticky left-[80px] z-20 w-[250px] bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-4 py-3">
                              <button
                                className="text-gray-700 dark:text-gray-200 hover:underline text-sm font-medium transition-transform duration-200"
                                onClick={() => openModal(q)}
                              >
                                {q.name}
                              </button>
                            </TableCell>

                            {/* Normal Columns */}
                            <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {q.version}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {q.framework?.label}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-sm">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200">
                                {q.type || "N/A"}
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
                              {q.guideFile || "N/A"}
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
                                  onClick={() => openDeleteConfirm(q.id)}
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
              )}
            </div>
          </div>
        </ComponentCard>

        <QuestionsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          questionnaire={selectedQuestionnaire}
        />

        {/* Edit Questionnaire Modal */}
        <EditQuestionnaireModal
          isOpen={isOpen}
          onClose={closeEditModal}
          questionnaire={selectedQuestionnaire}
          frameworkOptions={frameworkOptions}
          auditTypeOptions={auditTypeOptions}
          auditorOptions={auditorOptions}
          setQuestionnaire={setSelectedQuestionnaire}
          onUpdate={handleUpdateQuestionnaire}
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
