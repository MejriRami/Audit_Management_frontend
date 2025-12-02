export interface FrameworkState {
    frameworksList: Framework[];
    framework: Framework | null;
    success: boolean;
    error: boolean;
    toast: string;
}

export interface Framework {
    id: number,
    code: string,
    label: string
}