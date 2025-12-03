import { createSlice } from "@reduxjs/toolkit";
import { UserState } from "./user-slice-types";

const initialState : UserState = {
    usersList:[],
    user: null,
    success : false,
    error: false,
    toast: ''
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    getAuditorsRequest(state) {
      state.success = false;
      state.error = false;
    },
    getAuditorsSuccess(state, action) {
      state.usersList = action.payload;
      state.success = true;
      state.error = false;
    },
    getAuditorsFailure(state) {
      state.success = false;
      state.error = true;
    },
  }
})

export const {
    getAuditorsRequest,
    getAuditorsSuccess,
    getAuditorsFailure
} = userSlice.actions;

export default userSlice.reducer;