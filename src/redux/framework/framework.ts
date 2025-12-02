import axiosInstance from "../../services/axiosInstance";
import { logUserOut } from "../auth/auth";
import { 
  getFrameworksRequest, getFrameworksSuccess, getFrameworksFailure,
  addFrameworkFailure, addFrameworkRequest, addFrameworkSuccess,
  deleteFrameworkFailure, deleteFrameworkRequest, deleteFrameworkSuccess,
  updateFrameworkFailure, updateFrameworkRequest, updateFrameworkSuccess
 } from "./framework-slice";
import { AddFramework, DeleteFramework, GetFrameworks, UpdateFramework } from "./framework-types";


export const getFrameworks: GetFrameworks = async (dispatch) => {
  dispatch(getFrameworksRequest());
  const url = `/framework/getAll`;

  try {
    let response = await axiosInstance.get(url);
    dispatch(getFrameworksSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(getFrameworksFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const addFramework: AddFramework = async (data, dispatch) => {
  dispatch(addFrameworkRequest());
  const url = `/framework/add`;

  try {
    let response = await axiosInstance.post(url, data);
    dispatch(addFrameworkSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(addFrameworkFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const deleteFramework: DeleteFramework = async (framework_id, dispatch) => {
  dispatch(deleteFrameworkRequest());
  const url = `/framework/${framework_id}`;

  try {
    let response = await axiosInstance.delete(url);
    dispatch(deleteFrameworkSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(deleteFrameworkFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const updateFramework: UpdateFramework = async (framework_id, data, dispatch) => {
  dispatch(updateFrameworkRequest());
  const url = `/framework/${framework_id}`;

  try {
    let response = await axiosInstance.put(url, data);
    dispatch(updateFrameworkSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(updateFrameworkFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};