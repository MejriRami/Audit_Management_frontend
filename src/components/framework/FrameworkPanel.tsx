import { useState } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Panel from "../form/panel";
import FrameworkInitialForm from "../initialForms/FramworkInitialForm";
import Button from "../ui/button/Button";
import { addFramework } from "../../redux/framework/framework";
import { useDispatch } from "react-redux";

interface FrameworkPanelInterface {
  frameworkList: any[];
}

const FrameworkPanel = ({ frameworkList }: FrameworkPanelInterface) => {
  const dispatch = useDispatch();
  const { formFramework, handleInputValue, setFormFramework } =
    FrameworkInitialForm();
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddFramework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const clean = formFramework.label.trim();
    if (!clean) {
      setErrorMsg("❗ Label is required");
      return;
    }

    const exists = frameworkList.some(
      (f: any) => f.label.toLowerCase() === clean.toLowerCase()
    );

    if (exists) {
      setErrorMsg("❗ Framework already exists");
      return;
    }

    const success = await addFramework(formFramework, dispatch);

    if (success) {
      // Reset form on success
      setFormFramework({ label: "", code: "" });
      setErrorMsg("✅ Framework added successfully");
      setTimeout(() => setErrorMsg(""), 3000);
    } else {
      setErrorMsg("❗ Failed to add framework");
    }
  };

  return (
    <>
      <Panel
        title="Add Framework"
        className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
      >
        <form className="space-y-6" onSubmit={handleAddFramework}>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              type="text"
              id="code"
              placeholder="ex. ISO"
              value={formFramework.code}
              onChange={handleInputValue}
              name="code"
            />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              type="text"
              id="label"
              placeholder="ex. International Organization for Standardization"
              value={formFramework.label}
              onChange={handleInputValue}
              name="label"
              required
            />
          </div>
          {errorMsg && (
            <p
              className={`text-sm font-medium ${
                errorMsg.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {errorMsg}
            </p>
          )}
          <Button className="px-4 py-2 rounded-lg text-white font-medium transition bg-gradient-to-r from-[#F68C1F] to-[#EF7807] hover:from-[#F78F3F] hover:to-[#F47A07] dark:from-[#B55A00] dark:to-[#8A4600]">
            Add
          </Button>
        </form>
      </Panel>
    </>
  );
};
export default FrameworkPanel;
