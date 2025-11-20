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
  // Build time based on selected date
  const buildTime = (date: Date | null, h: number, m: number) => {
    if (!date) return null;
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  const minTime = buildTime(selectedDate, 8, 0);
  const maxTime = buildTime(selectedDate, 17, 0);

  // Convert "HH:mm" to Date matching selected day
  const strToDate = (base: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Block booked times
  const isBlocked = (time: Date) => {
    if (!selectedDate) return false;

    const day = selectedDate.toLocaleDateString("en-CA"); // ✔ FIXED

    return blockedSlots.some((slot) => {
      if (slot.date !== day) return false;

      const start = strToDate(selectedDate, slot.start);
      const end = strToDate(selectedDate, slot.end);
      return time >= start && time <= end;
    });
  };

  // Validate start < end and end > start
  const isInvalidAfterComparison = (time: Date) => {
    if (!compareTime) return false;

    if (mode === "start") return time >= compareTime; // start < end
    if (mode === "end") return time <= compareTime; // end > start

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
        minTime={minTime!}
        maxTime={maxTime!}
        filterTime={(time) =>
          !isBlocked(time) && !isInvalidAfterComparison(time)
        }
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-200"
        portalId="datepicker-portal"
      />
    </div>
  );
}
