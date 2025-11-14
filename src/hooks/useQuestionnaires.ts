// import { useState, useEffect } from "react";
// import {
//   getAllQuestionnaireVersions,
//   deleteQuestionnaire,
//   updateQuestionnaire,
// } from "../api/Questionnaire";
//  import { getFrameworks } from "../api/frameworks";
// import { Questionnaire } from "./../types";
// import { getAuditors } from "../api/users";

// export default function useQuestionnaires() {
//   const [loading, setLoading] = useState(false);
//   const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
//   const [selectedQuestionnaire, setSelectedQuestionnaire] =
//     useState<Questionnaire | null>(null);

//   // Modal states
//   const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
//   const [deleteId, setDeleteId] = useState<number | null>(null);

//   // Dropdown data
//   const [auditorOptions, setAuditorOptions] = useState([]);
//   const [frameworkOptions, setFrameworkOptions] = useState([]);

//   // Load data on mount
//   useEffect(() => {
//     reloadData();
//     loadAuditors();
//     loadFrameworks();
//   }, []);

//   const reloadData = async () => {
//     setLoading(true);
//     const data = await getAllQuestionnaireVersions();
//     setQuestionnaires(data);
//     setLoading(false);
//   };

//   const loadAuditors = async () => {
//     const auditors = await getAuditors();
//     setAuditorOptions(
//       auditors.map((a) => ({ label: a.email, value: a.email }))
//     );
//   };

//   const loadFrameworks = async () => {
//     const frameworks = await getFrameworks();
//     setFrameworkOptions(
//       frameworks.map((f) => ({ label: f.code, value: f.id }))
//     );
//   };

//   // Modal control
//   const openQuestionsModal = (q: Questionnaire) => {
//     setSelectedQuestionnaire(q);
//     setIsQuestionsModalOpen(true);
//   };
//   const closeQuestionsModal = () => setIsQuestionsModalOpen(false);

//   const openEditModal = (q: Questionnaire) => {
//     setSelectedQuestionnaire(q);
//     setIsEditModalOpen(true);
//   };
//   const closeEditModal = () => setIsEditModalOpen(false);

//   const openDeleteConfirm = (id: number) => {
//     setDeleteId(id);
//     setIsDeleteOpen(true);
//   };
//   const closeDeleteConfirm = () => setIsDeleteOpen(false);

//   const handleDelete = async () => {
//     if (deleteId === null) return;
//     await deleteQuestionnaire(deleteId);
//     await reloadData();
//     closeDeleteConfirm();
//   };

//   const handleUpdate = async (updated: Questionnaire) => {
//     await updateQuestionnaire(updated.id, updated);
//     await reloadData();
//     closeEditModal();
//   };

//   return {
//     loading,
//     questionnaires,
//     selectedQuestionnaire,
//     isQuestionsModalOpen,
//     isEditModalOpen,
//     isDeleteOpen,
//     deleteId,

//     auditorOptions,
//     frameworkOptions,

//     openQuestionsModal,
//     closeQuestionsModal,
//     openEditModal,
//     closeEditModal,
//     openDeleteConfirm,
//     closeDeleteConfirm,

//     handleDelete,
//     handleUpdate,
//     reloadData,
//   };
// }
