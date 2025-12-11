import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  selectedDate: Date | null;
  blockedSlots: { start: string; end: string; date: string }[];
  compareTime?: Date | null;
  mode?: "start" | "end";
}

export function TimePicker({
  label,
  value,
  onChange,
  selectedDate,
  blockedSlots,
  compareTime,
  mode = "start",
}: TimePickerProps) {
  if (!selectedDate) {
    return (
      <div className="flex flex-col space-y-2 w-full opacity-50">
        <label className="text-sm">{label}</label>
        <input
          disabled
          className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-700"
          placeholder="Select date first"
        />
      </div>
    );
  }

  const buildTime = (h: number, m: number) => {
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  const minTime = buildTime(7, 0);
  const maxTime = buildTime(18, 0);

  const strToDate = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return buildTime(h, m);
  };

  const isBlocked = (time: Date) => {
    const day = selectedDate.toLocaleDateString("en-CA");

    return blockedSlots.some((slot) => {
      if (slot.date !== day) return false;

      const start = strToDate(slot.start);
      const end = strToDate(slot.end);

      return time >= start && time < end;
    });
  };

  const isInvalidCompare = (time: Date) => {
    if (!compareTime) return false;
    if (mode === "start") return time >= compareTime;
    if (mode === "end") return time <= compareTime;
    return false;
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <label className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <DatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={60}
        timeFormat="HH:mm"
        dateFormat="HH:mm"
        minTime={minTime}
        maxTime={maxTime}
        filterTime={(t) => !isBlocked(t) && !isInvalidCompare(t)}
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-200"
        portalId="datepicker-portal"
      />
    </div>
  );
}
