import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerOnlyProps {
  id: string;
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  blockedSlots: { start: string; end: string; date: string }[];
}

export function DatePickerOnly({
  id,
  label,
  value,
  onChange,
  blockedSlots,
}: DatePickerOnlyProps) {
  // Disable fully booked days
  const isDayDisabled = (date: Date) => {
    const day = date.toLocaleDateString("en-CA"); // ✔ LOCAL TIME "YYYY-MM-DD"

    // working hours 8 → 17
    const workingHours = Array.from({ length: 9 }, (_, i) => i + 8);
    const hoursCovered = new Set<number>();

    blockedSlots
      .filter((slot) => slot.date === day)
      .forEach((slot) => {
        const [startH] = slot.start.split(":").map(Number);
        const [endH] = slot.end.split(":").map(Number);

        for (let h = startH; h < endH; h++) {
          hoursCovered.add(h);
        }
      });

    // Disable if all hours are covered
    return workingHours.every((h) => hoursCovered.has(h));
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <DatePicker
        id={id}
        selected={value}
        onChange={onChange}
        minDate={new Date()}
        filterDate={(d) => !isDayDisabled(d)}
        dateFormat="dd/MM/yyyy"
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-200"
        portalId="datepicker-portal"
      />
    </div>
  );
}
