export interface Audit {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuditState {
  audits: Audit[];
  loading: boolean;
  error: string | null;
}
