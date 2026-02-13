export type DocumentType =
    | 'prescription'
    | 'lab_result'
    | 'treatment_plan'
    | 'invoice'
    | 'consent_form'
    | 'intake_form'
    | 'other';

export interface PatientDocument {
    id: string;
    patient_id: string;
    title: string;
    type: DocumentType;
    category?: string;
    file_url: string;
    uploaded_by?: string;
    signed_at?: string;
    signature_url?: string;
    signed_by_name?: string;
    created_at: string;
    updated_at: string;
}
