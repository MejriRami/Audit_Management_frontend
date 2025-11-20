 import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AddQuestionnaire from "../../components/form/form-elements/add-questionnaire";
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
  getAllQuestionnaireVersions,
  updateQuestionnaire,
} from "../../api/Questionnaire";
import { Modal } from "../../components/ui/modal";
import { Auditor, Questionnaire } from "../../types";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { TimeIcon } from "../../icons";
import TextArea from "../../components/form/input/TextArea";
import FileInput from "../../components/form/input/FileInput";
import { getFrameworks } from "../../api/frameworks";
import MultiSelect from "../../components/form/MultiSelect";
import { getAuditors } from "../../api/users";
import Select from "../../components/form/Select";
import ConfirmDialog from "../../components/form/ConfirmDialogProps";
import QuestionsModal from "../../components/Questions.tsx/QuestionsModal";
// TEMP MOCK QUESTIONS
export const mockQuestions = [
  {
    id: 1,
    description: "Does the facility maintain required safety controls?",
    status: "mandatory",
    chapter: "Safety",
    qNumber: 1,
    weight: 5,
    itemId: "A-101",
    value: 0,
    fail: 0,
    improve: 0,
    pass: 0,
    criticalSuccess: 15,
    score: 0,
    type: "General",
  },
  {
    id: 2,
    description: "Are all employees trained on equipment operation?",
    status: "not mandatory",
    chapter: "Training",
    qNumber: 2,
    weight: 2,
    itemId: "B-200",
    value: 0,
    fail: 0,
    improve: 0,
    pass: 0,
    criticalSuccess: 7,
    score: 0,
    type: "Process",
  },
  {
    id: 3,
    description: "Is critical documentation updated monthly?",
    status: "mandatory",
    chapter: "P6.Process Analytics and production",
    qNumber: 3,
    weight: 10,
    itemId: "D-310",
    value: 0,
    fail: 0,
    improve: 0,
    pass: 0,
    criticalSuccess: 25,
    score: 0,
    type: "Compliance",
  },
];

