
export interface AuditTypeState {
    auditTypesList: AuditType[];
    success: boolean;
    error: boolean;
    toast: string;
}

export interface AuditType {
    id: number,
    name: string
}


export interface AddAuditTypeForm {
    value: string;
}