import { Dispatch } from "redux";

export type Login = (
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type ResetPassword = (
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;