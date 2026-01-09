import axiosInstance from "../../services/axiosInstance";
import { logUserOut } from "../auth/auth";
import {
     addQuestionnaireFailure, addQuestionnaireRequest, addQuestionnaireSuccess,
     deleteQuestionnaireFailure,
     deleteQuestionnaireRequest,
     deleteQuestionnaireSuccess,
     getQuestionnaireByIdFailure, getQuestionnaireByIdRequest, getQuestionnaireByIdSuccess,
     getQuestionnairesByNameFailure,
     getQuestionnairesByNameRequest,
     getQuestionnairesByNameSuccess,
     getQuestionnairesFailure, getQuestionnairesRequest, getQuestionnairesSuccess, 
     updateQuestionnaireFailure,
     updateQuestionnaireRequest,
     updateQuestionnaireSuccess
} from "./questionnaire-slice";
import { AddQuestionnaire, DeleteQuestionnaire, GetQuestionnaireById, GetQuestionnaires, GetQuestionnairesByName, UpdateQuestionnaire } from "./questionnaire-types";


export const getQuestionnaires: GetQuestionnaires = async (dispatch) => {
  dispatch(getQuestionnairesRequest());
  const url = `/questionnaire/getAll`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getQuestionnairesSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getQuestionnairesFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const getQuestionnaireById: GetQuestionnaireById = async (questionnaire_id, dispatch) => {
  dispatch(getQuestionnaireByIdRequest());
  const url = `/questionnaire/${questionnaire_id}`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getQuestionnaireByIdSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getQuestionnaireByIdFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const addQuestionnaire: AddQuestionnaire = async (data, dispatch) => {
  dispatch(addQuestionnaireRequest());
  const url = `/questionnaire/add`;

  try {
    const response = await axiosInstance.post(url, data);
    dispatch(addQuestionnaireSuccess(response.data));
    return true;
  } catch (error: any) {
    const status = error?.response?.status;
    const resp = error?.response?.data;

    const message =
      resp?.detail || resp?.message || "Failed to add Questionnaire";

    dispatch(addQuestionnaireFailure({ message }));

    if (status === 401) logUserOut(dispatch);
    return false;
  }
};


export const deleteQuestionnaire: DeleteQuestionnaire = async (questionnaire_id, dispatch) => {
  dispatch(deleteQuestionnaireRequest());
  const url = `/questionnaire/${questionnaire_id}`;

  try {
    let response = await axiosInstance.delete(url);
    dispatch(deleteQuestionnaireSuccess({ id: questionnaire_id, data: response.data }));
    return {
      success: true,
      deleted: true
    };
  } catch (error: any) {
    const { status, data } = error.response || {};
    const errorMessage = data?.detail || data?.message || "Failed to delete questionnaire";
    
    dispatch(deleteQuestionnaireFailure(errorMessage));
    
    if (status === 401) {
      logUserOut(dispatch);
    }
    
    return {
      success: false,
      error: errorMessage,
      status
    };
  }
};
export const updateQuestionnaire: UpdateQuestionnaire = async (
  questionnaire_id,
  data,
  file,
  removeGuideline,
  dispatch,
  currentUserId
) => {
  dispatch(updateQuestionnaireRequest());
  const url = `/questionnaire/${questionnaire_id}`;

  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Add text fields
    if (data.name) formData.append('name', data.name);
    if (data.status) formData.append('status', data.status);
    if (data.target_duration) formData.append('target_duration', data.target_duration);
    if (data.type_id) formData.append('type_id', data.type_id.toString());
    if (data.framework_id) formData.append('framework_id', data.framework_id.toString());

    // Add auditor emails as JSON string
    if (data.auditor_emails && data.auditor_emails.length > 0) {
      formData.append('auditor_emails', JSON.stringify(data.auditor_emails));
    }

    // Add file if provided
    if (file) {
      formData.append('guideline_file', file);
    }

    // Add remove flag
    if (removeGuideline) {
      formData.append('remove_existing_guideline', 'true');
    }

    // Add current user ID
    formData.append('current_user_id', currentUserId.toString());

    // Make API call with multipart/form-data
    const response = await axiosInstance.put(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    dispatch(updateQuestionnaireSuccess(response.data));
    return true;
  } catch (error: any) {
    console.error('Update questionnaire error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status } = error.response;
      
      // Your reducer expects just the action, no payload
      dispatch(updateQuestionnaireFailure());
      
      if (status === 401) {
        logUserOut(dispatch);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      dispatch(updateQuestionnaireFailure());
    } else {
      // Error in request setup
      console.error('Error setting up request:', error.message);
      dispatch(updateQuestionnaireFailure());
    }
  }

  return false;
};
export const getQuestionnairesByNames: GetQuestionnairesByName = async (dispatch) => {
  dispatch(getQuestionnairesByNameRequest());
  const url = `/questionnaire/names`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getQuestionnairesByNameSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getQuestionnairesByNameFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};