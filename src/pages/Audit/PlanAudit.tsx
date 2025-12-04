import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import { DatePickerOnly } from "../../components/calendar/DatePickerOnly";
import { TimePicker } from "../../components/calendar/TimePicker";
import Select from "../../components/form/Select";
import { useEffect, useState } from "react";
import { getAllQuestionnaireNames } from "../../api/Questionnaire";
import { QuestionnaireList } from "../../types";
import { AuditPlanCreate } from "../../api/audit";

interface PlanModalProps {
  isAuditModalOpen: boolean;
  closeAuditModalOpen: () => void;
  auditorOptions: {
    value: string;
    text: string;
    selected: boolean;
  }[];
}

interface AuditPlanForm {
  auditeeEmail: string;
  plant: string | null;
  sector: string;
  questionnaireId: string | null;
  auditDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  // auditors: string[]; // store selected auditor emails
}

export default function PlanAudit({
  isAuditModalOpen,
  closeAuditModalOpen,
}: PlanModalProps) {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireList[]>([]);
  const [form, setForm] = useState<AuditPlanForm>({
    auditeeEmail: "",
    plant: null,
    sector: "",
    questionnaireId: null,
    auditDate: null,
    startTime: null,
    endTime: null,
    // auditors: [],
  });

  // Fetch questionnaires
  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const data = await getAllQuestionnaireNames();
        setQuestionnaires(data);
      } catch (error) {
        console.error("Failed to fetch questionnaires", error);
      }
    };
    fetchQuestionnaires();
  }, []);

  // Validate time
  useEffect(() => {
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      alert("End time must be AFTER start time.");
      setForm((prev) => ({ ...prev, endTime: null }));
    }
  }, [form.startTime, form.endTime]);

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

  const handleSubmit = async () => {
    console.log(form);
    //   if (!form.auditeeEmail  || !form.plant || !form.questionnaireId) {
    //     alert("Please fill all required fields.");
    //     return;
    //   }

    //   try {
    //     // Map auditee email to auditee_id if needed (depends on your backend)
    //     const payload: AuditPlanCreate = {
    //       auditee_id: Number(form.auditeeEmail), // Replace with actual ID mapping
    //       plant: form.plant,
    //       sector: form.sector,
    //       questionnaire_id: form.questionnaireId,
    //       audit_date: form.auditDate,
    //       start_time: form.startTime,
    //       end_time: form.endTime,
    //     };

    //     const result = await planAudit(payload);
    //     console.log("Audit planned successfully:", result);
    //     alert("Audit planned successfully!");
    //     closeAuditModalOpen();
    //   } catch (error) {
    //     console.error("Failed to plan audit:", error);
    //     alert("Failed to plan audit. Check console for details.");
    //   }
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
              <Label htmlFor="auditee">Auditee Email</Label>
              <Input
                type="email"
                id="auditee"
                placeholder="Enter auditee email"
                value={form.auditeeEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, auditeeEmail: e.target.value }))
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
                options={questionnaires.map((q) => ({
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
        </div>

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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
          >
            Add Audit Plan
          </button>
        </div>
      </div>

      {/* Portal for DatePicker */}
      <div id="datepicker-portal"></div>
    </Modal>
  );
}
