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
export const updateQuestionnaire: UpdateQuestionnaire = async (questionnaire_id, data, dispatch) => {
  dispatch(updateQuestionnaireRequest());
  const url = `/questionnaire/${questionnaire_id}`;

  try {
    let response = await axiosInstance.put(url, data);
    dispatch(updateQuestionnaireSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(updateQuestionnaireFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
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