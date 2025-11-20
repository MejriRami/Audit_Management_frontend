import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Framework from "../../components/form/form-elements/add-framework";

import { Framework as FrameworkType } from "../../types";
import {
  getFrameworks,
  updateFramework,
  deleteFramework,
} from "../../api/frameworks";
import { Modal } from "../../components/ui/modal";
import ConfirmDialog from "../../components/form/ConfirmDialogProps";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Panel from "../../components/form/panel";

export default function FrameworkElements() {
  const [frameworks, setFrameworks] = useState<FrameworkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] =
    useState<FrameworkType | null>(null);
  const [auditCode, setAuditCode] = useState("");
  // Generate stable color from string
  const getColorForType = (str: string) => {
    const colors = [
      "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100",
      "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100",
      "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100",
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100",
      "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100",
      "bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-100",
      "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100",
      "bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-100",
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const [errorMsg, setErrorMsg] = useState("");

  // Audit Types are simple strings

  // const auditTypeOptions = [
  //   { value: "process", label: "Process" },
  //   { value: "Internal System", label: "Internal System" },
  //   { value: "machines", label: "Machines" },
  //   {
  //     value: "Health, Safety and Environment",
  //     label: "Health, Safety and Environment",
  //   },
  //   { value: "Standard Respect", label: "Standard Respect" },
  //   { value: "Usage of Glasses", label: "Usage of Glasses" },
  // ];
  const auditTypeOptions = [
    "process",
    "Internal System",
    "machines",
    "Usage of Glasses",
    "Standard Respect",
    "Health, Safety and Environment",
  ];

  const [auditTypes, setAuditTypes] = useState<string[]>(auditTypeOptions);

  // Fetch list of frameworks
  const fetchFrameworks = async () => {
    try {
      setLoading(true);
      const data = await getFrameworks();
      setFrameworks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchFrameworks();
  }, []);

  // Callback to refresh after adding new
  const handleFrameworkAdded = () => {
    fetchFrameworks();
  };

  // Open edit modal
  const handleEdit = (framework: FrameworkType) => {
    setSelectedFramework(framework);
    setIsOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setSelectedFramework(null);
    setIsOpen(false);
  };

  // Update framework API call
  const handleUpdateFramework = async (framework: FrameworkType) => {
    try {
      await updateFramework(framework.id, {
        label: framework.label,
        code: framework.code,
      });
      fetchFrameworks();
      closeModal();
    } catch (error) {
      console.error("Error updating framework:", error);
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteFramework(deleteId);
      fetchFrameworks();
    } catch (error) {
      console.error("Error deleting framework:", error);
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };
  const handleAddAuditType = () => {
    setErrorMsg("");

    const clean = auditCode.trim();
    if (!clean) return;

    // case insensitive duplicate check
    const exists = auditTypes.some(
      (t) => t.toLowerCase() === clean.toLowerCase()
    );

    if (exists) {
      setErrorMsg("❗ This audit type already exists.");
      return;
    }

    setAuditTypes((prev) => [...prev, clean]);
    setAuditCode("");
  };

  const deleteAuditType = (code: string) => {
    setAuditTypes((prev) => prev.filter((t) => t !== code));
  };

  return (
    <div className="p-8 space-y-16">
      <PageMeta title="Framework Management" description="" />
      <PageBreadcrumb pageTitle="Frameworks" />

      {/* ===========================
         FRAMEWORKS LIST SECTION
       =========================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between ">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            🧱 Frameworks
          </h2>
        </div>

        {loading && (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        )}

        {!loading && frameworks.length === 0 && (
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {f.id}
                </p>

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
                  onClick={() => openDeleteConfirm(f.id)}
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
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          🏷️ Audit Types
        </h2>

        {auditTypes.length === 0 ? (
          <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-gray-900/20 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No audit types found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {auditTypes.map((code) => (
              <div
                key={code}
                className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition relative group ${getColorForType(
                  code
                )}`}
              >
                <span className="font-semibold text-sm">{code}</span>

                {/* Delete */}
                <button
                  onClick={() => deleteAuditType(code)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-red-600 
            opacity-0 group-hover:opacity-100 transition"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===========================
         FORMS SECTION (2-column)
       =========================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10">
        {/* Add Framework */}
        <Panel
          title="Add Framework"
          className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50  dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
        >
          <Framework onAdded={handleFrameworkAdded} />
        </Panel>

        {/* Add Audit Type */}
        <Panel
          title="Add Audit Type"
          className="
  bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50
  dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Audit Code</Label>
              <Input
                placeholder="e.g. Machines"
                value={auditCode}
                onChange={(e) => setAuditCode(e.target.value)}
                className="w-full"
              />
            </div>
            {errorMsg && (
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            )}

            <button
              onClick={handleAddAuditType}
              className={`
      w-full py-3 rounded-xl font-semibold text-white transition
      ${
        !auditCode
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-orange-400 to-orange-500 hover:brightness-110"
      }
  `}
            >
              Add Type
            </button>
          </div>
        </Panel>
      </section>

      {/* ===========================
         EDIT MODAL
       =========================== */}
      <Modal
        isOpen={isOpen && selectedFramework !== null}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Label
              </label>
              <input
                type="text"
                value={selectedFramework?.label || ""}
                onChange={(e) =>
                  setSelectedFramework((prev) =>
                    prev ? { ...prev, label: e.target.value } : prev
                  )
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Code */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Code
              </label>
              <input
                type="text"
                value={selectedFramework?.code || ""}
                onChange={(e) =>
                  setSelectedFramework((prev) =>
                    prev ? { ...prev, code: e.target.value } : prev
                  )
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
            <button
              onClick={() => handleUpdateFramework(selectedFramework!)}
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg"
            >
              Update Framework
            </button>
          </div>
        </div>
      </Modal>

      {/* ===========================
         CONFIRM DELETE
       =========================== */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Framework"
        message="Are you sure you want to delete this Framework? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
