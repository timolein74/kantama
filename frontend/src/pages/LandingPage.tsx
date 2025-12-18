import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Check,
  FileText,
  Shield,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  Calculator,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  Building2
} from 'lucide-react';
import { applications, ytj, CompanyInfo, CompanySearchResult } from '../lib/api';

// Form schemas
const leasingSchema = z.object({
  company_name: z.string().min(2, 'Yrityksen nimi vaaditaan'),
  business_id: z.string().regex(/^\d{7}-\d$/, 'Virheellinen Y-tunnus'),
  contact_email: z.string().email('Virheellinen sähköposti'),
  contact_phone: z.string().optional(),
  password: z.string().min(6, 'Salasanan on oltava vähintään 6 merkkiä'),
  equipment_price: z.number().min(1000, 'Vähimmäissumma 1 000 €'),
  requested_term_months: z.number().optional(),
  additional_info: z.string().optional(),
  link_to_item: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected'), // Bot protection
});

const saleLeasebackSchema = z.object({
  company_name: z.string().min(2, 'Yrityksen nimi vaaditaan'),
  business_id: z.string().regex(/^\d{7}-\d$/, 'Virheellinen Y-tunnus'),
  contact_email: z.string().email('Virheellinen sähköposti'),
  contact_phone: z.string().optional(),
  password: z.string().min(6, 'Salasanan on oltava vähintään 6 merkkiä'),
  equipment_description: z.string().min(10, 'Kuvaa kohde tarkemmin'),
  year_model: z.number().min(1990, 'Vuosimalli vaaditaan').max(new Date().getFullYear() + 1, 'Virheellinen vuosimalli'),
  hours: z.number().min(0, 'Tunnit vaaditaan').optional(),
  kilometers: z.number().min(0).optional(),
  current_value: z.number().min(1000, 'Vähimmäissumma 1 000 €'),
  requested_term_months: z.number().optional(),
  additional_info: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected'), // Bot protection
});

type LeasingFormData = z.infer<typeof leasingSchema>;
type SaleLeasebackFormData = z.infer<typeof saleLeasebackSchema>;

