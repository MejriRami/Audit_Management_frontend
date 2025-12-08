import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer from './auth/auth-slice';
import auditTypeReducer from './auditType/auditType-slice';
import frameworkReducer from './framework/framework-slice';
import questionnaireReducer from './questionnaire/questionnaire-slice';
import userReducer from './users/user-slice';
import auditReducer from './audit/audit-slice';

export const store = configureStore({
  reducer: {
    auth: authenticationReducer,
    auditType: auditTypeReducer,
    framework: frameworkReducer,
    questionnaire: questionnaireReducer,
    user: userReducer,
    audit:auditReducer,
  },
  devTools: true,
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;