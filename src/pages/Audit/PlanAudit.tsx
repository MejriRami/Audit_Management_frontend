import { useEffect, useMemo, useState } from "react";
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

/**
 * ✅ date-fns-tz compatibility:
 * - old versions: have formatInTimeZone, utcToZonedTime, zonedTimeToUtc
 * - newer versions: have formatInTimeZone, toZonedTime, fromZonedTime
 *
 * Your project has a version where zonedTimeToUtc is missing,
 * so we import "fromZonedTime" if available.
 */
import * as tz from "date-fns-tz";

interface PlanModalProps {
  isAuditModalOpen: boolean;
  closeAuditModalOpen: () => void;
  onAuditCreated?: () => void;
}

interface AuditPlanForm {
  auditeeEmails: string; // comma-separated
  plant: string | null;
  sector: string;
  questionnaireId: string | number | null;
  auditDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
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
  const [errorMessage, setErrorMessage] = useState("");

  /** Plant timezone (anchor) */
  const [plantTz, setPlantTz] = useState<string>("UTC");

  /** Auditor timezone (browser) */
  const auditorTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  /** Auditee timezone (placeholder; later load from profile) */
  const auditeeTz = auditorTz;

  const [form, setForm] = useState<AuditPlanForm>({
    auditeeEmails: "",
    plant: null,
    sector: "",
    questionnaireId: null,
    auditDate: null,
    startTime: null,
    endTime: null,
    hardwareEmail: null,
  });

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

  /** map plant => timezone */
  const plantToTz: Record<string, string> = {
    anhui: "Asia/Shanghai",
    tianjin: "Asia/Shanghai",
    kunshan: "Asia/Shanghai",
    chennai: "Asia/Kolkata",
    daegu: "Asia/Seoul",
    cyclam: "Europe/Paris",
    poitiers: "Europe/Paris",
    frankfort: "Europe/Berlin",
    monterrey: "America/Monterrey",
    galeana: "America/Monterrey",
    rayones: "America/Monterrey",
    nadhour: "Africa/Tunis",
    same: "Africa/Tunis",
    sceet: "Africa/Tunis",
  };

  // ---- Fetch questionnaires ----
  useEffect(() => {
    getQuestionnairesByNames(dispatch);
  }, [dispatch]);

  useEffect(() => {
    setQuestionnaires(questionnaireListName);
  }, [questionnaireListName]);

  /** update plant timezone when plant changes */
  useEffect(() => {
    const p = form.plant ?? "";
    setPlantTz(plantToTz[p] ?? "UTC");
  }, [form.plant]);

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

  /** timezone preview renderer */
  const renderPreview = (label: string, tzName: string, time: Date | null) => {
    if (!time) return null;

    // formatInTimeZone exists in both old/new date-fns-tz
    const fmt = (tz as any).formatInTimeZone as
      | ((d: Date, tz: string, f: string) => string)
      | undefined;

    if (!fmt) {
      // ultra-fallback (shouldn't happen): show local time
      return (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          <span className="font-mono dark:text-gray-200">
            {time.toLocaleString()}
          </span>
        </div>
      );
    }

    return (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-mono dark:text-gray-200">
          {fmt(time, tzName, "EEE HH:mm (zzz)")}
        </span>
      </div>
    );
  };

  /**
   * ✅ Convert Plant "wall-clock" selection to an absolute Date (UTC instant)
   * Works with BOTH old and new date-fns-tz versions:
   * - new: fromZonedTime(localDate, tz)
   * - old: zonedTimeToUtc(localDate, tz)
   */
  const toUtcInstantFromPlantLocal = (plantLocalDate: Date, tzName: string) => {
    const fromZonedTime = (tz as any).fromZonedTime as
      | ((d: Date, tz: string) => Date)
      | undefined;

    const zonedTimeToUtc = (tz as any).zonedTimeToUtc as
      | ((d: Date | string, tz: string) => Date)
      | undefined;

    if (fromZonedTime) return fromZonedTime(plantLocalDate, tzName);
    if (zonedTimeToUtc) return zonedTimeToUtc(plantLocalDate, tzName);

    // last resort fallback: treat given Date as already UTC (not ideal)
    return plantLocalDate;
  };

