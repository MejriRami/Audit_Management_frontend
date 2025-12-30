import { useState } from "react";
import { Framework } from "../../redux/framework/framework-slice-types";
import { Modal } from "../ui/modal";
import ConfirmDialog from "../form/ConfirmDialogProps";
import FrameworkInitialForm from "../initialForms/FramworkInitialForm";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import {
  deleteFramework,
  updateFramework,
} from "../../redux/framework/framework";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

interface FrameworkSectionProps {
  frameworks: Framework[];
}

const FrameworkSection = ({ frameworks }: FrameworkSectionProps) => {
  const dispatch = useDispatch();
  const [selectedFramework, setSelectedFramework] = useState<any>(null);
  const { formFramework, handleInputValue, setFormFramework } =
    FrameworkInitialForm();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleEdit = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsOpen(true);
    setFormFramework(framework);
  };

  const openDeleteConfirm = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsConfirmOpen(true);
  };

  const closeModal = () => {
    setSelectedFramework(null);
    setIsOpen(false);
  };

  const handleEditSubmit =
    (formFramework: any) => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      updateFramework(selectedFramework.id, formFramework, dispatch);
      closeModal();
      //show success toast
      toast.success("Framework updated successfully");
    };

  const handleConfirmDelete = () => {
    deleteFramework(selectedFramework.id, dispatch);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center justify-between ">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            🧱 Frameworks
          </h2>
        </div>
        {frameworks.length === 0 && (
          <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-gray-900/20 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No frameworks found.
            </p>
          </div>
        )}

        {/* Grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ">
          {frameworks.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border bg-white dark:bg-gray-900 shadow-sm p-6
            flex flex-col justify-between hover:shadow-md transition bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100  dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
            >
              {/* Top */}
              <div className="space-y-1">
                <h3 className="text-md font-normal text-gray-800 dark:text-gray-100">
                  {f.label}
                </h3>
                {/* code badge */}
                <span
                  className="inline-block mt-2 px-3 py-1 text-xs font-medium
              bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 
              rounded-full"
                >
                  {f.code}
                </span>
              </div>
              {/* Actions */}
              <div className="flex items-center mt-6 gap-3">
                <button
                  onClick={() => handleEdit(f)}
                  className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 
                text-blue-600 dark:text-blue-300 font-medium hover:bg-blue-100 
                dark:hover:bg-blue-900/30 transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => openDeleteConfirm(f)}
                  className="px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 
                text-orange-600 dark:text-orange-300 font-medium hover:bg-orange-100 
                dark:hover:bg-orange-900/30 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Modal
        isOpen={isOpen && selectedFramework !== null}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <form
          className="flex flex-col px-2 overflow-y-auto custom-scrollbar"
          onSubmit={handleEditSubmit(formFramework)}
        >
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Edit Framework
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Modify the details of the selected framework.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {/* Label */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Label
              </Label>
              <Input
                type="text"
                value={formFramework?.label || ""}
                onChange={handleInputValue}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                name="label"
              />
            </div>

            {/* Code */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Code
              </Label>
              <input
                type="text"
                value={formFramework?.code || ""}
                onChange={handleInputValue}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                name="code"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              Close
            </button>
            <Button className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg">
              Update Framework
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Framework"
        message="Are you sure you want to delete this Framework? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};

export default FrameworkSection;