export default function LandingPage() {
  const [activeForm, setActiveForm] = useState<'leasing' | 'slb'>('leasing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [slbImageFile, setSlbImageFile] = useState<File | null>(null);

  // YTJ lookup state (by business ID)
  const [ytjLoading, setYtjLoading] = useState(false);
  const [ytjStatus, setYtjStatus] = useState<'idle' | 'success' | 'error' | 'inactive'>('idle');
  const [ytjCompany, setYtjCompany] = useState<CompanyInfo | null>(null);
  
  // YTJ name search state
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [nameSearchResults, setNameSearchResults] = useState<CompanySearchResult[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [activeNameField, setActiveNameField] = useState<'leasing' | 'slb' | null>(null);
  const nameDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(e.target as Node)) {
        setShowNameDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const leasingForm = useForm<LeasingFormData>({
    resolver: zodResolver(leasingSchema),
    defaultValues: {
      requested_term_months: 36,
      honeypot: '',
    },
  });

  const slbForm = useForm<SaleLeasebackFormData>({
    resolver: zodResolver(saleLeasebackSchema),
    defaultValues: {
      requested_term_months: 36,
      year_model: new Date().getFullYear() - 2,
      honeypot: '',
    },
  });

  // Y-tunnus lookup function (by business ID)
  const lookupCompany = useCallback(async (businessId: string, formType: 'leasing' | 'slb') => {
    // Validate format first
    const pattern = /^\d{7}-\d$/;
    if (!pattern.test(businessId)) {
      setYtjStatus('idle');
      return;
    }

    setYtjLoading(true);
    setYtjStatus('idle');
    
    try {
      const response = await ytj.getCompanyInfo(businessId);
      const company = response.data;
      setYtjCompany(company);
      
      if (!company.is_active || company.is_liquidated) {
        setYtjStatus('inactive');
        toast.error('Yritys ei ole aktiivinen tai on selvitystilassa');
        return;
      }
      
      setYtjStatus('success');
      
      // Auto-fill company name
      if (company.name) {
        if (formType === 'leasing') {
          leasingForm.setValue('company_name', company.name);
        } else {
          slbForm.setValue('company_name', company.name);
        }
        toast.success(`Yritystiedot haettu: ${company.name}`);
      }
    } catch (error: any) {
      setYtjStatus('error');
      if (error.response?.status === 404) {
        toast.error('Yritystä ei löytynyt Y-tunnuksella');
      } else {
        console.error('YTJ lookup error:', error);
      }
    } finally {
      setYtjLoading(false);
    }
  }, [leasingForm, slbForm]);

  // Company name search function
  const searchCompanyByName = useCallback(async (name: string, formType: 'leasing' | 'slb') => {
    if (name.length < 2) {
      setNameSearchResults([]);
      setShowNameDropdown(false);
      return;
    }

    setNameSearchLoading(true);
    setActiveNameField(formType);
    
    try {
      const response = await ytj.searchByName(name, 8);
      setNameSearchResults(response.data.results);
      setShowNameDropdown(response.data.results.length > 0);
    } catch (error) {
      console.error('Company name search error:', error);
      setNameSearchResults([]);
      setShowNameDropdown(false);
    } finally {
      setNameSearchLoading(false);
    }
  }, []);

  // Select company from dropdown
  const selectCompany = useCallback((company: CompanySearchResult, formType: 'leasing' | 'slb') => {
    if (formType === 'leasing') {
      leasingForm.setValue('company_name', company.name);
      leasingForm.setValue('business_id', company.business_id);
    } else {
      slbForm.setValue('company_name', company.name);
      slbForm.setValue('business_id', company.business_id);
    }
    
    setShowNameDropdown(false);
    setNameSearchResults([]);
    
    if (!company.is_active || company.is_liquidated) {
      setYtjStatus('inactive');
      toast.error('Yritys ei ole aktiivinen tai on selvitystilassa');
    } else {
      setYtjStatus('success');
      toast.success(`Valittu: ${company.name}`);
    }
  }, [leasingForm, slbForm]);

  // Debounced Y-tunnus lookup (leasing form)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = leasingForm.watch((value, { name }) => {
      if (name === 'business_id' && value.business_id) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lookupCompany(value.business_id!, 'leasing');
        }, 500);
      }
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [leasingForm, lookupCompany]);

  // Debounced Y-tunnus lookup (slb form)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = slbForm.watch((value, { name }) => {
      if (name === 'business_id' && value.business_id) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lookupCompany(value.business_id!, 'slb');
        }, 500);
      }
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [slbForm, lookupCompany]);

  // Debounced company name search handler
  const nameSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleCompanyNameChange = useCallback((value: string, formType: 'leasing' | 'slb') => {
    // Clear any existing timeout
    if (nameSearchTimeoutRef.current) {
      clearTimeout(nameSearchTimeoutRef.current);
    }
    
    // If less than 2 characters, hide dropdown
    if (value.length < 2) {
      setNameSearchResults([]);
      setShowNameDropdown(false);
      return;
    }
    
    // Set new timeout for debounced search
    nameSearchTimeoutRef.current = setTimeout(() => {
      searchCompanyByName(value, formType);
    }, 400);
  }, [searchCompanyByName]);

  const handleLeasingSubmit = async (data: LeasingFormData) => {
    // Bot protection
    if (data.honeypot) {
      toast.error('Virhe hakemuksen lähetyksessä');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { honeypot, ...submitData } = data;
      
      // Include YTJ company data if available
      const submitPayload = {
        ...submitData,
        ytj_data: ytjCompany || undefined,
      };
      
      await applications.createPublicLeasing(submitPayload);
      setSubmitted(true);
      toast.success('Hakemus lähetetty! Tarkista sähköpostisi.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe hakemuksen lähetyksessä');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSLBSubmit = async (data: SaleLeasebackFormData) => {
    // Bot protection
    if (data.honeypot) {
      toast.error('Virhe hakemuksen lähetyksessä');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { honeypot, ...submitData } = data;
      
      // Include YTJ company data if available
      const submitPayload = {
        ...submitData,
        ytj_data: ytjCompany || undefined,
      };
      
      await applications.createPublicSaleLeaseback(submitPayload);
      setSubmitted(true);
      toast.success('Hakemus lähetetty! Tarkista sähköpostisi.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe hakemuksen lähetyksessä');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-hero-pattern flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-lg shadow-2xl"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-midnight-900 mb-4">
            Kiitos hakemuksestasi!
          </h2>
          <p className="text-slate-600 mb-4">
            Hakemuksesi on vastaanotettu ja käsittelemme sen mahdollisimman pian.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-blue-800 font-medium mb-1">
              📧 Vahvistuslinkki lähetetty!
            </p>
            <p className="text-blue-700 text-sm">
              Olemme lähettäneet vahvistuslinkin ilmoittamaasi sähköpostiosoitteeseen. 
              Käy vahvistamassa tilisi, niin pääset seuraamaan hakemuksen käsittelyä reaaliajassa.
            </p>
          </div>
          <a
            href="/login"
            className="btn-primary w-full py-4 text-lg inline-flex items-center justify-center"
          >
            Kirjaudu Kantama-tilille
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 text-slate-500 hover:text-slate-700 text-sm"
          >
            ← Lähetä uusi hakemus
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-hero-pattern">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-Kantama-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
                Yritysrahoitusta
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  {' '}helposti
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-lg">
                Leasing ja Sale-Leaseback ratkaisut yrityksesi tarpeisiin. 
                Hae rahoitusta nopeasti ja helposti.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <a
                  href="#forms"
                  className="btn-primary text-lg px-8 py-4"
                >
                  Hae rahoitusta
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="btn bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-4"
                >
                  Näin se toimii
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: '50M€', label: 'Rahoitettu' },
                  { value: '500+', label: 'Asiakasta' },
                  { value: '24h', label: 'Vastausaika' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl md:text-3xl font-display font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Form card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              id="forms"
              className="scroll-mt-20"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Form tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveForm('leasing')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${
                      activeForm === 'leasing'
                        ? 'bg-Kantama-50 text-Kantama-600 border-b-2 border-Kantama-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Leasing
                  </button>
                  <button
                    onClick={() => setActiveForm('slb')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${
                      activeForm === 'slb'
                        ? 'bg-Kantama-50 text-Kantama-600 border-b-2 border-Kantama-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5 inline mr-2" />
                    Sale-Leaseback
                  </button>
                </div>

                {/* Form content */}
                <div className="p-6 md:p-8">
                  {activeForm === 'leasing' ? (
                    <form onSubmit={leasingForm.handleSubmit(handleLeasingSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Yrityksen nimi ENSIN (vasemmalla) */}
                        <div className="relative" ref={activeNameField === 'leasing' ? nameDropdownRef : undefined}>
                          <label className="label">Yrityksen nimi *</label>
                          <div className="relative">
                            <input
                              {...leasingForm.register('company_name')}
                              className={`input pr-10 ${ytjStatus === 'success' ? 'bg-green-50' : ''}`}
                              placeholder="Kirjoita yrityksen nimi..."
                              onFocus={() => setActiveNameField('leasing')}
                              onInput={(e) => handleCompanyNameChange((e.target as HTMLInputElement).value, 'leasing')}
                              autoComplete="off"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {nameSearchLoading && activeNameField === 'leasing' ? (
                                <Loader2 className="w-5 h-5 text-Kantama-600 animate-spin" />
                              ) : (
                                <Search className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                          {/* Dropdown for search results */}
                          {showNameDropdown && activeNameField === 'leasing' && nameSearchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {nameSearchResults.map((company, idx) => (
                                <button
                                  key={company.business_id}
                                  type="button"
                                  onClick={() => selectCompany(company, 'leasing')}
                                  className={`w-full text-left px-4 py-3 hover:bg-Kantama-50 transition-colors ${
                                    idx !== nameSearchResults.length - 1 ? 'border-b border-slate-100' : ''
                                  } ${!company.is_active || company.is_liquidated ? 'opacity-60' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-midnight-900">{company.name}</div>
                                      <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span>{company.business_id}</span>
                                        {company.company_form && (
                                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                            {company.company_form}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {!company.is_active || company.is_liquidated ? (
                                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        Ei aktiivinen
                                      </span>
                                    ) : (
                                      <Building2 className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {leasingForm.formState.errors.company_name && (
                            <p className="text-red-500 text-sm mt-1">
                              {leasingForm.formState.errors.company_name.message}
                            </p>
                          )}
                        </div>
                        {/* Y-tunnus (oikealla) */}
                        <div>
                          <label className="label">Y-tunnus *</label>
                          <div className="relative">
                            <input
                              {...leasingForm.register('business_id')}
                              className={`input pr-10 ${
                                ytjStatus === 'success' ? 'border-green-500 bg-green-50' :
                                ytjStatus === 'error' ? 'border-red-500 bg-red-50' :
                                ytjStatus === 'inactive' ? 'border-orange-500 bg-orange-50' : ''
                              }`}
                              placeholder="1234567-8"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {ytjLoading && <Loader2 className="w-5 h-5 text-Kantama-600 animate-spin" />}
                              {!ytjLoading && ytjStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                              {!ytjLoading && ytjStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                              {!ytjLoading && ytjStatus === 'inactive' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                            </div>
                          </div>
                          {leasingForm.formState.errors.business_id && (
                            <p className="text-red-500 text-sm mt-1">
                              {leasingForm.formState.errors.business_id.message}
                            </p>
                          )}
                          {ytjStatus === 'success' && ytjCompany && (
                            <p className="text-green-600 text-sm mt-1 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Yritystiedot haettu PRH:sta
                            </p>
                          )}
                          {ytjStatus === 'inactive' && (
                            <p className="text-orange-600 text-sm mt-1">
                              ⚠️ Yritys ei ole aktiivinen
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Sähköposti *</label>
                          <input
                            {...leasingForm.register('contact_email')}
                            type="email"
                            className="input"
                            placeholder="email@yritys.fi"
                          />
                          {leasingForm.formState.errors.contact_email && (
                            <p className="text-red-500 text-sm mt-1">
                              {leasingForm.formState.errors.contact_email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="label">Puhelin</label>
                          <input
                            {...leasingForm.register('contact_phone')}
                            className="input"
                            placeholder="+358 40 123 4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Salasana (kirjautumista varten) *</label>
                        <input
                          {...leasingForm.register('password')}
                          type="password"
                          className="input"
                          placeholder="Vähintään 6 merkkiä"
                        />
                        {leasingForm.formState.errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {leasingForm.formState.errors.password.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Tarvitset tämän salasanan kirjautuaksesi seuraamaan hakemustasi
                        </p>
                      </div>

                      <div>
                        <label className="label">Hankintahinta (€) *</label>
                        <input
                          {...leasingForm.register('equipment_price', { valueAsNumber: true })}
                          type="number"
                          className="input"
                          placeholder="150000"
                        />
                        {leasingForm.formState.errors.equipment_price && (
                          <p className="text-red-500 text-sm mt-1">
                            {leasingForm.formState.errors.equipment_price.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="label">Toivottu sopimuskausi</label>
                        <select
                          {...leasingForm.register('requested_term_months', { valueAsNumber: true })}
                          className="input"
                        >
                          <option value={12}>12 kuukautta</option>
                          <option value={24}>24 kuukautta</option>
                          <option value={36}>36 kuukautta</option>
                          <option value={48}>48 kuukautta</option>
                          <option value={60}>60 kuukautta</option>
                          <option value={72}>72 kuukautta</option>
                          <option value={84}>84 kuukautta</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Linkki kohteeseen</label>
                        <input
                          {...leasingForm.register('link_to_item')}
                          className="input"
                          placeholder="https://www.toimittaja.fi/tuote/12345"
                        />
                      </div>

                      <div>
                        <label className="label">Tarjousliite (PDF)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                          className="input py-2"
                        />
                        {quoteFile && (
                          <p className="text-sm text-slate-500 mt-1">{quoteFile.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Lisätiedot</label>
                        <textarea
                          {...leasingForm.register('additional_info')}
                          className="input min-h-[80px]"
                          placeholder="Muita huomioita, esim. erikoisvaatimukset..."
                        />
                      </div>

                      {/* Honeypot - hidden from users */}
                      <input
                        {...leasingForm.register('honeypot')}
                        type="text"
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full py-4 text-lg"
                      >
                        {isSubmitting ? 'Lähetetään...' : 'Lähetä hakemus'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={slbForm.handleSubmit(handleSLBSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Yrityksen nimi ENSIN (vasemmalla) */}
                        <div className="relative" ref={activeNameField === 'slb' ? nameDropdownRef : undefined}>
                          <label className="label">Yrityksen nimi *</label>
                          <div className="relative">
                            <input
                              {...slbForm.register('company_name')}
                              className={`input pr-10 ${ytjStatus === 'success' ? 'bg-green-50' : ''}`}
                              placeholder="Kirjoita yrityksen nimi..."
                              onFocus={() => setActiveNameField('slb')}
                              onInput={(e) => handleCompanyNameChange((e.target as HTMLInputElement).value, 'slb')}
                              autoComplete="off"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {nameSearchLoading && activeNameField === 'slb' ? (
                                <Loader2 className="w-5 h-5 text-Kantama-600 animate-spin" />
                              ) : (
                                <Search className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                          {/* Dropdown for search results */}
                          {showNameDropdown && activeNameField === 'slb' && nameSearchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {nameSearchResults.map((company, idx) => (
                                <button
                                  key={company.business_id}
                                  type="button"
                                  onClick={() => selectCompany(company, 'slb')}
                                  className={`w-full text-left px-4 py-3 hover:bg-Kantama-50 transition-colors ${
                                    idx !== nameSearchResults.length - 1 ? 'border-b border-slate-100' : ''
                                  } ${!company.is_active || company.is_liquidated ? 'opacity-60' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-midnight-900">{company.name}</div>
                                      <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span>{company.business_id}</span>
                                        {company.company_form && (
                                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                            {company.company_form}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {!company.is_active || company.is_liquidated ? (
                                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        Ei aktiivinen
                                      </span>
                                    ) : (
                                      <Building2 className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {slbForm.formState.errors.company_name && (
                            <p className="text-red-500 text-sm mt-1">
                              {slbForm.formState.errors.company_name.message}
                            </p>
                          )}
                        </div>
                        {/* Y-tunnus (oikealla) */}
                        <div>
                          <label className="label">Y-tunnus *</label>
                          <div className="relative">
                            <input
                              {...slbForm.register('business_id')}
                              className={`input pr-10 ${
                                ytjStatus === 'success' ? 'border-green-500 bg-green-50' :
                                ytjStatus === 'error' ? 'border-red-500 bg-red-50' :
                                ytjStatus === 'inactive' ? 'border-orange-500 bg-orange-50' : ''
                              }`}
                              placeholder="1234567-8"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {ytjLoading && <Loader2 className="w-5 h-5 text-Kantama-600 animate-spin" />}
                              {!ytjLoading && ytjStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                              {!ytjLoading && ytjStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                              {!ytjLoading && ytjStatus === 'inactive' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                            </div>
                          </div>
                          {slbForm.formState.errors.business_id && (
                            <p className="text-red-500 text-sm mt-1">
                              {slbForm.formState.errors.business_id.message}
                            </p>
                          )}
                          {ytjStatus === 'success' && ytjCompany && (
                            <p className="text-green-600 text-sm mt-1 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Yritystiedot haettu PRH:sta
                            </p>
                          )}
                          {ytjStatus === 'inactive' && (
                            <p className="text-orange-600 text-sm mt-1">
                              ⚠️ Yritys ei ole aktiivinen
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Sähköposti *</label>
                          <input
                            {...slbForm.register('contact_email')}
                            type="email"
                            className="input"
                            placeholder="email@yritys.fi"
                          />
                          {slbForm.formState.errors.contact_email && (
                            <p className="text-red-500 text-sm mt-1">
                              {slbForm.formState.errors.contact_email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="label">Puhelin</label>
                          <input
                            {...slbForm.register('contact_phone')}
                            className="input"
                            placeholder="+358 40 123 4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Salasana (kirjautumista varten) *</label>
                        <input
                          {...slbForm.register('password')}
                          type="password"
                          className="input"
                          placeholder="Vähintään 6 merkkiä"
                        />
                        {slbForm.formState.errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {slbForm.formState.errors.password.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Tarvitset tämän salasanan kirjautuaksesi seuraamaan hakemustasi
                        </p>
                      </div>

                      <div>
                        <label className="label">Myytävä kohde *</label>
                        <input
                          {...slbForm.register('equipment_description')}
                          className="input"
                          placeholder="Esim. CNC-koneistuskeskus Mazak"
                        />
                        {slbForm.formState.errors.equipment_description && (
                          <p className="text-red-500 text-sm mt-1">
                            {slbForm.formState.errors.equipment_description.message}
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Vuosimalli *</label>
                          <input
                            {...slbForm.register('year_model', { valueAsNumber: true })}
                            type="number"
                            className="input"
                            placeholder="2022"
                          />
                          {slbForm.formState.errors.year_model && (
                            <p className="text-red-500 text-sm mt-1">
                              {slbForm.formState.errors.year_model.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="label">Tunnit</label>
                          <input
                            {...slbForm.register('hours', { valueAsNumber: true })}
                            type="number"
                            className="input"
                            placeholder="2500"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Kilometrit</label>
                          <input
                            {...slbForm.register('kilometers', { valueAsNumber: true })}
                            type="number"
                            className="input"
                            placeholder="150000"
                          />
                        </div>
                        <div>
                          <label className="label">Nykyarvo (€) *</label>
                          <input
                            {...slbForm.register('current_value', { valueAsNumber: true })}
                            type="number"
                            className="input"
                            placeholder="150000"
                          />
                          {slbForm.formState.errors.current_value && (
                            <p className="text-red-500 text-sm mt-1">
                              {slbForm.formState.errors.current_value.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="label">Toivottu sopimuskausi</label>
                        <select
                          {...slbForm.register('requested_term_months', { valueAsNumber: true })}
                          className="input"
                        >
                          <option value={12}>12 kuukautta</option>
                          <option value={24}>24 kuukautta</option>
                          <option value={36}>36 kuukautta</option>
                          <option value={48}>48 kuukautta</option>
                          <option value={60}>60 kuukautta</option>
                          <option value={72}>72 kuukautta</option>
                          <option value={84}>84 kuukautta</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Kuva kohteesta</label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => setSlbImageFile(e.target.files?.[0] || null)}
                          className="input py-2"
                        />
                        {slbImageFile && (
                          <p className="text-sm text-slate-500 mt-1">{slbImageFile.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Lisätiedot</label>
                        <textarea
                          {...slbForm.register('additional_info')}
                          className="input min-h-[80px]"
                          placeholder="Muita huomioita esim. varusteet"
                        />
                      </div>

                      {/* Honeypot - hidden from users */}
                      <input
                        {...slbForm.register('honeypot')}
                        type="text"
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full py-4 text-lg"
                      >
                        {isSubmitting ? 'Lähetetään...' : 'Lähetä hakemus'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-midnight-900 mb-4">
              Näin se toimii
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Yksinkertainen prosessi rahoituksen saamiseen
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: FileText,
                title: '1. Täytä hakemus',
                description: 'Täytä lomake yllä ja lähetä hakemus',
              },
              {
                icon: Shield,
                title: '2. Vahvista tili',
                description: 'Vahvista sähköpostisi ja saat tunnukset',
              },
              {
                icon: Calculator,
                title: '3. Saat tarjouksen',
                description: 'Saat räätälöidyn rahoitustarjouksen',
              },
              {
                icon: Check,
                title: '4. Allekirjoita',
                description: 'Hyväksy tarjous ja allekirjoita sopimus',
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-Kantama-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-Kantama-600" />
                </div>
                <h3 className="text-lg font-semibold text-midnight-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Leasing */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              id="leasing"
              className="card-hover scroll-mt-20"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-midnight-900 mb-4">
                Leasing
              </h3>
              <p className="text-slate-600 mb-6">
                Rahoita uudet koneet ja laitteet leasingilla. Pidät käyttöpääoman 
                vapaana ja maksat vain käytöstä.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Ei sidottua pääomaa',
                  'Ennustettavat kuukausierät',
                  'Veroedut',
                  'Joustava sopimuskausi',
                ].map((item) => (
                  <li key={item} className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#forms" className="btn-primary">
                Hae leasing-rahoitusta
              </a>
            </motion.div>

            {/* Sale-Leaseback */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              id="sale-leaseback"
              className="card-hover scroll-mt-20"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <RefreshCw className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-midnight-900 mb-4">
                Sale-Leaseback
              </h3>
              <p className="text-slate-600 mb-6">
                Vapauta pääomaa myymällä nykyiset koneesi ja vuokraamalla ne takaisin. 
                Käyttö jatkuu normaalisti.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Vapauta sidottua pääomaa',
                  'Parantaa kassavirtaa',
                  'Käyttö jatkuu keskeytyksettä',
                  'Joustava sopimuskausi',
                ].map((item) => (
                  <li key={item} className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#forms" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                Hae sale-leaseback
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-midnight-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Luotettava kumppani yritysrahoituksessa
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Nopea prosessi', desc: 'Tarjous 24h sisällä' },
              { icon: Shield, title: 'Luotettava', desc: 'Yhteistyössä johtavien rahoittajien kanssa' },
              { icon: Clock, title: 'Helppo', desc: 'Yksi hakemus, monta tarjousta' },
            ].map((item) => (
              <div key={item.title} className="p-6">
                <item.icon className="w-10 h-10 text-Kantama-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

