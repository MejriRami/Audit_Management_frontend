export interface UserState {
    usersList: User[];
    user: User | null;
    success: boolean;
    error: boolean;
    toast: string;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    role: Role[];
    email: string;
    active: boolean;
}

export interface Role {
    id: number;
    name: string;
}