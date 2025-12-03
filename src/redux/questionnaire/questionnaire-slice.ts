import { createSlice } from "@reduxjs/toolkit";
import { QuestionnaireState } from "./questionnaire-slice-types";

const initialState : QuestionnaireState    = {
    questionnairesList:[],
    questionnaire: null,
    success : false,
    error: false,
    toast: ''
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
    },
    addQuestionnaireSuccess(state, action) {
      console.log(action.payload.questionnaire);
      state.questionnairesList.push(action.payload.questionnaire);
      state.success = true;
      state.error = false;
      state.toast = "Questionnaire added successfully";
    },
    addQuestionnaireFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to add Questionnaire";
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
    resetQuestioannairesState
} = questionnaireSlice.actions;

export default questionnaireSlice.reducer;