  /**
   * Build a Date representing "auditDate + time" in Plant local wall-clock,
   * then convert it to a UTC instant.
   */
  const combineDateAndTimeInPlantTz = (
    date: Date,
    time: Date,
    tzName: string
  ) => {
    // Build a LOCAL Date object using numeric parts to avoid string parsing issues
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const hh = time.getHours();
    const mm = time.getMinutes();
    const ss = time.getSeconds();

    // This Date is *not* correct timezone yet; it's just holding wall-clock parts.
    const plantLocalWallClock = new Date(y, m, d, hh, mm, ss);

    // Convert that wall-clock to a UTC instant using date-fns-tz helpers
    return toUtcInstantFromPlantLocal(plantLocalWallClock, tzName);
  };

  // ---- Submit handler ----
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

    if (!user) {
      setErrorMessage("User not found");
      return;
    }

    try {
      const startUtc = combineDateAndTimeInPlantTz(
        form.auditDate,
        form.startTime,
        plantTz
      );
      const endUtc = combineDateAndTimeInPlantTz(
        form.auditDate,
        form.endTime,
        plantTz
      );

      // formatInTimeZone exists across versions
      const fmt = (tz as any).formatInTimeZone as
        | ((d: Date, tz: string, f: string) => string)
        | undefined;

      if (!fmt) {
        throw new Error("date-fns-tz formatInTimeZone not available");
      }

      const payload: AuditPlanCreate = {
        auditee_emails: list,
        auditor_id: user.id,
        plant: form.plant,
        sector: form.sector,
        questionnaire_id: Number(form.questionnaireId),

        // ✅ send Plant-local strings (stable regardless of auditor timezone)
        audit_date: fmt(startUtc, plantTz, "yyyy-MM-dd"),
        start_time: fmt(startUtc, plantTz, "HH:mm:ss"),
        end_time: fmt(endUtc, plantTz, "HH:mm:ss"),

        ...(form.hardwareEmail && { hardware_email: form.hardwareEmail }),
      };

      await dispatch(planAuditThunk(payload)).unwrap();

      toast.success("Audit planned successfully!", { duration: 10000 });

      if (onAuditCreated) onAuditCreated();

      setForm({
        auditeeEmails: "",
        plant: null,
        sector: "",
        questionnaireId: null,
        auditDate: null,
        startTime: null,
        endTime: null,
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
      className="max-w-[900px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Add New Audit Plan
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Date &amp; time are selected in <b>Plant local time</b>. Live
            previews show other timezones.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Form */}
          <div className="lg:col-span-2 space-y-6">
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
                <Label htmlFor="plant">Plant (Anchor)</Label>
                <Select
                  options={plantOptions}
                  placeholder="Select a plant"
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, plant: value }))
                  }
                  className="dark:bg-dark-900"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Plant timezone: <span className="font-mono">{plantTz}</span>
                </div>
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
                  options={
                    questionnaires?.map((q) => ({
                      value: q.id.toString(),
                      label: q.name,
                    })) || []
                  }
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
                label="Audit Date (Plant)"
                value={form.auditDate}
                onChange={(date) =>
                  setForm((prev) => ({ ...prev, auditDate: date }))
                }
              />

              <TimePicker
                label="Start Time (Plant)"
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
                label="End Time (Plant)"
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

            {errorMessage && (
              <div className="p-3 mt-2 text-red-600 bg-red-100 border border-red-300 rounded">
                {errorMessage}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2 modal-footer sm:justify-end">
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

          {/* RIGHT: Time synchronization / timezone previews */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4 dark:border-gray-700">
              <div className="font-semibold mb-2 dark:text-gray-100">
                Live clocks
              </div>
              <div className="space-y-2 text-sm">
                {renderPreview("🏭 Plant", plantTz, new Date())}
                {renderPreview("🧑‍💼 You", auditorTz, new Date())}
                {renderPreview("👤 Auditee", auditeeTz, new Date())}
              </div>
            </div>

            <div className="rounded-lg border p-4 dark:border-gray-700">
              <div className="font-semibold mb-2 dark:text-gray-100">
                Selected start time
              </div>
              <div className="space-y-2">
                {renderPreview("🏭 Plant", plantTz, form.startTime)}
                {renderPreview("🧑‍💼 You", auditorTz, form.startTime)}
                {renderPreview("👤 Auditee", auditeeTz, form.startTime)}
              </div>
            </div>

            {form.endTime && (
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <div className="font-semibold mb-2 dark:text-gray-100">
                  Selected end time
                </div>
                <div className="space-y-2">
                  {renderPreview("🏭 Plant", plantTz, form.endTime)}
                  {renderPreview("🧑‍💼 You", auditorTz, form.endTime)}
                  {renderPreview("👤 Auditee", auditeeTz, form.endTime)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="datepicker-portal"></div>
    </Modal>
  );
}
