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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "../common/Spinner";
import { resetQuestioannairesState } from "../../redux/questionnaire/questionnaire-slice";

type AnySelectValue =
  | string
  | number
  | { value: string | number; label?: string }
  | null
  | undefined;

const getSelectRawValue = (v: AnySelectValue) =>
  typeof v === "object" && v !== null && "value" in v ? v.value : v;

const toIntOrNull = (v: AnySelectValue) => {
  const raw = getSelectRawValue(v);
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const toStringOrEmpty = (v: AnySelectValue) => {
  const raw = getSelectRawValue(v);
  return raw === null || raw === undefined ? "" : String(raw);
};

// Ensures backend time format "HH:MM:SS"
const normalizeDuration = (t?: string) => {
  if (!t) return "";
  // input type="time" typically returns "HH:MM"
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return t;
};

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

  const { toast, loading, error } = useSelector(
    (state: any) => state.questionnaire
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = useMemo(
    () => [
      { label: "Ready to Use", value: "Ready to Use" },
      { label: "Under Revision", value: "Under Revision" },
    ],
    []
  );

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formQuestionnaire?.name?.trim())
      newErrors.name = "Questionnaire name is required";

    if (!formQuestionnaire?.framework_id)
      newErrors.framework_id = "Framework is required";

    if (!formQuestionnaire?.type_id)
      newErrors.type_id = "Audit type is required";

    if (!formQuestionnaire?.status?.trim())
      newErrors.status = "Status is required";

    if (!formQuestionnaire?.version || Number(formQuestionnaire.version) < 1)
      newErrors.version = "Version must be at least 1";

    if (!formQuestionnaire?.target_duration)
      newErrors.target_duration = "Target duration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formQuestionnaire]);

  const backToQuestionnaire = useCallback(
    () => navigate("/questionnaire"),
    [navigate]
  );

  const handleQuestionnaireSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      if (!validateForm()) return;

      const adjustedFormQuestionnaire = {
        ...formQuestionnaire,

        framework_id: toIntOrNull(formQuestionnaire.framework_id) ?? undefined,
        type_id: toIntOrNull(formQuestionnaire.type_id) ?? undefined,

        status: String(formQuestionnaire.status || "").trim(),

        target_duration: normalizeDuration(formQuestionnaire.target_duration),

        auditor_emails: (formQuestionnaire.auditors ?? [])
          .map((a: any) => a?.email)
          .filter(Boolean),
      };

      await addQuestionnaire(adjustedFormQuestionnaire, dispatch);
    },
    [dispatch, formQuestionnaire, loading, validateForm]
  );
  useEffect(() => {
    dispatch(resetQuestioannairesState());
  }, [dispatch]);
  useEffect(() => {
    if (toast === "Questionnaire added successfully") {
      const t = setTimeout(() => {
        dispatch(resetQuestioannairesState());
        navigate("/questionnaire");
      }, 800);

      return () => clearTimeout(t);
    }
  }, [toast, dispatch, navigate]);

  return (
    <div className="p-6 space-y-8">
      <PageMeta title="Questionnaire" description="..." />
      <PageBreadcrumb pageTitle="Questionnaire" />

      <div className="max-w-3xl mx-auto my-6">
        <div className="mb-4">
          <Button
            onClick={backToQuestionnaire}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-white font-medium transition bg-indigo-600 hover:opacity-70 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Back To Questionnaire List
          </Button>
        </div>

        <ComponentCard
          title="Add a Questionnaire"
          className="dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
        >
          <form onSubmit={handleQuestionnaireSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Questionnaire Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  disabled={loading}
                  type="text"
                  id="name"
                  value={formQuestionnaire.name}
                  onChange={(e: any) => {
                    clearError("name");
                    handleInputValue(e);
                  }}
                  name="name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Framework */}
              <div className="space-y-2">
                <Label>
                  Select Framework <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={frameworkOptions}
                  disabled={loading}
                  onChange={(value: AnySelectValue) => {
                    clearError("framework_id");
                    handleSelectChange("framework_id", toIntOrNull(value));
                  }}
                />
                {errors.framework_id && (
                  <p className="text-sm text-red-500">{errors.framework_id}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2 md:col-span-2">
                <Label>
                  Select Audit Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={auditTypeOptions}
                  placeholder="Select a Type"
                  disabled={loading}
                  onChange={(value: AnySelectValue) => {
                    clearError("type_id");
                    handleSelectChange("type_id", toIntOrNull(value));
                  }}
                  className="dark:bg-dark-900"
                />
                {errors.type_id && (
                  <p className="text-sm text-red-500">{errors.type_id}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={statusOptions}
                  disabled={loading}
                  onChange={(value: AnySelectValue) => {
                    clearError("status");
                    handleSelectChange("status", toStringOrEmpty(value));
                  }}
                />
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>

              {/* Version */}
              <div className="space-y-2">
                <Label htmlFor="version">
                  Version <span className="text-red-500">*</span>
                </Label>
                <Input
                  disabled={loading}
                  type="number"
                  id="version"
                  placeholder="1"
                  min="1"
                  value={formQuestionnaire.version}
                  onChange={(e: any) => {
                    clearError("version");
                    handleInputValue(e);
                  }}
                  name="version"
                  className={errors.version ? "border-red-500" : ""}
                />
                {errors.version && (
                  <p className="text-sm text-red-500">{errors.version}</p>
                )}
              </div>

              {/* Target Duration */}
              <div className="space-y-2">
                <Label htmlFor="tm">
                  Target Duration Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    disabled={loading}
                    type="time"
                    id="tm"
                    value={formQuestionnaire.target_duration}
                    onChange={(e: any) => {
                      clearError("target_duration");
                      handleInputValue(e);
                    }}
                    name="target_duration"
                    className={errors.target_duration ? "border-red-500" : ""}
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <TimeIcon className="size-6" />
                  </span>
                </div>
                {errors.target_duration && (
                  <p className="text-sm text-red-500">
                    {errors.target_duration}
                  </p>
                )}
              </div>

              {/* Auditors (optional) */}
              <div className="space-y-2">
                <MultiSelectAuditors
                  label="Auditors (optional)"
                  options={auditorOptions.map((a: any) => ({
                    value: String(a.value),
                    text: a.label,
                  }))}
                  defaultSelected={
                    formQuestionnaire?.auditors?.map((a: any) =>
                      String(a.id)
                    ) ?? []
                  }
                  onChange={(selectedIds) =>
                    handleMultiSelectInput("auditors", selectedIds)
                  }
                />
              </div>

              {/* Submit */}
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-white font-medium transition bg-indigo-600 hover:opacity-70 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="text-white" />
                      Saving...
                    </span>
                  ) : (
                    "Add Questionnaire"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {toast && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {toast}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
