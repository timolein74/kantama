export type UserRole = 'CUSTOMER' | 'ADMIN' | 'FINANCIER';

export type ApplicationType = 'LEASING' | 'SALE_LEASEBACK';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SUBMITTED_TO_FINANCIER'
  | 'INFO_REQUESTED'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'CLOSED'
  | 'CANCELLED';

export type OfferStatus = 'DRAFT' | 'PENDING_ADMIN' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type ContractStatus = 'DRAFT' | 'PENDING_ADMIN' | 'SENT' | 'SIGNED' | 'REJECTED' | 'EXPIRED';

export type InfoRequestStatus = 'PENDING' | 'RESPONDED' | 'CLOSED';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  business_id: string | null;
  financier_id: number | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Financier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  business_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  users?: User[];
}

export interface FileInfo {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
}

export interface ApplicationExtraData {
  year_model?: number;  // Vuosimalli (Sale-Leaseback)
  hours?: number;       // Tunnit (Sale-Leaseback)
  kilometers?: number;  // Kilometrit (Sale-Leaseback)
  link_to_item?: string; // Linkki kohteeseen (Leasing)
}

export interface Application {
  id: number;
  reference_number: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  customer_id: number;
  company_name: string;
  business_id: string;
  contact_person: string | null;
  contact_email: string;
  contact_phone: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  equipment_description: string;
  equipment_supplier: string | null;
  equipment_price: number;
  equipment_age_months: number | null;
  equipment_serial_number: string | null;
  original_purchase_price: number | null;
  current_value: number | null;
  requested_term_months: number | null;
  requested_residual_value: number | null;
  additional_info: string | null;
  extra_data?: ApplicationExtraData | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  files?: FileInfo[];
}

export interface Offer {
  id: number;
  application_id: number;
  financier_id: number;
  monthly_payment: number;
  term_months: number;
  upfront_payment: number | null;
  residual_value: number | null;
  interest_or_margin: number | null;
  included_services: string | null;
  notes_to_customer: string | null;
  internal_notes: string | null;
  status: OfferStatus;
  attachment_file_id: number | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
}

export interface Contract {
  id: number;
  application_id: number;
  financier_id: number;
  offer_id: number | null;
  message_to_customer: string | null;
  internal_notes: string | null;
  contract_file_id: number | null;
  signed_file_id: number | null;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

export interface InfoRequest {
  id: number;
  application_id: number;
  financier_id: number;
  message: string;
  requested_items: string[] | null;
  status: InfoRequestStatus;
  created_at: string;
  updated_at: string;
  responses?: InfoResponse[];
}

export interface InfoResponse {
  id: number;
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  attachments: number[] | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  reference_type: string | null;
  reference_id: number | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Form types
export interface LeasingFormData {
  company_name: string;
  business_id: string;
  contact_person?: string;
  contact_email: string;
  contact_phone?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  equipment_price: number;
  requested_term_months?: number;
  requested_residual_value?: number;
  additional_info?: string;
  link_to_item?: string;
  honeypot?: string;
}

export interface SaleLeasebackFormData {
  company_name: string;
  business_id: string;
  contact_person?: string;
  contact_email: string;
  contact_phone?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  equipment_description: string;
  year_model: number;
  hours?: number;
  kilometers?: number;
  current_value: number;
  requested_term_months?: number;
  additional_info?: string;
  honeypot?: string;
}

