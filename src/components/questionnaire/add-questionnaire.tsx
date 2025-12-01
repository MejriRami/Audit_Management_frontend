import { useEffect, useState } from "react";
import ComponentCard from "../common/ComponentCard.tsx";
import Label from "../form/Label.tsx";
import Input from "../form/input/InputField.tsx";
import Select from "../form/Select.tsx";
import { TimeIcon } from "../../icons/index.ts";
import MultiSelect from "../form/MultiSelect.tsx";
import TextArea from "../form/input/TextArea.tsx";
import FileInput from "../form/input/FileInput.tsx";
import { AddQuestionnaire as addQuestionnaireAPI } from "../../api/Questionnaire.ts";
import { getFrameworks } from "../../api/frameworks.ts";
// import { getAuditors } from "../../../api/users.ts";
// import { Auditor } from "../../../types.ts";
import PageMeta from "../common/PageMeta.tsx";
import PageBreadcrumb from "../common/PageBreadCrumb.tsx";
import { fetchAuditTypes, SelectOption } from "../../api/audit_types.ts";

interface QuestionnaireProps {
  onAdded?: () => void;
}

export default function AddQuestionnaire({ onAdded }: QuestionnaireProps) {
  // ---------- Form State ----------
  const [formData, setFormData] = useState({
    name: "",
    framework: "",
    type_id: "",
    duration: "",
    auditors: [] as string[],
    scoreFormula: "",
    guidelineFile: null as string | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [auditTypeOptions, setAuditTypeOptions] = useState<SelectOption[]>([]);

  const [frameworkOptions, setFrameworkOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [auditorOptions, setAuditorOptions] = useState<
    { value: string; text: string; selected: boolean }[]
  >([]);
  // Fetch list of frameworks
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

  // const fetchAuditors = async () => {
  //   const auditors: Auditor[] = await getAuditors();
  //   const formatted = auditors.map((a) => ({
  //     text: a.email,
  //     value: a.email,
  //     selected: false,
  //   }));
  //   console.log("Fetched auditors:", formatted);
  //   setAuditorOptions(formatted);
  // };

  // Load data on mount
  useEffect(() => {
    fetchFrameworks();
    // fetchAuditors();
    fetchAuditTypes().then(setAuditTypeOptions).catch(console.error);
  }, []);

  // ---------- Handlers ----------
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleChange("guidelineFile", file ? file.name : null);
  };

  const handleAuditorsChange = (selected: string[]) => {
    setFormData((prev) => ({ ...prev, auditors: selected }));
  };
  const isFormValid =
    formData.name !== "" &&
    formData.framework !== "" &&
    formData.type_id !== "" &&
    formData.duration !== "";

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    if (!isFormValid) {
      setError("⚠️ Please fill in all required fields before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formattedDuration = formData.duration.includes(":")
        ? `${formData.duration}:00`
        : "02:00:00";

      const payload = {
        questionnaire_id: formData.framework,
        name: formData.name,
        framework_id: formData.framework,
        type_id: formData.type_id,
        status: "under revision",
        target_duration: formattedDuration,
        score_calculation: formData.scoreFormula,
        guideline_file: formData.guidelineFile || "",
        auditor_emails: formData.auditors,
        questions: [],
      };

      await addQuestionnaireAPI(payload);
      console.log("Questionnaire added:", payload);
      if (onAdded) onAdded();

      setMessage("Questionnaire added successfully!");

      // 🔥 Reset form but keep "Add" button enabled for new entry
      setFormData({
        name: "",
        framework: "",
        type_id: "",
        duration: "",
        auditors: [],
        scoreFormula: "",
        guidelineFile: null,
      });
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(` ${err.response.data.detail}`);
      } else {
        setError(`⚠️ ${err.message || "Unexpected error"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  //  && formData.auditors.length > 0;
  // ---------- Render ----------
  return (
    <div className="p-6 space-y-8">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />
      <div className="max-w-3xl mx-auto my-6 ">
        <ComponentCard
          title="Add a Questionnaire"
          className="
 
  dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800
"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-4">
                <Label htmlFor="name">Questionnaire Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              {/* Framework */}
              <div className="space-y-4">
                <Label>Select Framework</Label>
                <select
                  className="w-full p-2 rounded-md border dark:bg-dark-900"
                  value={formData.framework}
                  onChange={(e) => handleChange("framework", e.target.value)}
                >
                  <option value="">Select a Framework</option>
                  {frameworkOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-4 md:col-span-2">
                <Label>Select Type</Label>
                <select
                  className="w-full p-2 rounded-md border dark:bg-dark-900"
                  value={formData.type_id}
                  onChange={(e) => handleChange("type_id", e.target.value)}
                >
                  <option value="">Select a Type</option>
                  {auditTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auditors */}
              <div className="space-y-4">
                <MultiSelect
                  label="Auditors"
                  options={auditorOptions}
                  defaultSelected={[]}
                  onChange={handleAuditorsChange}
                />
              </div>

              {/* Target Duration */}
              <div className="space-y-4">
                <Label htmlFor="tm">Target Duration Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    id="tm"
                    value={formData.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
              </div>

              {/* Score Formula */}
              <div>
                <Label>Score Calculation</Label>
                <TextArea
                  placeholder="Enter your score formula"
                  value={formData.scoreFormula}
                  onChange={(value) => handleChange("scoreFormula", value)}
                  rows={6}
                />
              </div>

              {/* File Upload */}
              <div>
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
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition 
    ${
      !isFormValid || isSubmitting
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r bg-indigo-600 to-indigo-700 hover:opacity-70"
    }`}
                >
                  {isSubmitting ? "Submitting..." : "Add Questionnaire"}
                </button>
              </div>

              {/* Messages */}
              {message && (
                <div className="md:col-span-2 text-green-600 font-medium mt-2">
                  ✅ {message}
                </div>
              )}
              {error && (
                <div className="md:col-span-2 text-red-600 font-medium mt-2">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}
