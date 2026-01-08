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
    deleteLoading: false,  
    deleteError: null}

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
  state.deleteLoading = true; 
  state.deleteError = null;   
  state.success = false;
},
deleteQuestionnaireSuccess(state, action) {
  state.questionnairesList = state.questionnairesList.filter(
    questionnaire => questionnaire.id !== action.payload.id
  );
  state.deleteLoading = false;
  state.success = true;
  state.deleteError = null;
},
deleteQuestionnaireFailure(state, action) {
  state.deleteLoading = false;
  state.success = false;
  state.deleteError = action.payload || "Failed to delete Questionnaire";
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
        state.loading = false;

    },
    clearDeleteState(state) {
  state.deleteLoading = false;
  state.deleteError = null;
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
    getQuestionnairesByNameRequest,
    clearDeleteState
} = questionnaireSlice.actions;

export default questionnaireSlice.reducer;