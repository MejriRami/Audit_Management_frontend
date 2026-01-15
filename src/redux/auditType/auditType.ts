import axiosInstance from "../../services/axiosInstance";
import { logUserOut } from "../auth/auth";
import { 
  getAuditTypeFailure, getAuditTypeRequest, getAuditTypeSuccess,
  addAuditTypeFailure, addAuditTypeRequest, addAuditTypeSuccess,
  deleteAuditTypeFailure, deleteAuditTypeRequest, deleteAuditTypeSuccess
 } from "./auditType-slice";
import { AddAuditTypes, DeleteAuditTypes, GetAuditTypes } from "./auditType-types";


export const getAuditTypes: GetAuditTypes = async (dispatch) => {
  dispatch(getAuditTypeRequest());
  const url = `/audit-types/all`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getAuditTypeSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getAuditTypeFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const addAuditTypes: AddAuditTypes = async (data, dispatch) => {
  dispatch(addAuditTypeRequest());
  const url = `/audit-types/add`;

  try {
    let response = await axiosInstance.post(url, data);
    dispatch(addAuditTypeSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(addAuditTypeFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const deleteAuditType: DeleteAuditTypes = async (audit_type_id, dispatch) => {
  dispatch(deleteAuditTypeRequest());
  const url = `/audit-types/${audit_type_id}`;

  try {
    let response = await axiosInstance.delete(url);
    dispatch(deleteAuditTypeSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(deleteAuditTypeFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};