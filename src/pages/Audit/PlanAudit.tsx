import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import { DatePickerOnly } from "../../components/calendar/DatePickerOnly";
import { TimePicker } from "../../components/calendar/TimePicker";
import Select from "../../components/form/Select";
import { useEffect, useState } from "react";

interface PlanModalProps {
  isAuditModalOpen: boolean;
  closeAuditModalOpen: () => void;
  auditorOptions: {
    value: string;
    text: string;
    selected: boolean;
  }[];
  // questionnaire: QuestionnaireType | null;
}

export default function PlanAudit({
  isAuditModalOpen,
  closeAuditModalOpen,
  auditorOptions,
}: // questionnaire,
PlanModalProps) {
  const [auditDate, setAuditDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Example of reserved slots for specific days
  const blockedSlots = [
    { date: "2025-11-20", start: "08:00", end: "09:00" },
    { date: "2025-11-20", start: "09:00", end: "10:00" },
    { date: "2025-11-20", start: "10:00", end: "11:00" },
    { date: "2025-11-20", start: "11:00", end: "12:00" },
    { date: "2025-11-20", start: "12:00", end: "13:00" },
    { date: "2025-11-20", start: "13:00", end: "14:00" },
    { date: "2025-11-20", start: "14:00", end: "15:00" },
    { date: "2025-11-20", start: "15:00", end: "16:00" },
    { date: "2025-11-20", start: "16:00", end: "17:00" }, // fully booked
    { date: "2025-11-19", start: "08:00", end: "09:00" }, // partially booked
  ];

  useEffect(() => {
    if (startTime && endTime && endTime <= startTime) {
      alert("End time must be AFTER start time.");
      setEndTime(null);
    }
  }, [startTime, endTime]);
  const plantOptions = [
    { value: "Plant A", label: "Plant A" },
    { value: "Plant B", label: "Plant B" },
    { value: "Plant C", label: "Plant C" },
  ];
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
            {/* Auditee Email */}
            <div className="space-y-4">
              <Label htmlFor="auditee">Auditee Email</Label>
              <Input
                type="email"
                id="auditee"
                placeholder="Enter auditee email"
              />
            </div>

            {/* Auditors Select */}
            <div className="space-y-4">
              <MultiSelect
                label="Auditors"
                options={auditorOptions}
                placeholder="Select an auditor"
              />
            </div>
          </div>
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DatePickerOnly
              id="auditDate"
              label="Audit Date"
              value={auditDate}
              onChange={setAuditDate}
              blockedSlots={blockedSlots} // disable fully booked days
            />

            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
              selectedDate={auditDate}
              blockedSlots={blockedSlots}
              compareTime={endTime}
              mode="start"
            />

            <TimePicker
              label="End Time"
              value={endTime}
              onChange={setEndTime}
              selectedDate={auditDate}
              blockedSlots={blockedSlots}
              compareTime={startTime}
              mode="end"
            />
          </div>
          {/* Plant Select */}{" "}
          <div className="space-y-4">
            {" "}
            <Label htmlFor="plant">Plant</Label>{" "}
            <Select
              options={plantOptions}
              placeholder="Select a plant" // value={auditPlan.plant || ""} // onChange={(value) => // setAuditPlan((prev) => ({ ...prev, plant: value })) // }
              onChange={() => {
                console.log();
              }}
              className="dark:bg-dark-900"
            />{" "}
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
            className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
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
