import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
// import TextArea from "../form/input/TextArea";
import FileInput from "../form/input/FileInput";
import { TimeIcon } from "../../icons";
import { Questionnaire } from "../../redux/questionnaire/questionnaire-slice-types";
import QuestionnaireInitialForm from "../initialForms/QuestionnaireInitialForm";
import { useEffect } from "react";
import {
  getQuestionnaireById,
  updateQuestionnaire,
} from "../../redux/questionnaire/questionnaire";
import { useDispatch, useSelector } from "react-redux";
import MultiSelectAuditors from "../form/MultiSelectAuditors";
import Button from "../ui/button/Button";

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
  // Status options - only 2 statuses
  const statusOptions = [
    { label: "Ready to Use", value: "Ready to Use" },
    { label: "Under Revision", value: "Under Revision" },
  ];

  if (!selectedQuestionnaire) return null;

  useEffect(() => {
    if (isOpen && selectedQuestionnaire?.id) {
      getQuestionnaireById(selectedQuestionnaire.id, dispatch);
    }
  }, [selectedQuestionnaire?.id, dispatch, setFormQuestionnaire]);

  useEffect(() => {
    if (questionnaire) {
      setFormQuestionnaire(questionnaire);
    }
  }, [questionnaire, setFormQuestionnaire]);

  const handleUpdateQuestionnaire = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement the update logic here
    const adjustedFormQuestionnaire = {
      ...formQuestionnaire,
      target_duration: formQuestionnaire.target_duration.endsWith(":00")
        ? formQuestionnaire.target_duration
        : formQuestionnaire.target_duration + ":00",
      auditor_emails: formQuestionnaire.auditors.map((a) => a.email),
    };
    console.log(adjustedFormQuestionnaire);
    updateQuestionnaire(
      formQuestionnaire?.id,
      adjustedFormQuestionnaire,
      dispatch
    );
    onClose();
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
            {/* <div className="space-y-4">
              <Label>Status</Label>
              <Input
                value={formQuestionnaire?.status}
                onChange={handleInputValue}
                name="status"
              />
            </div> */}

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

            {/* SCORE FORMULA */}
            {/* <div className="space-y-4 col-span-3">
              <Label>Score Calculation</Label>
              <TextArea
                rows={5}
                value={questionnaire.score_calculation || ""}
                onChange={(value) =>
                  setQuestionnaire({
                    ...questionnaire,
                    score_calculation: value,
                  })
                }
              />
            </div> */}

            {/* FILE */}
            <div className="space-y-4 col-span-3">
              <Label>Upload Guideline File</Label>
              <FileInput />
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
                } // controlled
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
