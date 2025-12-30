import { createSlice } from "@reduxjs/toolkit";
import { QuestionnaireState } from "./questionnaire-slice-types";

const initialState : QuestionnaireState    = {
    questionnairesList:[],
    questionnaireListName:[],
    questionnaire: null,
    success : false,
    error: false,
    toast: '',
    loading: false,
}

const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState,
  reducers: {
    getQuestionnairesRequest(state) {
      state.success = false;
      state.error = false;
    },
    getQuestionnairesSuccess(state, action) {
      state.questionnairesList = action.payload;
      state.success = true;
      state.error = false;
    },
    getQuestionnairesFailure(state) {
      state.success = false;
      state.error = true;
    },
    getQuestionnaireByIdRequest(state) {
        state.success = false;
        state.error = false;
    },
    getQuestionnaireByIdSuccess(state, action) {
        state.questionnaire = action.payload;
        state.success = true;
        state.error = false;
    },
    getQuestionnaireByIdFailure(state) {
        state.success = false;
        state.error = true;
    },
    addQuestionnaireRequest(state) {
      state.success = false;
      state.error = false;
      state.loading = true;
      state.toast = "";
    },
    addQuestionnaireSuccess(state, action) {
      console.log(action.payload.questionnaire);
      state.loading = false; 
      state.questionnairesList.push(action.payload.questionnaire);
      state.success = true;
      state.error = false;
      state.toast = "Questionnaire added successfully";
    },
    addQuestionnaireFailure(state,action) {
      state.loading = false; 
      state.success = false;
      state.error = true;
      state.toast = action.payload?.message || "Failed to add Questionnaire";
    },
    deleteQuestionnaireRequest(state) {
      state.success = false;
      state.error = false;
    },
    deleteQuestionnaireSuccess(state, action) {
      state.questionnairesList = state.questionnairesList.filter(questionnaire => questionnaire.id !== action.payload.id);
      state.success = true;
      state.error = false;
      state.toast = "Questionnaire deleted successfully";
    },
    deleteQuestionnaireFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to delete Questionnaire";
    },
    updateQuestionnaireRequest(state) {
      state.success = false;
      state.error = false;
    },
    updateQuestionnaireSuccess(state, action) {
      const index = state.questionnairesList.findIndex(questionnaire => questionnaire.id === action.payload.questionnaire.id);
      if (index !== -1) {
        state.questionnairesList[index] = action.payload.questionnaire;
      }
      state.success = true;
      state.error = false;
      state.toast = "Questionnaire updated successfully";
    },
    updateQuestionnaireFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to update Questionnaire";
    },
    resetQuestioannairesState(state) {
      state.success = false;
      state.error = false;
      state.toast = '';
    },
    getQuestionnairesByNameRequest(state) {
      state.success = false;
      state.error = false;
    },
    getQuestionnairesByNameSuccess(state, action) {
      state.questionnaireListName = action.payload;
      state.success = true;
      state.error = false;
    },
    getQuestionnairesByNameFailure(state) {
      state.success = false;
      state.error = true;
    }
  }
})

export const {
    getQuestionnairesRequest,
    getQuestionnairesSuccess,
    getQuestionnairesFailure,
    getQuestionnaireByIdRequest,
    getQuestionnaireByIdSuccess,
    getQuestionnaireByIdFailure,
    addQuestionnaireRequest,
    addQuestionnaireSuccess,
    addQuestionnaireFailure,
    deleteQuestionnaireRequest,
    deleteQuestionnaireSuccess,
    deleteQuestionnaireFailure,
    updateQuestionnaireRequest,
    updateQuestionnaireSuccess,
    updateQuestionnaireFailure,
    resetQuestioannairesState,
    getQuestionnairesByNameSuccess,
    getQuestionnairesByNameFailure,
    getQuestionnairesByNameRequest
} = questionnaireSlice.actions;

export default questionnaireSlice.reducer;