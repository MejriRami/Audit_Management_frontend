import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Framework from "../../components/form/form-elements/add-framework";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Framework as FrameworkType } from "../../types";
import {
  getFrameworks,
  updateFramework,
  deleteFramework,
} from "../../api/frameworks";
import { Modal } from "../../components/ui/modal";
import ConfirmDialog from "../../components/form/ConfirmDialogProps";

export default function FrameworkElements() {
  const [frameworks, setFrameworks] = useState<FrameworkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] =
    useState<FrameworkType | null>(null);

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

  return (
    <div className="p-6 space-y-8">
      <PageMeta
        title="Framework Management"
        description="Manage and add new frameworks to the system"
      />
      <PageBreadcrumb pageTitle="Framework" />

      {/* Add Framework Form */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Framework onAdded={handleFrameworkAdded} />
      </div>

      {/* Frameworks List */}
      <ComponentCard title="Frameworks List">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900 shadow-sm">
          <div className="max-w-full overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Loading frameworks...
              </div>
            ) : (
              <Table className="min-w-full">
                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1C1C1E] dark:to-[#111113] border-b border-gray-200 dark:border-white/[0.1]">
                  <TableRow>
                    {["#ID", "Label", "Code", "Actions"].map(
                      (header, index) => (
                        <TableCell
                          key={header}
                          isHeader
                          className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide ${
                            index === 0
                              ? "w-1/12"
                              : index === 3
                              ? "w-2/12 text-center"
                              : "w-3/12"
                          }`}
                        >
                          {header}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {frameworks.length > 0 ? (
                    frameworks.map((framework) => (
                      <TableRow
                        key={framework.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {framework.id}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                          {framework.label}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {framework.code}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => handleEdit(framework)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                              title="Edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.8"
                                stroke="currentColor"
                                className="w-5 h-5 cursor-pointer transition-colors hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487a2.25 2.25 0 0 1 3.182 3.182L8.25 19.463 3 21l1.537-5.25L16.862 4.487z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => openDeleteConfirm(framework.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                              title="Delete"
                            >
                              <svg
                                className="cursor-pointer hover:fill-error-500 dark:hover:fill-error-500 fill-gray-700 dark:fill-gray-400"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z"
                                  fill=""
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="px-6 py-6 text-center text-gray-500 dark:text-gray-400">
                        No frameworks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </ComponentCard>

      {/* Edit Framework Modal */}
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
            {/* Framework Label */}
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
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {/* Framework Code */}
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
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={() => handleUpdateFramework(selectedFramework!)}
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-[#F68C1F] to-[#EF7807] text-white rounded-lg dark:from-[#B55A00] dark:to-[#8A4600]"
            >
              Update Framework
            </button>
          </div>
        </div>
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
    </div>
  );
}
