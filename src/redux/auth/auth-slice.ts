import { createSlice } from '@reduxjs/toolkit';
import { AuthState } from '../../redux/auth/auth-slice-types';

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  success: false,
  error: false,
  toast: '',
  role: '',
  user: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest(state) {
      state.isAuthenticated = false;
      state.error = false;
      state.success = false;
      state.token = null;
    },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.toast='Email et mot de passe sont valides';
      state.token = action.payload.access_token;
      state.role = action.payload.roles;
      localStorage.setItem('token', action.payload.access_token);
      state.error = false;
      state.success = true;
    },
    loginFailure(state, action) {
      if (
         action.payload.detail === 'User not found'
      ) {
        state.toast="Utilisateur non trouvé";
      } else if (
         action.payload.detail === 'Invalid credentials'
      ) {
        state.toast="Email ou mot de passe incorrect";
      }
      state.error = true
      state.success = false;
      state.isAuthenticated = false;
    },
    logout(state) {
      localStorage.removeItem('token');
      state.isAuthenticated  = false;
      state.token = null;
      state.role = '';
    },
    resetAuthState(state) {
      state.error = false;
      state.success = false;
      state.toast = '';
    },
    setIsAuth(state) {
      state.isAuthenticated = true;
    },
    resetPasswordRequest(state) {
      state.error = false;
      state.success = false;
    },
    resetPasswordSuccess(state) {
      state.success = true;
      state.toast = 'votre mot de passe a été réinitialisé avec succès';
      state.error = false;
    },
    resetPasswordFailure(state) {
      state.error = true;
      state.success = false;
      state.toast = 'Échec de la réinitialisation du mot de passe';
    },
    meRequest(state) {
      state.error = false;
      state.success = false;
      state.user = null;
    },
    meSuccess(state, action) {
      state.user = action.payload;
      state.success = true;
      state.error = false;
    },
    meFailure(state) {
      state.user = null;
      state.success = false;
      state.error = true;
    }
  }
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logout,
  resetAuthState,
  setIsAuth,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  meRequest,
  meSuccess,
  meFailure
} = authSlice.actions;

export default authSlice.reducer;