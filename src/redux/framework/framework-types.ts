import { Dispatch } from "redux";

export type GetFrameworks = (
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type AddFramework = (
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type DeleteFramework = (
  id: number,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type UpdateFramework = (
  framework_id: number,
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

