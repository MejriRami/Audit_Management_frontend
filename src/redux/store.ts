import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer from './auth/auth-slice';
import auditTypeReducer from './auditType/auditType-slice';
import frameworkReducer from './framework/framework-slice';

export const store = configureStore({
  reducer: {
    auth: authenticationReducer,
    auditType: auditTypeReducer,
    framework: frameworkReducer
  },
  devTools: true,
});