export default function FormElements() {
  const [loading, setLoading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const [auditorOptions, setAuditorOptions] = useState<
    { value: string; text: string; selected: boolean }[]
  >([]);

  //  Fetch questionnaire data
  useEffect(() => {
    fetchQuestionnaires;
    fetchQuestionnaires();
    fetchAuditors();
    fetchFrameworks();
  }, []);
  const fetchFrameworks = async () => {
    try {
      const data = await getFrameworks();
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
  const openModal = (questionnaire: any) => {
    setSelectedQuestionnaire(questionnaire);
    setIsModalOpen(true);
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
  // Update framework API call
  const handleUpdateQuestionnaire = async (questionnaire: Questionnaire) => {
    try {
      const {
        id,
        name,
        type,
        version_no,
        status,
        target_duration,
        score_calculation,
        guideline_file,
        auditors,
        framework,
      } = questionnaire;

      const auditor_emails = auditors?.map((a) => a.email) || [];
      console.log("auditor emails", auditor_emails);
      //  Normalize target_duration
      let formattedDuration = target_duration;
      if (formattedDuration && formattedDuration.length === 5) {
        // convert "HH:MM" → "HH:MM:00"
        formattedDuration = `${formattedDuration}:00`;
      }

      const payload = {
        name,
        type,
        version_no,
        status,
        target_duration: formattedDuration,
        guideline_file,
        score_calculation,
        auditor_emails,
        framework,
      };
      console.log("Payload being sent:", payload);

      await updateQuestionnaire(id, payload);
      fetchQuestionnaires();
      closeEditModal();
    } catch (error) {
      console.error("Error updating questionnaire:", error);
    }
  };

  // Fetch list of frameworks
  const fetchQuestionnaires = async () => {
    setLoading(true);
    try {
      const data = await getAllQuestionnaireVersions();
      const mapped = data.map((v: any) => ({
        id: v.id,
        name: v.name,
        version_no: v.version_no,
        status: v.status,
        framework: v.framework || "",
        type: v.type || "",
        target_duration: v.target_duration || "",
        score_calculation: v.score_calculation || "",
        auditors: v.auditors || [],
        // 👇 Attach mock questions temporarily
        questions: mockQuestions,
      }));
      setQuestionnaires(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Callback to refresh after adding new
  const handleFrameworkAdded = () => {
    fetchQuestionnaires();
  };

  // Close modal
  const closeEditModal = () => {
    setSelectedQuestionnaire(null);
    setIsOpen(false);
  };

  type CellType =
    | "process"
    | "Internal System"
    | "machines"
    | "Health, Safety and Environment"
    | "Standard Respect"
    | "Usage of Glasses";
  const typeStyles: Record<CellType, string> = {
    process: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700",
    "Internal System":
      "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700",
    machines: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800",
    "Health, Safety and Environment":
      "bg-gradient-to-r from-red-100 to-red-200 text-red-700",
    "Standard Respect":
      "bg-gradient-to-r from-green-100 to-green-200 text-green-700",
    "Usage of Glasses":
      "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700",
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

  const auditTypeOptions = [
    { value: "process", label: "Process" },
    { value: "Internal System", label: "Internal System" },
    { value: "machines", label: "Machines" },
    {
      value: "Health, Safety and Environment",
      label: "Health, Safety and Environment",
    },
    { value: "Standard Respect", label: "Standard Respect" },
    { value: "Usage of Glasses", label: "Usage of Glasses" },
  ];

  const [frameworkOptions, setFrameworkOptions] = useState<
    { label: string; value: string }[]
  >([]);
  return (
    <div className="p-6 space-y-8">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />
      <div className="max-w-3xl mx-auto my-6">
        <AddQuestionnaire onAdded={handleFrameworkAdded} />
      </div>
      <ComponentCard title="Questionnaires List">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900 shadow-sm">
          <div className="max-w-full overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Loading Questionnaires...
              </div>
            ) : (
              <Table className="min-w-full border-collapse">
                {/* Sticky Header */}
                <TableHeader className="sticky top-0 z-30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1C1C1E] dark:to-[#111113] border-b border-gray-200 dark:border-white/[0.1]">
                  <TableRow className="divide-x divide-gray-200 dark:divide-white/[0.05]">
                    {[
                      "#ID",
                      "Name",
                      "Version",
                      "Framework",
                      "Type",
                      "Valid Auditors",
                      "Target Duration Time",
                      "Score Calculation",
                      "Guide File",
                      "Actions",
                    ].map((header, index) => {
                      // Sticky positions for left/right columns
                      const stickyClasses =
                        index === 0
                          ? "sticky left-0 z-40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                          : index === 1
                          ? "sticky left-[80px] z-40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                          : index === 9
                          ? "sticky right-0 z-40 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                          : "";

                      return (
                        <TableCell
                          key={header}
                          isHeader
                          className={`px-6 py-3 text-left text-sm font-normal text-gray-700 dark:text-gray-300  tracking-wide bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1C1C1E] dark:to-[#111113] ${stickyClasses}`}
                        >
                          {header}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {questionnaires.length > 0 ? (
                    questionnaires.map((q) => (
                      <TableRow
                        key={q.id}
                        className="divide-x divide-gray-100 dark:divide-white/[0.05] group hover:bg-blue-50 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        {/* Sticky ID column */}
                        <TableCell className="sticky left-0 z-20 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-6 py-3 text-sm text-gray-500 dark:text-gray-400 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          {q.id}
                        </TableCell>

                        {/* Sticky Name column */}
                        <TableCell className="sticky left-[80px] z-20 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <button
                            className="text-orange-400 hover:underline px-4 py-2 min-w-[250px] whitespace-normal text-sm"
                            onClick={() => openModal(q)}
                          >
                            {q.name}
                          </button>
                        </TableCell>

                        {/* Normal columns */}
                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {q.version_no}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {q.framework}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm font-normal text-gray-800 dark:text-gray-100">
                          <span
                            className={`inline-flex items-center justify-center px-6 py-2 rounded-full text-xs font-normal capitalize tracking-wide shadow-sm
                ${
                  q.type && typeStyles.hasOwnProperty(q.type)
                    ? typeStyles[q.type as CellType]
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }
                transition-all duration-200 hover:scale-105`}
                          >
                            {q.type || "N/A"}
                          </span>
                        </TableCell>

                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col gap-1">
                            {q.auditors?.map((p: any) => (
                              <div
                                key={p.email}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                {p.email}
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {q.target_duration}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                          {q.score_calculation}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                          {q.guideFile || "N/A"}
                        </TableCell>

                        {/* Sticky Actions column */}
                        <TableCell className="sticky right-0 z-20 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-white/[0.05] px-6 py-3 text-center shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex justify-center gap-3">
                            <button
                              className="px-2.5 py-1.5 text-sm bg-gradient-to-r from-[#0584CE] to-[#046EAF] dark:from-[#035C91] dark:to-[#023C64] text-white rounded-md"
                              onClick={() => handleEditQuestionnaire(q)}
                            >
                              Edit
                            </button>

                            <button
                              className="px-2.5 py-1.5 text-sm bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-md dark:from-[#B55A00] dark:to-[#8A4600]"
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
                        <p className="text-gray-500 p-4">
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

      <Modal
        isOpen={isOpen && selectedQuestionnaire !== null}
        onClose={closeEditModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Edit Questionnaire
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Modify the details of the selected Questionnaire.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="name">Questionnaire Name</Label>
                <Input
                  type="text"
                  value={selectedQuestionnaire?.name || ""}
                  onChange={(e) =>
                    setSelectedQuestionnaire((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>Select Framework</Label>
                <Select
                  options={frameworkOptions}
                  placeholder="Select a Framework"
                  defaultValue={selectedQuestionnaire?.framework || ""}
                  onChange={(e) => {
                    setSelectedQuestionnaire((prev) =>
                      prev ? { ...prev, framework: e } : prev
                    );
                  }}
                  className="dark:bg-dark-900"
                />
              </div>

              {/* type */}

              <div className="space-y-4 md:col-span-2">
                <Label>Select Type</Label>
                <Select
                  options={auditTypeOptions}
                  placeholder="Select a Type"
                  defaultValue={selectedQuestionnaire?.type || ""}
                  onChange={(value) =>
                    setSelectedQuestionnaire((prev) =>
                      prev ? { ...prev, type: value } : prev
                    )
                  }
                  className="dark:bg-dark-900"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="name">Version</Label>
                <Input
                  type="number"
                  value={selectedQuestionnaire?.version_no || ""}
                  onChange={(e) =>
                    setSelectedQuestionnaire((prev) =>
                      prev
                        ? { ...prev, version_no: parseInt(e.target.value) }
                        : prev
                    )
                  }
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="tm">Target Duration Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    id="tm"
                    value={
                      selectedQuestionnaire?.target_duration
                        ? selectedQuestionnaire.target_duration.padStart(8, "0") // ensures 02:00:00 not 2:00:00
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedQuestionnaire((prev) =>
                        prev
                          ? { ...prev, target_duration: e.target.value }
                          : prev
                      )
                    }
                  />

                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
              </div>
              <div>
                <MultiSelect
                  label="Valid Auditors"
                  options={auditorOptions}
                  defaultSelected={
                    selectedQuestionnaire?.auditors?.map((a) => a.email) || []
                  }
                  onChange={(selectedEmails: string[]) => {
                    setSelectedQuestionnaire((prev) =>
                      prev
                        ? {
                            ...prev,
                            // store auditors as array of { email: string }
                            auditors: selectedEmails.map((email) => ({
                              email,
                            })),
                          }
                        : prev
                    );
                  }}
                />
              </div>
              <div>
                <Label>Score Calculation</Label>
                <TextArea
                  placeholder="Enter your score formula"
                  value={selectedQuestionnaire?.score_calculation || ""}
                  onChange={(value: string) =>
                    setSelectedQuestionnaire((prev) =>
                      prev ? { ...prev, score_calculation: value } : prev
                    )
                  }
                  rows={6}
                />
              </div>

              <div>
                <Label>Upload Guide Line file</Label>
                <FileInput
                  // onChange={handleFileChange}
                  className="custom-class"
                  // value={selectedQuestionnaire?.file || ""}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeEditModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={() => handleUpdateQuestionnaire(selectedQuestionnaire!)}
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
            >
              Update Questionnaire
            </button>
          </div>
        </div>
      </Modal>
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
  );
}
