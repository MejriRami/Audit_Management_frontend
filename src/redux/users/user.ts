import axiosInstance from "../../services/axiosInstance";
import { logUserOut } from "../auth/auth";
import { getAuditorsFailure, getAuditorsRequest, getAuditorsSuccess } from "./user-slice";
import { GetAuditors } from "./user-types";

export const getAuditors: GetAuditors = async (dispatch) => {
  dispatch(getAuditorsRequest());
  const url = `/users/auditors`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getAuditorsSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getAuditorsFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};