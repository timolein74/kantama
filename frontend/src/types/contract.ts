// Contract related types

export type ContractStatus = 'DRAFT' | 'PENDING_ADMIN' | 'SENT' | 'SIGNED' | 'REJECTED' | 'EXPIRED';

export interface LeaseObject {
  is_new: boolean;
  brand_model: string;
  accessories?: string | null;
  serial_number?: string | null;
  year_model?: number | null;
}

export interface Contract {
  id: number;
  contract_number: string | null;
  application_id: number;
  financier_id: number;
  offer_id: number | null;
  
  // Lessee
  lessee_company_name: string | null;
  lessee_business_id: string | null;
  lessee_street_address: string | null;
  lessee_postal_code: string | null;
  lessee_city: string | null;
  lessee_country: string | null;
  lessee_contact_person: string | null;
  lessee_phone: string | null;
  lessee_email: string | null;
  lessee_tax_country: string | null;
  
  // Lessor
  lessor_company_name: string | null;
  lessor_business_id: string | null;
  lessor_street_address: string | null;
  lessor_postal_code: string | null;
  lessor_city: string | null;
  
  // Seller
  seller_company_name: string | null;
  seller_business_id: string | null;
  seller_street_address: string | null;
  seller_postal_code: string | null;
  seller_city: string | null;
  seller_contact_person: string | null;
  seller_phone: string | null;
  seller_email: string | null;
  seller_tax_country: string | null;
  
  // Lease objects
  lease_objects: LeaseObject[] | null;
  usage_location: string | null;
  
  // Delivery
  delivery_method: string | null;
  estimated_delivery_date: string | null;
  other_delivery_terms: string | null;
  
  // Rent
  advance_payment: number | null;
  monthly_rent: number | null;
  rent_installments_count: number | null;
  rent_installments_start: number | null;
  rent_installments_end: number | null;
  residual_value: number | null;
  processing_fee: number | null;
  arrangement_fee: number | null;
  invoicing_method: string | null;
  
  // Lease period
  lease_period_months: number | null;
  lease_start_date: string | null;
  
  // Insurance
  insurance_type: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  
  // Bank
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  
  // Guarantees
  guarantees: string | null;
  guarantee_type: string | null;
  
  // Special conditions
  special_conditions: string | null;
  
  // Messages
  message_to_customer: string | null;
  internal_notes: string | null;
  contract_file_id: number | null;
  signed_file_id: number | null;
  logo_file_id: number | null;
  
  // Signatures
  lessee_signature_date: string | null;
  lessee_signature_place: string | null;
  lessee_signer_name: string | null;
  lessor_signature_date: string | null;
  lessor_signature_place: string | null;
  lessor_signer_name: string | null;
  
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

export interface ContractCreateData {
  application_id: number;
  offer_id?: number;
  
  // Lessee
  lessee_company_name?: string;
  lessee_business_id?: string;
  lessee_street_address?: string;
  lessee_postal_code?: string;
  lessee_city?: string;
  lessee_country?: string;
  lessee_contact_person?: string;
  lessee_phone?: string;
  lessee_email?: string;
  lessee_tax_country?: string;
  
  // Lessor
  lessor_company_name?: string;
  lessor_business_id?: string;
  lessor_street_address?: string;
  lessor_postal_code?: string;
  lessor_city?: string;
  
  // Seller
  seller_company_name?: string;
  seller_business_id?: string;
  seller_street_address?: string;
  seller_postal_code?: string;
  seller_city?: string;
  seller_contact_person?: string;
  seller_phone?: string;
  seller_email?: string;
  seller_tax_country?: string;
  
  // Lease objects
  lease_objects?: LeaseObject[];
  usage_location?: string;
  
  // Delivery
  delivery_method?: string;
  estimated_delivery_date?: string;
  other_delivery_terms?: string;
  
  // Rent
  advance_payment?: number;
  monthly_rent?: number;
  rent_installments_count?: number;
  rent_installments_start?: number;
  rent_installments_end?: number;
  residual_value?: number;
  processing_fee?: number;
  arrangement_fee?: number;
  invoicing_method?: string;
  
  // Lease period
  lease_period_months?: number;
  lease_start_date?: string;
  
  // Insurance
  insurance_type?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  
  // Bank
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  
  // Guarantees
  guarantees?: string;
  guarantee_type?: string;
  
  // Special conditions
  special_conditions?: string;
  
  // Messages
  message_to_customer?: string;
  internal_notes?: string;
}

