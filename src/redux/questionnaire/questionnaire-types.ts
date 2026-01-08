import { Dispatch } from "redux";

export type GetQuestionnaires = (
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type GetQuestionnaireById = (
  id: number,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type AddQuestionnaire = (
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type DeleteQuestionnaire = (
  id: number,
  dispatch: Dispatch<any>
) => Promise<{
  success: boolean;
  deleted?: boolean;
  error?: string;
  status?: number;
}>;

export type UpdateQuestionnaire = (
  questionnaire_id: number,
  data: any,
  dispatch: Dispatch<any>
) => Promise<boolean>;

export type GetQuestionnairesByName=(
 dispatch: Dispatch<any>
) => Promise<boolean>;


