import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer from './auth/auth-slice';

export const store = configureStore({
  reducer: {
    auth: authenticationReducer,
  },
  devTools: true,
});
