import { Label } from "recharts";
import Panel from "../form/panel";
import Input from "../form/input/InputField";
import { useState } from "react";
import AuditTypeInitialForm from "../initialForms/AuditTypeInitialForm";
import { addAuditTypes } from "../../redux/auditType/auditType";
import { useDispatch } from "react-redux";
import Button from "../ui/button/Button";

interface AuditType {
    id: string;
    value: string;
}

interface AuditTypePanelProps {
    auditTypes: AuditType[];
}

const AuditTypePanel = ({
    auditTypes,
}: AuditTypePanelProps) => {
   const dispatch = useDispatch();
   const [errorMsg, setErrorMsg] = useState<string>("");
   const { handleInputValue, auditTypeForm } = AuditTypeInitialForm();

   const handleAddAuditType = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const clean = auditTypeForm.value.trim();
    if (!clean) return;

    // case insensitive duplicate check
    const exists = auditTypes.some(
      (t) => t.value.toLowerCase() === clean.toLowerCase()
    );

    if (exists) {
      setErrorMsg("❗ This audit type already exists.");
      return;
    }

    addAuditTypes(auditTypeForm, dispatch);
  };

   return (
        <Panel
            title="Add Audit Type"
            className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                <form className="space-y-6" onSubmit={handleAddAuditType}>
                    <div className="space-y-2">
                        <Label>Audit Code</Label>
                        <Input
                        placeholder="e.g. Machines"
                        value={auditTypeForm.value}
                        onChange={handleInputValue}
                        className="w-full"
                        name="value"
                        />
                    </div>
                    {errorMsg && (
                        <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
                    )}
                    <Button
                        className={`
                            w-full py-3 rounded-xl font-semibold text-white transition bg-gradient-to-r from-orange-400 to-orange-500 hover:brightness-110`}
                    >
                        Add Type
                    </Button>
                </form>
        </Panel>
    )
};

export default AuditTypePanel;