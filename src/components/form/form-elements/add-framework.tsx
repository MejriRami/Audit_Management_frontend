import { useState } from "react";
import Label from "../Label";
import Input from "../input/InputField";
import { addFramework } from "../../../api/frameworks";

interface FrameworkProps {
  onAdded?: () => void;
}

export default function Framework({ onAdded }: FrameworkProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddFramework = async () => {
    setLoading(true);
    try {
      const response = await addFramework({ label, code });
      setMessage("✅" + response);
      console.log("API Response:", response);
      // Reset inputs
      setCode("");
      setLabel("");
      // setVersion("");

      // Notify parent
      if (onAdded) onAdded();
    } catch (error) {
      console.error("API Error:", error);
      setMessage(" Failed to add framework. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          type="text"
          id="code"
          placeholder="ex. ISO"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="label">Label</Label>
        <Input
          type="text"
          id="label"
          placeholder="ex. International Organization for Standardization"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <button
        onClick={handleAddFramework}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white font-medium transition ${
          loading || !code || !label
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#F68C1F] to-[#EF7807] hover:from-[#F78F3F] hover:to-[#F47A07] dark:from-[#B55A00] dark:to-[#8A4600]"
        }`}
      >
        {loading ? "Adding..." : "Add"}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.startsWith("✅")
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
