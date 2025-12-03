import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer from './auth/auth-slice';
import auditTypeReducer from './auditType/auditType-slice';
import frameworkReducer from './framework/framework-slice';
import questionnaireReducer from './questionnaire/questionnaire-slice';
import userReducer from './users/user-slice';

export const store = configureStore({
  reducer: {
    auth: authenticationReducer,
    auditType: auditTypeReducer,
    framework: frameworkReducer,
    questionnaire: questionnaireReducer,
    user: userReducer,
  },
  devTools: true,
});
