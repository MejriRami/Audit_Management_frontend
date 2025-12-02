import { Dispatch } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { 
  loginFailure,
  loginRequest,
  loginSuccess,
  logout,
  resetPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  meFailure,
  meRequest,
  meSuccess
} from "./auth-slice";
import { Login, Me, ResetPassword } from "./auth-types";

export const login: Login = async (data, dispatch) => {
  dispatch(loginRequest());
  const url = `/login`;

  try {
    await localStorage.clear();
    let response = await axiosInstance.post(url, data);
    dispatch(loginSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(loginFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const logUserOut = (dispatch: Dispatch) => {
  dispatch(logout());
};

export const resetPassword: ResetPassword = async (data, dispatch) => {
  dispatch(resetPasswordRequest());
  const url = `/reset-password`;

  try {
    let response = await axiosInstance.post(url, data);
    dispatch(resetPasswordSuccess(response.data));
    return true;
  } catch (error: any) {
    const { status, data } = error.response;
    dispatch(resetPasswordFailure(data));
    if (status === 401) {
      logUserOut(dispatch);
    }
  }

  return false;
};

export const me: Me = async (dispatch) => {
  dispatch(meRequest());
  const url = `/me`;

  try {
      let response = await axiosInstance.get(url);
      dispatch(meSuccess(response.data));
      return true;
    } catch (error: any) {
      const { status, data } = error.response;
      dispatch(meFailure(data));
      if (status === 401) {
        logUserOut(dispatch);
      }
    }

  return false;
};


