import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { DatePickerOnly } from "../../components/calendar/DatePickerOnly";
import { TimePicker } from "../../components/calendar/TimePicker";
import Select from "../../components/form/Select";

import { getQuestionnairesByNames } from "../../redux/questionnaire/questionnaire";
import { QuestionnairesNames } from "../../redux/questionnaire/questionnaire-slice-types";

import { AppDispatch, RootState } from "../../redux/store";
import { AuditPlanCreate } from "../../redux/audit/audit-types";
import { planAuditThunk } from "../../redux/audit/audit-slice";
import toast from "react-hot-toast";

interface PlanModalProps {
  isAuditModalOpen: boolean;
  closeAuditModalOpen: () => void;

  // you technically don’t need this anymore for Redux-based update,
  // but keep it optional if some other place still passes it
  onAuditCreated?: () => void;
}

interface AuditPlanForm {
  auditeeEmails: string; // comma-separated string from input
  plant: string | null;
  sector: string;
  questionnaireId: string | number | null;
  auditDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  auditorEmail: string | null;
  hardwareEmail?: string | null;
}

export default function PlanAudit({
  isAuditModalOpen,
  closeAuditModalOpen,
  onAuditCreated,
}: PlanModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { questionnaireListName } = useSelector(
    (state: RootState) => state.questionnaire
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const planningLoading = useSelector(
    (state: RootState) => state.audit.planningLoading
  );

  const [questionnaires, setQuestionnaires] = useState<QuestionnairesNames[]>();

  const [form, setForm] = useState<AuditPlanForm>({
    auditeeEmails: "",
    plant: null,
    sector: "",
    questionnaireId: null,
    auditDate: null,
    startTime: null,
    endTime: null,
    auditorEmail: user?.email ?? "",
    hardwareEmail: null,
  });

  const [errorMessage, setErrorMessage] = useState("");

  // ---- Static Options ----
  const plantOptions = [
    { value: "anhui", label: "Anhui" },
    { value: "chennai", label: "Chennai" },
    { value: "cyclam", label: "Cyclam" },
    { value: "daegu", label: "Daegu" },
    { value: "frankfort", label: "Frankfort" },
    { value: "galeana", label: "Galeana" },
    { value: "kunshan", label: "Kunshan" },
    { value: "monterrey", label: "Monterrey" },
    { value: "nadhour", label: "Nadhour" },
    { value: "poitiers", label: "Poitiers" },
    { value: "rayones", label: "Rayones" },
    { value: "same", label: "Same" },
    { value: "sceet", label: "Sceet" },
    { value: "tianjin", label: "Tianjin" },
  ];

  const glasses = [
    {
      value: "RemoteEye.CN-Anhui@avocarbon.com",
      label: "RemoteEye.CN-Anhui@avocarbon.com",
    },
    {
      value: "RemoteEye.CN-Tianjin@avocarbon.com",
      label: "RemoteEye.CN-Tianjin@avocarbon.com",
    },
    {
      value: "RemoteEye.DE-Frankfort@avocarbon.com",
      label: "RemoteEye.DE-Frankfort@avocarbon.com",
    },
    {
      value: "RemoteEye.FR-Cyclam@avocarbon.com",
      label: "RemoteEye.FR-Cyclam@avocarbon.com",
    },
    {
      value: "RemoteEye.FR-Poitiers@avocarbon.com",
      label: "RemoteEye.FR-Poitiers@avocarbon.com",
    },
    {
      value: "RemoteEye.IN-Chennai@avocarbon.com",
      label: "RemoteEye.IN-Chennai@avocarbon.com",
    },
    {
      value: "RemoteEye.MX-Galeana@avocarbon.com",
      label: "RemoteEye.MX-Galeana@avocarbon.com",
    },
    {
      value: "RemoteEye.MX-Monterrey@avocarbon.com",
      label: "RemoteEye.MX-Monterrey@avocarbon.com",
    },
    {
      value: "RemoteEye.MX-Rayones@avocarbon.com",
      label: "RemoteEye.MX-Rayones@avocarbon.com",
    },
    {
      value: "RemoteEye.TN-Nadhour@avocarbon.com",
      label: "RemoteEye.TN-Nadhour@avocarbon.com",
    },
    {
      value: "RemoteEye.TN-SameTunisie@avocarbon.com",
      label: "RemoteEye.TN-SameTunisie@avocarbon.com",
    },
    {
      value: "RemoteEye.TN-SCEET@avocarbon.com",
      label: "RemoteEye.TN-SCEET@avocarbon.com",
    },
    {
      value: "RemoteEye.TN-STS@avocarbon.com",
      label: "RemoteEye.TN-STS@avocarbon.com",
    },
    {
      value: "RemoteEye.KR-Daegu@avocarbon.com",
      label: "RemoteEye.KR-Daegu@avocarbon.com",
    },
  ];

  const blockedSlots = [
    { date: "2025-11-20", start: "08:00", end: "09:00" },
    { date: "2025-11-20", start: "09:00", end: "10:00" },
    { date: "2025-11-20", start: "10:00", end: "11:00" },
    { date: "2025-11-20", start: "11:00", end: "12:00" },
    { date: "2025-11-20", start: "12:00", end: "13:00" },
    { date: "2025-11-20", start: "13:00", end: "14:00" },
    { date: "2025-11-20", start: "14:00", end: "15:00" },
    { date: "2025-11-20", start: "15:00", end: "16:00" },
    { date: "2025-11-20", start: "16:00", end: "17:00" },
    { date: "2025-11-19", start: "08:00", end: "09:00" },
  ];

  // ---- Fetch questionnaires from Redux thunk ----
  useEffect(() => {
    getQuestionnairesByNames(dispatch);
  }, [dispatch]);

  useEffect(() => {
    setQuestionnaires(questionnaireListName);
  }, [questionnaireListName]);

  // ---- Validate end time > start time ----
  useEffect(() => {
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      alert("End time must be AFTER start time.");
      setForm((prev) => ({ ...prev, endTime: null }));
    }
  }, [form.startTime, form.endTime]);

  // ---- Email validation ----
  const validateEmails = (emails: string) => {
    const list = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "");

    const isValid = list.every((email) =>
      /^[^\s@]+@avocarbon\.com$/.test(email)
    );

    return { isValid, list };
  };

  // ---- Submit handler (Redux) ----
  const handleSubmit = async () => {
    setErrorMessage("");

    if (
      !form.auditeeEmails ||
      !form.plant ||
      !form.questionnaireId ||
      !form.auditDate ||
      !form.startTime ||
      !form.endTime
    ) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    const { isValid, list } = validateEmails(form.auditeeEmails);

    if (!isValid) {
      setErrorMessage("All emails must end with @avocarbon.com");
      return;
    }

    try {
      const formattedDate = form.auditDate.toISOString().split("T")[0];
      const formatTime = (d: Date) =>
        d.toLocaleTimeString("en-GB", { hour12: false });

      const payload: AuditPlanCreate = {
        auditee_emails: list,
        auditor_id: user.id,
        plant: form.plant!,
        sector: form.sector,
        questionnaire_id: Number(form.questionnaireId),
        audit_date: formattedDate,
        start_time: formatTime(form.startTime!),
        end_time: formatTime(form.endTime!),
        ...(form.hardwareEmail && { hardware_email: form.hardwareEmail }),
      };

      // dispatch thunk; unwrap throws if rejected
      await dispatch(planAuditThunk(payload)).unwrap();

      toast.success("Audit planned successfully!", {
        duration: 10000, // 8 seconds
      });

      // optional callback if parent still passes it
      if (onAuditCreated) {
        onAuditCreated();
      }

      // reset form if you want
      setForm({
        auditeeEmails: "",
        plant: null,
        sector: "",
        questionnaireId: null,
        auditDate: null,
        startTime: null,
        endTime: null,
        auditorEmail: user?.email ?? "",
        hardwareEmail: null,
      });

      closeAuditModalOpen();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        (typeof err === "string" ? err : "Failed to plan audit.");

      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isAuditModalOpen}
      onClose={closeAuditModalOpen}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Add New Audit Plan
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in the details for the new Audit Plan.
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="auditees">Auditee Email(s)</Label>
              <Input
                type="text"
                id="auditees"
                placeholder="Enter emails separated by commas"
                value={form.auditeeEmails}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    auditeeEmails: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="plant">Plant</Label>
              <Select
                options={plantOptions}
                placeholder="Select a plant"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, plant: value }))
                }
                className="dark:bg-dark-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="sector">Sector</Label>
              <Input
                placeholder="Enter sector name"
                value={form.sector}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sector: e.target.value }))
                }
                className="dark:bg-dark-900"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="questionnaire">Questionnaire</Label>
              <Select
                options={questionnaires?.map((q) => ({
                  value: q.id.toString(),
                  label: q.name,
                }))}
                placeholder="Select a questionnaire"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, questionnaireId: value }))
                }
                className="dark:bg-dark-900"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DatePickerOnly
              id="auditDate"
              label="Audit Date"
              value={form.auditDate}
              onChange={(date) =>
                setForm((prev) => ({ ...prev, auditDate: date }))
              }
              blockedSlots={blockedSlots}
            />

            <TimePicker
              label="Start Time"
              value={form.startTime}
              onChange={(time) =>
                setForm((prev) => ({ ...prev, startTime: time }))
              }
              selectedDate={form.auditDate}
              blockedSlots={blockedSlots}
              compareTime={form.endTime}
              mode="start"
            />

            <TimePicker
              label="End Time"
              value={form.endTime}
              onChange={(time) =>
                setForm((prev) => ({ ...prev, endTime: time }))
              }
              selectedDate={form.auditDate}
              blockedSlots={blockedSlots}
              compareTime={form.startTime}
              mode="end"
            />
          </div>

          {/* Hardware */}
          <div className="space-y-4">
            <Label htmlFor="hardware">Hardware</Label>
            <Select
              options={glasses}
              placeholder="Select a hardware email"
              onChange={(value) =>
                setForm((prev) => ({ ...prev, hardwareEmail: value }))
              }
              className="dark:bg-dark-900"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mt-4 text-red-600 bg-red-100 border border-red-300 rounded">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
          <button
            onClick={closeAuditModalOpen}
            type="button"
            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={planningLoading}
            className={`px-4 py-2 text-white rounded-lg ${
              planningLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600"
            }`}
          >
            {planningLoading ? "Processing..." : "Add Audit Plan"}
          </button>
        </div>
      </div>

      {/* Portal for DatePicker */}
      <div id="datepicker-portal"></div>
    </Modal>
  );
}
