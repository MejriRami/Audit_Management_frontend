import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerOnlyProps {
  id: string;
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function DatePickerOnly({
  id,
  label,
  value,
  onChange,
}: DatePickerOnlyProps) {
  const normalizeDate = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // prevents day-1 issue
    return d;
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <DatePicker
        id={id}
        selected={value ? normalizeDate(value) : null}
        onChange={(date) => onChange(normalizeDate(date))}
        minDate={new Date()}
        dateFormat="dd/MM/yyyy"
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-200"
        portalId="datepicker-portal"
      />
    </div>
  );
}
