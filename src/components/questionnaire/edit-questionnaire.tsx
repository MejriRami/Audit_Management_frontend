import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { TimeIcon, TrashBinIcon } from "../../icons";
import { Questionnaire } from "../../redux/questionnaire/questionnaire-slice-types";
import QuestionnaireInitialForm from "../initialForms/QuestionnaireInitialForm";
import { useEffect, useState } from "react";
import {
  getQuestionnaireById,
  updateQuestionnaire,
} from "../../redux/questionnaire/questionnaire";
import { useDispatch, useSelector } from "react-redux";
import MultiSelectAuditors from "../form/MultiSelectAuditors";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";

interface EditQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestionnaire: Questionnaire | null;
  frameworkOptions: { label: string; value: string }[];
  auditTypeOptions: { label: string; value: string }[];
  auditorOptions: { label: string; value: string }[];
}

export default function EditQuestionnaireModal({
  isOpen,
  onClose,
  selectedQuestionnaire,
  frameworkOptions,
  auditTypeOptions,
  auditorOptions,
}: EditQuestionnaireModalProps) {
  const dispatch = useDispatch();
  const {
    formQuestionnaire,
    handleInputValue,
    handleSelectChange,
    setFormQuestionnaire,
    handleMultiSelectInput,
  } = QuestionnaireInitialForm();

  const { questionnaire } = useSelector((state: any) => state.questionnaire);
  const { user } = useSelector((state: any) => state.auth); // Get user from auth state

  // File upload state
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [removeGuideline, setRemoveGuideline] = useState(false);
  const [currentGuideline, setCurrentGuideline] = useState<any>(null);

  // Status options
  const statusOptions = [
    { label: "Ready to Use", value: "Ready to Use" },
    { label: "Under Revision", value: "Under Revision" },
  ];

  if (!selectedQuestionnaire) return null;
  useEffect(() => {
    if (isOpen && selectedQuestionnaire?.id) {
      getQuestionnaireById(selectedQuestionnaire.id, dispatch);
    }
  }, [selectedQuestionnaire?.id, dispatch]);

  useEffect(() => {
    if (questionnaire) {
      setFormQuestionnaire(questionnaire);
      // Set current guideline from API response
      if (questionnaire.guideline) {
        setCurrentGuideline(questionnaire.guideline);
      }
      // Reset file state
      setGuidelineFile(null);
      setRemoveGuideline(false);
    }
  }, [questionnaire, setFormQuestionnaire]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setGuidelineFile(file);
    setRemoveGuideline(false); // Reset remove flag when new file is selected
  };

  const handleRemoveGuideline = () => {
    setRemoveGuideline(true);
    setGuidelineFile(null);
    setCurrentGuideline(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleUpdateQuestionnaire = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Check if user is available
    if (!user || !user.id) {
      console.error("User not found in state");
      alert("Please log in again");
      return;
    }

    // Prepare data
    const adjustedFormQuestionnaire = {
      ...formQuestionnaire,
      target_duration: formQuestionnaire.target_duration.endsWith(":00")
        ? formQuestionnaire.target_duration
        : formQuestionnaire.target_duration + ":00",
      auditor_emails: formQuestionnaire.auditors.map((a) => a.email),
    };

    console.log("Updating questionnaire:", adjustedFormQuestionnaire);
    console.log("File:", guidelineFile);
    console.log("Remove guideline:", removeGuideline);
    console.log("User ID:", user.id);

    // Call update with file and user ID
    const success = await updateQuestionnaire(
      formQuestionnaire?.id,
      adjustedFormQuestionnaire,
      guidelineFile,
      removeGuideline,
      dispatch,
      user.id
    );

    if (success) {
      toast.success("Questionnaire updated successfully");

      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <form
        className="flex flex-col px-2 overflow-y-auto custom-scrollbar"
        onSubmit={handleUpdateQuestionnaire}
      >
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 dark:text-white/90 text-2xl">
            Edit Questionnaire
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modify the details of the selected Questionnaire.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* NAME */}
            <div className="space-y-4">
              <Label>Questionnaire Name</Label>
              <Input
                type="text"
                value={formQuestionnaire?.name}
                onChange={handleInputValue}
                name="name"
              />
            </div>

            {/* FRAMEWORK */}
            <div className="space-y-4">
              <Label>Select Framework</Label>
              <Select
                options={frameworkOptions}
                defaultValue={formQuestionnaire?.framework_id}
                onChange={(e: any) => handleSelectChange("framework_id", e)}
              />
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Status
              </Label>
              <Select
                options={statusOptions}
                defaultValue={formQuestionnaire?.status}
                onChange={(value: string) =>
                  handleSelectChange("status", value)
                }
                className="h-11 border-gray-300 dark:border-gray-600 rounded-lg focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea]"
              />
            </div>

            {/* TYPE */}
            <div className="space-y-4">
              <Label>Select Type</Label>
              <Select
                options={auditTypeOptions}
                defaultValue={formQuestionnaire?.type_id || ""}
                onChange={(e: any) => handleSelectChange("type_id", e)}
              />
            </div>

            {/* TARGET TIME */}
            <div className="space-y-4">
              <Label>Target Duration</Label>
              <div className="relative">
                <Input
                  type="time"
                  value={formQuestionnaire?.target_duration}
                  onChange={handleInputValue}
                  name="target_duration"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <TimeIcon className="size-6 text-gray-500" />
                </span>
              </div>
            </div>

            {/* FILE UPLOAD */}
            <div className="space-y-4 col-span-3">
              <Label>Upload Guideline File</Label>

              {/* Current Guideline Display */}
              {currentGuideline && !removeGuideline && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {currentGuideline.filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(currentGuideline.size)} • Uploaded{" "}
                          {currentGuideline.uploaded_at}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {/* <a
                        href={currentGuideline.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <span>⬇️</span>
                        View
                      </a> */}
                      <button
                        type="button"
                        onClick={handleRemoveGuideline}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1"
                      >
                        {" "}
                        <TrashBinIcon className="w-4 h-4" /> Remove{" "}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File Input */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                  />
                </label>
              </div>

              {/* Selected New File Display */}
              {guidelineFile && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {guidelineFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(guidelineFile.size)} • Ready to upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuidelineFile(null)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AUDITORS */}
            <div className="space-y-4 col-span-3">
              <MultiSelectAuditors
                label="Auditors"
                options={auditorOptions.map((a) => ({
                  value: String(a.value),
                  text: a.label,
                }))}
                defaultSelected={
                  formQuestionnaire?.auditors?.map((a) => String(a.id)) ?? []
                }
                onChange={(selectedIds) =>
                  handleMultiSelectInput("auditors", selectedIds)
                }
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-gray-400"
          >
            Close
          </button>

          <Button className="px-4 py-2 rounded text-white bg-gradient-to-r from-orange-400 to-orange-500">
            Update Questionnaire
          </Button>
        </div>
      </form>
    </Modal>
  );
}
