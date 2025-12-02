import { Dispatch } from "redux";

export type GetAuditTypes = (
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type AddAuditTypes = (
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type DeleteAuditTypes = (
  id: string,
  dispatch: Dispatch<any>
) => Promise<boolean>;

