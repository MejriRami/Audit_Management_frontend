import { Auditor, Question } from "../../types";

export interface QuestionnaireState {
    questionnairesList: Questionnaire[];
    questionnaireListName:QuestionnairesNames[];
    questionnaire: Questionnaire | null;
    success: boolean;
    error: boolean;
    toast: string;
    loading: boolean;
    deleteError:string | null;
    deleteLoading:boolean ;
}

export interface Questionnaire {
  id: number;
  name: string;
  version: number;
  status: string;
  target_duration: string;
  score_calculation: string;
  guideline_file: string;
  type_id: string;
  framework_id: string;
  framework: {
    code: string;id:string,label:string
};
  auditType?: {id:string,value:string};
  auditors: Auditor[];
  questions: Question[];
}

export interface QuestionnairesNames{
  id: number;
  name: string;
} 