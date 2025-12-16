import ComponentCard from "../common/ComponentCard";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { TimeIcon } from "../../icons";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";
import Select from "../form/Select";
import QuestionnaireInitialForm from "../initialForms/QuestionnaireInitialForm";
import Enum from "../enum/Enum";
import MultiSelectAuditors from "../form/MultiSelectAuditors";
import Button from "../ui/button/Button";
import { addQuestionnaire } from "../../redux/questionnaire/questionnaire";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function AddQuestionnaire() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    formQuestionnaire,
    handleInputValue,
    handleSelectChange,

    handleMultiSelectInput,
  } = QuestionnaireInitialForm();
  const { frameworkOptions, auditTypeOptions, auditorOptions } = Enum();
  const { toast } = useSelector((state: any) => state.questionnaire);

  const handleQuestionnaireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustedFormQuestionnaire = {
      ...formQuestionnaire,
      target_duration: formQuestionnaire.target_duration.endsWith(":00")
        ? formQuestionnaire.target_duration
        : formQuestionnaire.target_duration + ":00",
      auditor_emails: formQuestionnaire.auditors.map((a) => a.email),
    };
    addQuestionnaire(adjustedFormQuestionnaire, dispatch);
  };
  const backToQuestionnaire = () => {
    navigate("/questionnaire");
  };
  useEffect(() => {
    if (toast === "Questionnaire added successfully") {
      setTimeout(() => {
        navigate("/questionnaire");
      }, 1500);
    }
  }, [toast, navigate]);

  return (
    <div className="p-6 space-y-8">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />
      <div className="max-w-3xl mx-auto my-6 ">
        <Button
          className={`px-4 py-2 rounded-lg text-white font-medium transition "bg-gradient-to-r bg-indigo-600 to-indigo-700 hover:opacity-70"`}
          onClick={backToQuestionnaire}
        >
          Back To Questionnaire List
        </Button>
        <div className="md:col-span-2 flex justify-end pt-2"></div>
        <ComponentCard
          title="Add a Questionnaire"
          className="dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
        >
          <form onSubmit={handleQuestionnaireSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-4">
                <Label htmlFor="name">Questionnaire Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter name"
                  value={formQuestionnaire?.name}
                  onChange={handleInputValue}
                  name="name"
                />
              </div>

              {/* Framework */}
              <div className="space-y-4">
                <Label>Select Framework</Label>
                <Select
                  options={frameworkOptions}
                  placeholder="Select a Framework"
                  onChange={(value) =>
                    handleSelectChange("framework_id", value)
                  }
                  className="dark:bg-dark-900"
                />
              </div>

              {/* Type */}
              <div className="space-y-4 md:col-span-2">
                <Label>Select Type</Label>
                <Select
                  options={auditTypeOptions}
                  placeholder="Select a Type"
                  onChange={(value) => handleSelectChange("type_id", value)}
                  className="dark:bg-dark-900"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="status">Statut</Label>
                <Input
                  type="string"
                  id="status"
                  placeholder="Enter status"
                  value={formQuestionnaire?.status}
                  onChange={handleInputValue}
                  name="status"
                />
              </div>

              {/* Version */}
              <div className="space-y-4">
                <Label htmlFor="version">Version</Label>
                <Input
                  type="number"
                  id="version"
                  placeholder="1"
                  min="1"
                  value={formQuestionnaire?.version}
                  onChange={handleInputValue}
                  name="version"
                />
              </div>

              {/* Target Duration */}
              <div className="space-y-4">
                <Label htmlFor="tm">Target Duration Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    id="tm"
                    value={formQuestionnaire?.target_duration}
                    onChange={handleInputValue}
                    name="target_duration"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
              </div>

              {/* Auditors */}
              <div>
                <MultiSelectAuditors
                  label="Auditors"
                  options={auditorOptions.map((a: any) => ({
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

              {/* Score Formula */}
              {/* <div>
                <Label>Score Calculation</Label>
                <TextArea
                  placeholder="Enter your score formula"
                  value={formQuestionnaire.score_calculation}
                  onChange={(e) => handleTextAreaValue("score_calculation", e)}
                  rows={6}
                  name="score_calculation"
                />
              </div> */}

              {/* File Upload */}
              {/* <div>
                <Label>Upload Guideline File</Label>
                <FileInput
                  onChange={handleFileChange}
                  className="custom-class"
                />
                {formData.guidelineFile && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formData.guidelineFile}
                  </p>
                )}
              </div> */}

              {/* Submit Button */}
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button
                  className={`px-4 py-2 rounded-lg text-white font-medium transition "bg-gradient-to-r bg-indigo-600 to-indigo-700 hover:opacity-70"`}
                >
                  Add Questionnaire
                </Button>
              </div>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}
