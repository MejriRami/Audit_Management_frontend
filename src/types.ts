export interface User {
  id: number;
  name: string;
    email: string;

  role: string;
}

export interface AuditParticipant {
  user:User;
  local_role: string; // Auditor / Auditee
}

export interface QuestionAndResponse {
  description: string;  
  criticality: string;  
  response: string;     
}

export interface Audit {
  id: number;
   entity:string;
  framework?: string; // from questionnaire_version
  status: "planned" | "postponed" | "confirmed" |"cancelled" ;
  finalScoreType: "color" | "yes_no" | "scale";
  finalScore: string;
  participants: AuditParticipant[];
  sessions?: { start_time: string; end_time: string }[];
  findings?: {
    finding_type: string;  // Change to match the backend field
    corrective_action: string;  // Change to match the backend field
    corrective_action_status: string; // Change to match the backend field
  }[];
  questions_and_responses?: QuestionAndResponse[]; 
  questionnaire:string;
}

export interface Entity {
  id: number;
  type: string;       // maps from EntityType enum
  code: string;
  label: string;
  parent_id: number | null;
  parent?: {
    id: number;
    label: string;
    code: string;
  } | null;
}
