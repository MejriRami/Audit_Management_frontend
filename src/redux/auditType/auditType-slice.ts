import { createSlice } from "@reduxjs/toolkit";
import { AuditTypeState } from "./auditType-slice-types";

const initialState : AuditTypeState = {
    auditTypesList:[],
    success : false,
    error: false,
    toast: ''
}

const auditTypeSlice = createSlice({
  name: 'auditType',
  initialState,
  reducers: {
    getAuditTypeRequest(state) {
      state.success = false;
      state.error = false;
    },
    getAuditTypeSuccess(state, action) {
      state.auditTypesList = action.payload;
      state.success = true;
      state.error = false;
    },
    getAuditTypeFailure(state) {
      state.success = false;
      state.error = true;
    },
    addAuditTypeRequest(state) {
      state.success = false;
      state.error = false;
    },
    addAuditTypeSuccess(state, action) {
      state.auditTypesList.push(action.payload);
      state.success = true;
      state.error = false;
      state.toast = "Audit Type added successfully";
    },
    addAuditTypeFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to add Audit Type";
    },
    deleteAuditTypeRequest(state) {
      state.success = false;
      state.error = false;
    },
    deleteAuditTypeSuccess(state, action) {
      state.auditTypesList = state.auditTypesList.filter(auditType => auditType.id !== action.payload.id);
      state.success = true;
      state.error = false;
      state.toast = "Audit Type deleted successfully";
    },
    deleteAuditTypeFailure(state) {
      state.success = false;
      state.error = true;
      state.toast = "Failed to delete Audit Type";
    }
  }
})

export const {
    getAuditTypeRequest,
    getAuditTypeSuccess,
    getAuditTypeFailure,
    addAuditTypeRequest,
    addAuditTypeSuccess,
    addAuditTypeFailure,
    deleteAuditTypeRequest,
    deleteAuditTypeSuccess,
    deleteAuditTypeFailure
} = auditTypeSlice.actions;

export default auditTypeSlice.reducer;