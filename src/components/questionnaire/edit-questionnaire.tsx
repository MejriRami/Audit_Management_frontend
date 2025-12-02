import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
// import TextArea from "../form/input/TextArea";
import FileInput from "../form/input/FileInput";
import MultiSelect from "../form/MultiSelect";
import { Questionnaire, QuestionnaireUpdate } from "../../types";
import { TimeIcon } from "../../icons";

interface EditQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaire: Questionnaire | null;
  frameworkOptions: { label: string; value: string }[];
  auditTypeOptions: { label: string; value: string }[];
  auditorOptions: { value: string; text: string; selected: boolean }[];
  onUpdate: (updated: QuestionnaireUpdate) => void;
  setQuestionnaire: React.Dispatch<React.SetStateAction<Questionnaire | null>>;
}

export default function EditQuestionnaireModal({
  isOpen,
  onClose,
  questionnaire,
  frameworkOptions,
  auditTypeOptions,
  auditorOptions,
  onUpdate,
  setQuestionnaire,
}: EditQuestionnaireModalProps) {
  if (!questionnaire) return null;

  const handleUpdate = () => {
    // Convert framework_id to number before sending
    const payload: QuestionnaireUpdate = {
      id: questionnaire.id,
      name: questionnaire.name,
      framework_id: questionnaire.framework_id
        ? Number(questionnaire.framework_id)
        : undefined,
      type: questionnaire.type,
      status: questionnaire.status,
      target_duration: questionnaire.target_duration,
      score_calculation: questionnaire.score_calculation,
      auditors_emails: questionnaire.auditors,
    };

    onUpdate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
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
                value={questionnaire.name}
                onChange={(e) =>
                  setQuestionnaire({ ...questionnaire, name: e.target.value })
                }
              />
            </div>

            {/* FRAMEWORK */}
            <div className="space-y-4">
              <Label>Select Framework</Label>
              <Select
                options={frameworkOptions}
                defaultValue={questionnaire.framework_id || ""}
                onChange={(value) =>
                  setQuestionnaire({ ...questionnaire, framework_id: value })
                }
              />
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <Label>Status</Label>
              <Input
                value={questionnaire.status}
                onChange={(e) =>
                  setQuestionnaire({ ...questionnaire, status: e.target.value })
                }
              />
            </div>

            {/* TYPE */}
            <div className="space-y-4">
              <Label>Select Type</Label>
              <Select
                options={auditTypeOptions}
                defaultValue={questionnaire.type || ""}
                onChange={(e) =>
                  setQuestionnaire({
                    ...questionnaire,
                    type: e,
                  })
                }
              />
            </div>

            {/* TARGET TIME */}
            <div className="space-y-4">
              <Label>Target Duration</Label>
              <div className="relative">
                <Input
                  type="time"
                  value={questionnaire.target_duration}
                  onChange={(e) =>
                    setQuestionnaire({
                      ...questionnaire,
                      target_duration: e.target.value,
                    })
                  }
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
              <MultiSelect
                label="Auditors"
                options={auditorOptions}
                defaultSelected={questionnaire.auditors?.map((a) => a.email)}
                onChange={(selectedEmails) =>
                  setQuestionnaire({
                    ...questionnaire,
                    auditors: selectedEmails.map((email) => ({ email })),
                  })
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

          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded text-white bg-gradient-to-r from-orange-400 to-orange-500"
          >
            Update Questionnaire
          </button>
        </div>
      </div>
    </Modal>
  );
}
