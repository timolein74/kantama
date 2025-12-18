import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  User,
  Truck,
  Euro,
  Calendar,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Upload,
  Image
} from 'lucide-react';
import type { Application, Offer } from '../../types';
import type { ContractCreateData, LeaseObject } from '../../types/contract';
import { formatCurrency, formatDate } from '../../lib/utils';

interface ContractFormProps {
  application: Application;
  acceptedOffer: Offer | null;
  onSubmit: (data: ContractCreateData, logoFile?: File) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

type FormSection = 'lessee' | 'lessor' | 'seller' | 'objects' | 'delivery' | 'rent' | 'period' | 'special';

export default function ContractForm({
  application,
  acceptedOffer,
  onSubmit,
  onCancel,
  isSubmitting
}: ContractFormProps) {
  const [expandedSections, setExpandedSections] = useState<FormSection[]>(['lessee', 'lessor', 'rent']);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<ContractCreateData>({
    application_id: application.id,
    offer_id: acceptedOffer?.id,
    
    // Pre-fill from application
    lessee_company_name: application.company_name,
    lessee_business_id: application.business_id,
    lessee_street_address: application.street_address || '',
    lessee_postal_code: application.postal_code || '',
    lessee_city: application.city || '',
    lessee_country: 'Finland',
    lessee_contact_person: application.contact_person || '',
    lessee_phone: application.contact_phone || '',
    lessee_email: application.contact_email,
    lessee_tax_country: 'Suomi',
    
    // Lessor defaults
    lessor_company_name: 'Rahoittaja Oy',
    lessor_business_id: '',
    lessor_street_address: '',
    lessor_postal_code: '',
    lessor_city: '',
    
    // Seller (from equipment supplier)
    seller_company_name: application.equipment_supplier || '',
    seller_business_id: '',
    seller_street_address: '',
    seller_postal_code: '',
    seller_city: '',
    seller_contact_person: '',
    seller_phone: '',
    seller_email: '',
    seller_tax_country: 'Suomi',
    
    // Lease objects
    lease_objects: [{
      is_new: application.application_type === 'LEASING',
      brand_model: application.equipment_description,
      accessories: '',
      serial_number: application.equipment_serial_number || '',
      year_model: application.extra_data?.year_model || undefined
    }],
    usage_location: 'Suomi',
    
    // Delivery
    delivery_method: 'Toimitus',
    estimated_delivery_date: undefined,
    other_delivery_terms: '',
    
    // Rent (from accepted offer)
    advance_payment: acceptedOffer?.upfront_payment || 0,
    monthly_rent: acceptedOffer?.monthly_payment || 0,
    rent_installments_count: acceptedOffer?.term_months || 60,
    rent_installments_start: 1,
    rent_installments_end: acceptedOffer?.term_months || 60,
    residual_value: acceptedOffer?.residual_value || 0,
    processing_fee: 500,
    arrangement_fee: 10,
    invoicing_method: 'E-Lasku',
    
    // Lease period
    lease_period_months: acceptedOffer?.term_months || 60,
    lease_start_date: undefined,
    
    // Bank (optional)
    bank_name: '',
    bank_iban: '',
    bank_bic: '',
    
    // Guarantees
    guarantees: '',
    guarantee_type: '',
    
    // Special conditions
    special_conditions: '',
    
    // Messages
    message_to_customer: '',
    internal_notes: ''
  });

  const toggleSection = (section: FormSection) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleInputChange = (field: keyof ContractCreateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaseObjectChange = (index: number, field: keyof LeaseObject, value: any) => {
    const newObjects = [...(formData.lease_objects || [])];
    newObjects[index] = { ...newObjects[index], [field]: value };
    setFormData(prev => ({ ...prev, lease_objects: newObjects }));
  };

  const addLeaseObject = () => {
    setFormData(prev => ({
      ...prev,
      lease_objects: [
        ...(prev.lease_objects || []),
        { is_new: false, brand_model: '', accessories: '', serial_number: '', year_model: undefined }
      ]
    }));
  };

  const removeLeaseObject = (index: number) => {
    if ((formData.lease_objects?.length || 0) > 1) {
      const newObjects = formData.lease_objects?.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, lease_objects: newObjects }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData, logoFile || undefined);
  };

  const SectionHeader = ({ 
    section, 
    title, 
    icon: Icon 
  }: { 
    section: FormSection; 
    title: string; 
    icon: any;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-emerald-600" />
        <span className="font-semibold text-midnight-900">{title}</span>
      </div>
      {expandedSections.includes(section) ? (
        <ChevronUp className="w-5 h-5 text-slate-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <h2 className="text-xl font-bold mb-1">Rahoitusleasingsopimus</h2>
        <p className="text-emerald-100 text-sm">
          Hakemus: {application.reference_number} • {application.company_name}
        </p>
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Logo upload */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain rounded-lg bg-white p-2" />
              ) : (
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-emerald-900 mb-1">Rahoittajan logo</h4>
              <p className="text-sm text-emerald-700 mb-2">
                Lisää logosi sopimukseen. Logo näkyy sopimuksen ylätunnisteessa.
              </p>
              <label className="btn bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                {logoFile ? 'Vaihda logo' : 'Lataa logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* VUOKRALLEOTTAJA / LESSEE */}
        <div>
          <SectionHeader section="lessee" title="Vuokralleottaja" icon={Building2} />
          {expandedSections.includes('lessee') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Yritys *</label>
                  <input
                    type="text"
                    value={formData.lessee_company_name || ''}
                    onChange={(e) => handleInputChange('lessee_company_name', e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Y-tunnus *</label>
                  <input
                    type="text"
                    value={formData.lessee_business_id || ''}
                    onChange={(e) => handleInputChange('lessee_business_id', e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Katuosoite</label>
                  <input
                    type="text"
                    value={formData.lessee_street_address || ''}
                    onChange={(e) => handleInputChange('lessee_street_address', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Postinumero</label>
                  <input
                    type="text"
                    value={formData.lessee_postal_code || ''}
                    onChange={(e) => handleInputChange('lessee_postal_code', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Postitoimipaikka</label>
                  <input
                    type="text"
                    value={formData.lessee_city || ''}
                    onChange={(e) => handleInputChange('lessee_city', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Verotusmaa</label>
                  <input
                    type="text"
                    value={formData.lessee_tax_country || ''}
                    onChange={(e) => handleInputChange('lessee_tax_country', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Yhteyshenkilö</label>
                  <input
                    type="text"
                    value={formData.lessee_contact_person || ''}
                    onChange={(e) => handleInputChange('lessee_contact_person', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Puhelin</label>
                  <input
                    type="text"
                    value={formData.lessee_phone || ''}
                    onChange={(e) => handleInputChange('lessee_phone', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Sähköposti</label>
                <input
                  type="email"
                  value={formData.lessee_email || ''}
                  onChange={(e) => handleInputChange('lessee_email', e.target.value)}
                  className="input"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* VUOKRALLEANTAJA / LESSOR */}
        <div>
          <SectionHeader section="lessor" title="Vuokralleantaja (rahoittaja)" icon={User} />
          {expandedSections.includes('lessor') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Yritys *</label>
                  <input
                    type="text"
                    value={formData.lessor_company_name || ''}
                    onChange={(e) => handleInputChange('lessor_company_name', e.target.value)}
                    className="input"
                    placeholder="Rahoittaja Oy"
                    required
                  />
                </div>
                <div>
                  <label className="label">Y-tunnus</label>
                  <input
                    type="text"
                    value={formData.lessor_business_id || ''}
                    onChange={(e) => handleInputChange('lessor_business_id', e.target.value)}
                    className="input"
                    placeholder="1234567-8"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Katuosoite</label>
                  <input
                    type="text"
                    value={formData.lessor_street_address || ''}
                    onChange={(e) => handleInputChange('lessor_street_address', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Postinumero</label>
                  <input
                    type="text"
                    value={formData.lessor_postal_code || ''}
                    onChange={(e) => handleInputChange('lessor_postal_code', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Postitoimipaikka</label>
                <input
                  type="text"
                  value={formData.lessor_city || ''}
                  onChange={(e) => handleInputChange('lessor_city', e.target.value)}
                  className="input"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* MYYJÄ / SELLER */}
        <div>
          <SectionHeader section="seller" title="Myyjä / Toimittaja" icon={Building2} />
          {expandedSections.includes('seller') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Yritys</label>
                  <input
                    type="text"
                    value={formData.seller_company_name || ''}
                    onChange={(e) => handleInputChange('seller_company_name', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Y-tunnus</label>
                  <input
                    type="text"
                    value={formData.seller_business_id || ''}
                    onChange={(e) => handleInputChange('seller_business_id', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Katuosoite</label>
                  <input
                    type="text"
                    value={formData.seller_street_address || ''}
                    onChange={(e) => handleInputChange('seller_street_address', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Postinumero</label>
                  <input
                    type="text"
                    value={formData.seller_postal_code || ''}
                    onChange={(e) => handleInputChange('seller_postal_code', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Postitoimipaikka</label>
                  <input
                    type="text"
                    value={formData.seller_city || ''}
                    onChange={(e) => handleInputChange('seller_city', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Verotusmaa</label>
                  <input
                    type="text"
                    value={formData.seller_tax_country || ''}
                    onChange={(e) => handleInputChange('seller_tax_country', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Yhteyshenkilö</label>
                  <input
                    type="text"
                    value={formData.seller_contact_person || ''}
                    onChange={(e) => handleInputChange('seller_contact_person', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Puhelin</label>
                  <input
                    type="text"
                    value={formData.seller_phone || ''}
                    onChange={(e) => handleInputChange('seller_phone', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Sähköposti</label>
                <input
                  type="email"
                  value={formData.seller_email || ''}
                  onChange={(e) => handleInputChange('seller_email', e.target.value)}
                  className="input"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* VUOKRAKOHDE / LEASE OBJECTS */}
        <div>
          <SectionHeader section="objects" title="Vuokrakohde" icon={FileText} />
          {expandedSections.includes('objects') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              {formData.lease_objects?.map((obj, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-midnight-900">Kohde {index + 1}</h5>
                    {(formData.lease_objects?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLeaseObject(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="label">Uusi/Käytetty</label>
                      <select
                        value={obj.is_new ? 'new' : 'used'}
                        onChange={(e) => handleLeaseObjectChange(index, 'is_new', e.target.value === 'new')}
                        className="input"
                      >
                        <option value="new">Uusi</option>
                        <option value="used">Käytetty</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Merkki ja malli *</label>
                      <input
                        type="text"
                        value={obj.brand_model}
                        onChange={(e) => handleLeaseObjectChange(index, 'brand_model', e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Vuosimalli</label>
                      <input
                        type="number"
                        value={obj.year_model || ''}
                        onChange={(e) => handleLeaseObjectChange(index, 'year_model', parseInt(e.target.value) || undefined)}
                        className="input"
                        placeholder="2024"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Lisävarusteet</label>
                      <input
                        type="text"
                        value={obj.accessories || ''}
                        onChange={(e) => handleLeaseObjectChange(index, 'accessories', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Sarja-/Rekisterinumero</label>
                      <input
                        type="text"
                        value={obj.serial_number || ''}
                        onChange={(e) => handleLeaseObjectChange(index, 'serial_number', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLeaseObject}
                className="btn-secondary w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lisää kohde
              </button>
              <div>
                <label className="label">Käyttöpaikka</label>
                <input
                  type="text"
                  value={formData.usage_location || ''}
                  onChange={(e) => handleInputChange('usage_location', e.target.value)}
                  className="input"
                  placeholder="Suomi"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* TOIMITUS / DELIVERY */}
        <div>
          <SectionHeader section="delivery" title="Toimitus" icon={Truck} />
          {expandedSections.includes('delivery') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Toimitustapa</label>
                  <select
                    value={formData.delivery_method || ''}
                    onChange={(e) => handleInputChange('delivery_method', e.target.value)}
                    className="input"
                  >
                    <option value="Toimitus">Toimitus</option>
                    <option value="Nouto">Nouto</option>
                  </select>
                </div>
                <div>
                  <label className="label">Arvioitu toimituspäivä</label>
                  <input
                    type="date"
                    value={formData.estimated_delivery_date || ''}
                    onChange={(e) => handleInputChange('estimated_delivery_date', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Muut toimitusehdot</label>
                <textarea
                  value={formData.other_delivery_terms || ''}
                  onChange={(e) => handleInputChange('other_delivery_terms', e.target.value)}
                  className="input min-h-[80px]"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* VUOKRAN MÄÄRÄ / RENT */}
        <div>
          <SectionHeader section="rent" title="Vuokran määrä" icon={Euro} />
          {expandedSections.includes('rent') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              {acceptedOffer && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-emerald-700">
                    <strong>Tarjouksen tiedot:</strong> Kuukausierä {formatCurrency(acceptedOffer.monthly_payment)}, 
                    Sopimuskausi {acceptedOffer.term_months} kk
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ennakkovuokra (ALV 0%)</label>
                  <input
                    type="number"
                    value={formData.advance_payment || ''}
                    onChange={(e) => handleInputChange('advance_payment', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Vuokraerä (ALV 0%) *</label>
                  <input
                    type="number"
                    value={formData.monthly_rent || ''}
                    onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Vuokraerät alkaen</label>
                  <input
                    type="number"
                    value={formData.rent_installments_start || ''}
                    onChange={(e) => handleInputChange('rent_installments_start', parseInt(e.target.value) || 1)}
                    className="input"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="label">Vuokraerät päättyen</label>
                  <input
                    type="number"
                    value={formData.rent_installments_end || ''}
                    onChange={(e) => handleInputChange('rent_installments_end', parseInt(e.target.value) || undefined)}
                    className="input"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="label">Laskutustapa</label>
                  <select
                    value={formData.invoicing_method || ''}
                    onChange={(e) => handleInputChange('invoicing_method', e.target.value)}
                    className="input"
                  >
                    <option value="E-Lasku">E-Lasku</option>
                    <option value="Paperilasku">Paperilasku</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Jäännösarvo (ALV 0%)</label>
                  <input
                    type="number"
                    value={formData.residual_value || ''}
                    onChange={(e) => handleInputChange('residual_value', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Käsittelymaksu/erä</label>
                  <input
                    type="number"
                    value={formData.processing_fee || ''}
                    onChange={(e) => handleInputChange('processing_fee', parseFloat(e.target.value) || 500)}
                    className="input"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="label">Järjestelypalkkio</label>
                  <input
                    type="number"
                    value={formData.arrangement_fee || ''}
                    onChange={(e) => handleInputChange('arrangement_fee', parseFloat(e.target.value) || 10)}
                    className="input"
                    placeholder="10"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 italic">
                Vuokraan ja muihin palkkioihin lisätään arvonlisävero kulloinkin voimassaolevien säännösten mukaan.
              </p>
            </motion.div>
          )}
        </div>

        {/* VUOKRA-AIKA / LEASE PERIOD */}
        <div>
          <SectionHeader section="period" title="Vuokra-aika" icon={Calendar} />
          {expandedSections.includes('period') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Vuokra-aika (kk) *</label>
                  <input
                    type="number"
                    value={formData.lease_period_months || ''}
                    onChange={(e) => handleInputChange('lease_period_months', parseInt(e.target.value) || undefined)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Vuokra-ajan alkamispäivä</label>
                  <input
                    type="date"
                    value={formData.lease_start_date || ''}
                    onChange={(e) => handleInputChange('lease_start_date', e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Vuokra-aika alkaa vuokrakohteen toimituspäivänä.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ERITYISEHDOT / SPECIAL CONDITIONS */}
        <div>
          <SectionHeader section="special" title="Erityisehdot ja vakuudet" icon={Settings} />
          {expandedSections.includes('special') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4 px-4"
            >
              <div>
                <label className="label">Vakuuden tyyppi</label>
                <select
                  value={formData.guarantee_type || ''}
                  onChange={(e) => handleInputChange('guarantee_type', e.target.value)}
                  className="input"
                >
                  <option value="">Ei vakuutta</option>
                  <option value="Henkilötakaus">Henkilötakaus</option>
                  <option value="Yrityskiinnitys">Yrityskiinnitys</option>
                  <option value="Pankkitakaus">Pankkitakaus</option>
                </select>
              </div>
              <div>
                <label className="label">Vakuudet ja lisätiedot</label>
                <textarea
                  value={formData.guarantees || ''}
                  onChange={(e) => handleInputChange('guarantees', e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Tarkemmat sopimustiedot vakuuksista..."
                />
              </div>
              <div>
                <label className="label">Erityisehdot</label>
                <textarea
                  value={formData.special_conditions || ''}
                  onChange={(e) => handleInputChange('special_conditions', e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Mahdolliset erityisehdot sopimukseen..."
                />
              </div>
              
              {/* Pankkitiedot */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3">Maksutiedot (valinnainen)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Pankin nimi</label>
                    <input
                      type="text"
                      value={formData.bank_name || ''}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      className="input"
                      placeholder="Nordea, OP, Danske Bank..."
                    />
                  </div>
                  <div>
                    <label className="label">IBAN</label>
                    <input
                      type="text"
                      value={formData.bank_iban || ''}
                      onChange={(e) => handleInputChange('bank_iban', e.target.value)}
                      className="input font-mono"
                      placeholder="FI00 0000 0000 0000 00"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="label">BIC/SWIFT</label>
                  <input
                    type="text"
                    value={formData.bank_bic || ''}
                    onChange={(e) => handleInputChange('bank_bic', e.target.value)}
                    className="input font-mono w-48"
                    placeholder="NDEAFIHH"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="label">Viesti asiakkaalle</label>
                <textarea
                  value={formData.message_to_customer || ''}
                  onChange={(e) => handleInputChange('message_to_customer', e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Tervehdys ja ohjeet asiakkaalle..."
                />
              </div>
              <div>
                <label className="label">Sisäiset muistiinpanot</label>
                <textarea
                  value={formData.internal_notes || ''}
                  onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                  className="input min-h-[60px]"
                  placeholder="Sisäiset muistiinpanot (ei näy asiakkaalle)..."
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between items-center">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Peruuta
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Luodaan...' : 'Luo sopimus'}
        </button>
      </div>
    </motion.div>
  );
}

