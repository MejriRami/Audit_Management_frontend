import { createSlice } from "@reduxjs/toolkit";
import { FrameworkState } from "./framework-slice-types";

const initialState : FrameworkState = {
    frameworksList:[],
    framework: null,
    success : false,
    error: false,
    toast: ''
}

const frameworkSlice = createSlice({
  name: 'framework',
  initialState,
  reducers: {
    getFrameworksRequest(state) {
      state.success = false;
      state.error = false;
    },
    getFrameworksSuccess(state, action) {
      state.frameworksList = action.payload;
      state.success = true;
      state.error = false;
    },
    getFrameworksFailure(state) {
      state.success = false;
      state.error = true;
    },
    addFrameworkRequest(state) {
      state.success = false;
      state.error = false;
    },
    addFrameworkSuccess(state, action) {
      state.frameworksList.push(action.payload);
      state.success = true;
      state.error = false;
      state.toast = "Framework added successfully";
    },
    addFrameworkFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to add Framework";
    },
    deleteFrameworkRequest(state) {
      state.success = false;
      state.error = false;
    },
    deleteFrameworkSuccess(state, action) {
      state.frameworksList = state.frameworksList.filter(framework => framework.id !== action.payload.id);
      state.success = true;
      state.error = false;
      state.toast = "Framework deleted successfully";
    },
    deleteFrameworkFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to delete Framework";
    },
    updateFrameworkRequest(state) {
      state.success = false;
      state.error = false;
    },
    updateFrameworkSuccess(state, action) {
      const index = state.frameworksList.findIndex(framework => framework.id === action.payload.id);
      if (index !== -1) {
        state.frameworksList[index] = action.payload;
      }
      state.success = true;
      state.error = false;
      state.toast = "Framework updated successfully";
    },
    updateFrameworkFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to update Framework";
    }
  }
})

export const {
    getFrameworksRequest,
    getFrameworksSuccess,
    getFrameworksFailure,
    addFrameworkRequest,
    addFrameworkSuccess,
    addFrameworkFailure,
    deleteFrameworkRequest,
    deleteFrameworkSuccess,
    deleteFrameworkFailure,
    updateFrameworkRequest,
    updateFrameworkSuccess,
    updateFrameworkFailure
} = frameworkSlice.actions;

export default frameworkSlice.reducer;