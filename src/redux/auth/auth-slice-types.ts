
export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    error: boolean;
    success: boolean;
    user: any;
    toast: string;
    role: string;
}