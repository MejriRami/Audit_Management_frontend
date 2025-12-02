export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    error: boolean;
    success: boolean;
    toast: string;
    role: string;
    user: User | null;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
}