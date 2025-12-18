import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Send,
  TrendingUp,
  RefreshCw,
  Euro,
  MessageSquare,
  FileCheck,
  Clock,
  CheckCircle,
  Download,
  Printer,
  Eye,
  X
} from 'lucide-react';
import { applications, financiers, assignments, offers, contracts, infoRequests } from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getApplicationTypeLabel,
  getOfferStatusLabel,
  getContractStatusLabel
} from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ContractDocument } from '../../components/contract';
import YTJInfoCard from '../../components/YTJInfoCard';
import type { Application, Financier, Offer, InfoRequest } from '../../types';
import type { Contract } from '../../types/contract';
import type { CompanyInfo } from '../../lib/api';

interface Assignment {
  id: number;
  application_id: number;
  financier_id: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [financierList, setFinancierList] = useState<Financier[]>([]);
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [offerList, setOfferList] = useState<Offer[]>([]);
  const [contractList, setContractList] = useState<Contract[]>([]);
  const [infoRequestList, setInfoRequestList] = useState<InfoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Assignment form
  const [selectedFinancierId, setSelectedFinancierId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'details' | 'financiers' | 'offers' | 'contracts' | 'messages'>('details');
  
  // Contract modal
  const [showContractModal, setShowContractModal] = useState<Contract | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const contractDocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [appRes, financiersRes, assignmentsRes, offersRes, contractsRes, infoRes] = await Promise.all([
          applications.get(parseInt(id)),
          financiers.listActive(),
          assignments.getForApplication(parseInt(id)),
          offers.getForApplication(parseInt(id)),
          contracts.getForApplication(parseInt(id)),
          infoRequests.getForApplication(parseInt(id))
        ]);
        
        setApplication(appRes.data);
        setFinancierList(financiersRes.data);
        setAssignmentList(assignmentsRes.data);
        setOfferList(offersRes.data);
        setContractList(contractsRes.data);
        setInfoRequestList(infoRes.data);
      } catch (error) {
        toast.error('Virhe hakemuksen latauksessa');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleAssignToFinancier = async () => {
    if (!selectedFinancierId || !id) {
      toast.error('Valitse rahoittaja');
      return;
    }
    
    setIsAssigning(true);
    try {
      await assignments.create({
        application_id: parseInt(id),
        financier_id: selectedFinancierId,
        notes: assignmentNotes || undefined
      });
      
      toast.success('Hakemus lähetetty rahoittajalle');
      setSelectedFinancierId(null);
      setAssignmentNotes('');
      
      // Refresh data
      const [appRes, assignmentsRes] = await Promise.all([
        applications.get(parseInt(id)),
        assignments.getForApplication(parseInt(id))
      ]);
      setApplication(appRes.data);
      setAssignmentList(assignmentsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe hakemuksen lähetyksessä');
    } finally {
      setIsAssigning(false);
    }
  };

  const getFinancierName = (financierId: number) => {
    const financier = financierList.find(f => f.id === financierId);
    return financier?.name || 'Tuntematon';
  };

  const handlePrintContract = (contract: Contract) => {
    setPreviewContract(contract);
    setTimeout(() => {
      if (contractDocRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Sopimus ${contract.contract_number || contract.id}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                body { font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              ${contractDocRef.current.innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    }, 100);
  };

  // Filter out already assigned financiers
  const availableFinanciers = financierList.filter(
    f => !assignmentList.some(a => a.financier_id === f.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-midnight-900 mb-2">Hakemusta ei löytynyt</h2>
        <Link to="/admin/applications" className="btn-primary mt-4">
          Takaisin hakemuksiin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/applications"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-display font-bold text-midnight-900">
                {application.reference_number}
              </h1>
              <span className={getStatusColor(application.status)}>
                {getStatusLabel(application.status)}
              </span>
            </div>
            <p className="text-slate-600 mt-1">
              {getApplicationTypeLabel(application.application_type)} • {application.company_name}
            </p>
          </div>
        </div>
      </div>

      {/* Action card - Assign to financier */}
      {application.status === 'SUBMITTED' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-2 border-orange-200 bg-orange-50"
        >
          <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
            <Send className="w-5 h-5 mr-2" />
            Lähetä rahoittajalle käsittelyyn
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="label">Valitse rahoittaja</label>
              <select
                value={selectedFinancierId || ''}
                onChange={(e) => setSelectedFinancierId(e.target.value ? parseInt(e.target.value) : null)}
                className="input"
              >
                <option value="">-- Valitse --</option>
                {availableFinanciers.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="label">Muistiinpanot (valinnainen)</label>
              <input
                type="text"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Viesti rahoittajalle..."
                className="input"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleAssignToFinancier}
                disabled={!selectedFinancierId || isAssigning}
                className="btn-primary w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isAssigning ? 'Lähetetään...' : 'Lähetä rahoittajalle'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'details', label: 'Tiedot', icon: FileText },
            { id: 'financiers', label: 'Rahoittajat', icon: Building2, count: assignmentList.length },
            { id: 'offers', label: 'Tarjoukset', icon: Euro, count: offerList.length },
            { id: 'contracts', label: 'Sopimukset', icon: FileCheck, count: contractList.length },
            { id: 'messages', label: 'Viestit', icon: MessageSquare, count: infoRequestList.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-Kantama-600 text-Kantama-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'details' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Application info */}
            <div className="card">
              <h3 className="font-semibold text-midnight-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-Kantama-600" />
                Hakemuksen tiedot
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tyyppi</dt>
                  <dd className="font-medium text-midnight-900">
                    <span className={`inline-flex items-center ${
                      application.application_type === 'LEASING' ? 'text-blue-600' : 'text-emerald-600'
                    }`}>
                      {application.application_type === 'LEASING' ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      {getApplicationTypeLabel(application.application_type)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Kohde</dt>
                  <dd className="font-medium text-midnight-900 text-right max-w-xs">{application.equipment_description}</dd>
                </div>
                {application.equipment_supplier && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Toimittaja</dt>
                    <dd className="font-medium text-midnight-900">{application.equipment_supplier}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Summa</dt>
                  <dd className="font-bold text-lg text-midnight-900">{formatCurrency(application.equipment_price)}</dd>
                </div>
                {application.requested_term_months && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Toivottu sopimuskausi</dt>
                    <dd className="font-medium text-midnight-900">{application.requested_term_months} kk</dd>
                  </div>
                )}
                {application.additional_info && (
                  <div className="pt-3 border-t">
                    <dt className="text-slate-500 mb-1">Lisätiedot</dt>
                    <dd className="text-midnight-900">{application.additional_info}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Company info */}
            <div className="card">
              <h3 className="font-semibold text-midnight-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-Kantama-600" />
                Yrityksen tiedot
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Yritys</dt>
                  <dd className="font-medium text-midnight-900">{application.company_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Y-tunnus</dt>
                  <dd className="font-mono text-midnight-900">{application.business_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Yhteyshenkilö</dt>
                  <dd className="font-medium text-midnight-900">{application.contact_person || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Sähköposti</dt>
                  <dd className="font-medium text-midnight-900">
                    <a href={`mailto:${application.contact_email}`} className="text-Kantama-600 hover:text-Kantama-700">
                      {application.contact_email}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Puhelin</dt>
                  <dd className="font-medium text-midnight-900">{application.contact_phone || '-'}</dd>
                </div>
              </dl>
            </div>

            {/* YTJ/PRH Company Data */}
            {application.extra_data?.ytj_data && (
              <div className="lg:col-span-2">
                <YTJInfoCard ytjData={application.extra_data.ytj_data as CompanyInfo} />
              </div>
            )}

            {/* Timeline */}
            <div className="card lg:col-span-2">
              <h3 className="font-semibold text-midnight-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-Kantama-600" />
                Aikajana
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <span className="text-slate-500">Luotu:</span>{' '}
                  <span className="font-medium">{formatDateTime(application.created_at)}</span>
                </div>
                {application.submitted_at && (
                  <div>
                    <span className="text-slate-500">Lähetetty:</span>{' '}
                    <span className="font-medium">{formatDateTime(application.submitted_at)}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Päivitetty:</span>{' '}
                  <span className="font-medium">{formatDateTime(application.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financiers' && (
          <div className="space-y-4">
            {/* Assignment form for non-submitted applications */}
            {application.status !== 'SUBMITTED' && availableFinanciers.length > 0 && (
              <div className="card border border-slate-200">
                <h3 className="font-semibold text-midnight-900 mb-4">Lähetä toiselle rahoittajalle</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <select
                      value={selectedFinancierId || ''}
                      onChange={(e) => setSelectedFinancierId(e.target.value ? parseInt(e.target.value) : null)}
                      className="input"
                    >
                      <option value="">-- Valitse rahoittaja --</option>
                      {availableFinanciers.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Muistiinpanot..."
                      className="input"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleAssignToFinancier}
                      disabled={!selectedFinancierId || isAssigning}
                      className="btn-primary w-full"
                    >
                      {isAssigning ? 'Lähetetään...' : 'Lähetä'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {assignmentList.length === 0 ? (
              <div className="card text-center py-12">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei toimeksiantoja</h3>
                <p className="text-slate-500">Hakemus ei ole vielä lähetetty rahoittajalle.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {assignmentList.map((assignment) => (
                  <div key={assignment.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-midnight-900">{getFinancierName(assignment.financier_id)}</h4>
                      <span className={`badge ${
                        assignment.status === 'PENDING' ? 'badge-yellow' :
                        assignment.status === 'IN_PROGRESS' ? 'badge-blue' :
                        assignment.status === 'COMPLETED' ? 'badge-green' : 'badge-gray'
                      }`}>
                        {assignment.status === 'PENDING' ? 'Odottaa' :
                         assignment.status === 'IN_PROGRESS' ? 'Käsittelyssä' :
                         assignment.status === 'COMPLETED' ? 'Valmis' : assignment.status}
                      </span>
                    </div>
                    {assignment.notes && (
                      <p className="text-sm text-slate-600 mb-2">{assignment.notes}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Lähetetty: {formatDateTime(assignment.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            {offerList.length === 0 ? (
              <div className="card text-center py-12">
                <Euro className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei tarjouksia</h3>
                <p className="text-slate-500">Rahoittaja ei ole vielä tehnyt tarjousta.</p>
              </div>
            ) : (
              offerList.map((offer) => (
                <div key={offer.id} className={`card ${offer.status === 'PENDING_ADMIN' ? 'border-2 border-orange-300 bg-orange-50' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-midnight-900">Tarjous #{offer.id}</h4>
                      <p className="text-sm text-slate-500">
                        Rahoittaja: {getFinancierName(offer.financier_id)}
                      </p>
                    </div>
                    <span className={`badge ${
                      offer.status === 'DRAFT' ? 'badge-gray' :
                      offer.status === 'PENDING_ADMIN' ? 'badge-orange' :
                      offer.status === 'SENT' ? 'badge-blue' :
                      offer.status === 'ACCEPTED' ? 'badge-green' :
                      offer.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'
                    }`}>
                      {getOfferStatusLabel(offer.status)}
                    </span>
                  </div>
                  {/* Tarjouksen tiedot */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kauppasumma:</span>
                        <span className="font-semibold text-midnight-900">{formatCurrency(application.equipment_price)} alv 0 %</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Käsiraha:</span>
                        <span className="font-semibold text-midnight-900">{formatCurrency(offer.upfront_payment || 0)} alv 0 %</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rahoitettava osuus:</span>
                        <span className="font-semibold text-midnight-900">{formatCurrency(application.equipment_price - (offer.upfront_payment || 0))} alv 0 %</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kk-maksu:</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(offer.monthly_payment)} alv 0 %</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sopimusaika:</span>
                        <span className="font-semibold text-midnight-900">{offer.term_months} kk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avausmaksu:</span>
                        <span className="font-semibold text-midnight-900">300 € alv 0 %</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Laskutuslisä:</span>
                        <span className="font-semibold text-midnight-900">9 €/kk</span>
                      </div>
                      {offer.residual_value && application.equipment_price && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Jäännösarvo:</span>
                          <span className="font-semibold text-midnight-900">
                            {((offer.residual_value / application.equipment_price) * 100).toFixed(1)} %
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Luotu:</span>
                        <span className="font-medium text-midnight-900">{formatDate(offer.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">Hintoihin lisätään voimassa oleva arvonlisävero</p>
                  </div>

                  {/* Print button */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const residualPercent = offer.residual_value && application.equipment_price
                            ? ((offer.residual_value / application.equipment_price) * 100).toFixed(1)
                            : null;
                          const financierName = getFinancierName(offer.financier_id);
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Rahoitustarjous - ${application.reference_number}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
                                .logo { display: flex; align-items: center; gap: 12px; }
                                .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; }
                                .section { margin-bottom: 30px; }
                                .section-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e293b; }
                                .info-box { background: #f8fafc; padding: 16px; border-radius: 8px; }
                                table { width: 100%; border-collapse: collapse; }
                                td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
                                .label { color: #64748b; }
                                .value { text-align: right; font-weight: 600; color: #1e293b; }
                                .highlight { background: #ecfdf5; }
                                .highlight .label { color: #059669; font-weight: 500; }
                                .highlight .value { color: #059669; font-size: 20px; font-weight: 700; }
                                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #64748b; font-size: 14px; }
                                .note { font-size: 14px; color: #64748b; font-style: italic; margin-top: 12px; }
                                @media print { body { padding: 20px; } }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="logo">
                                  <div class="logo-icon">e</div>
                                  <div>
                                    <div style="font-size: 24px; font-weight: bold; color: #1e293b;">Kantama</div>
                                    <div style="font-size: 14px; color: #64748b;">Rahoitustarjous</div>
                                  </div>
                                </div>
                                <div style="text-align: right; font-size: 14px; color: #64748b;">
                                  <div><strong>Päivämäärä:</strong> ${new Date().toLocaleDateString('fi-FI')}</div>
                                  <div><strong>Viite:</strong> ${application.reference_number}</div>
                                </div>
                              </div>
                              
                              <div class="section">
                                <div class="section-title">Asiakas</div>
                                <div class="info-box">
                                  <div style="font-weight: 600; color: #1e293b;">${application.company_name}</div>
                                  <div style="color: #64748b;">Y-tunnus: ${application.business_id}</div>
                                </div>
                              </div>

                              <div class="section">
                                <div class="section-title">Rahoittaja</div>
                                <div class="info-box">
                                  <div style="font-weight: 600; color: #1e293b;">${financierName}</div>
                                </div>
                              </div>
                              
                              <div class="section">
                                <div class="section-title">Rahoitustarjous</div>
                                <table>
                                  <tr><td class="label">Kauppasumma:</td><td class="value">${formatCurrency(application.equipment_price)} alv 0 %</td></tr>
                                  <tr><td class="label">Käsiraha:</td><td class="value">${formatCurrency(offer.upfront_payment || 0)} alv 0 %</td></tr>
                                  <tr style="background: #f8fafc;"><td class="label">Rahoitettava osuus:</td><td class="value">${formatCurrency(application.equipment_price - (offer.upfront_payment || 0))} alv 0 %</td></tr>
                                  <tr class="highlight"><td class="label">Kuukausierä:</td><td class="value">${formatCurrency(offer.monthly_payment)} alv 0 %</td></tr>
                                  <tr><td class="label">Sopimusaika:</td><td class="value">${offer.term_months} kk</td></tr>
                                  <tr><td class="label">Avausmaksu:</td><td class="value">300 € alv 0 %</td></tr>
                                  <tr><td class="label">Laskutuslisä:</td><td class="value">9 €/kk</td></tr>
                                  ${residualPercent ? `<tr><td class="label">Jäännösarvo:</td><td class="value">${residualPercent} %</td></tr>` : ''}
                                </table>
                                <p class="note">Hintoihin lisätään voimassa oleva arvonlisävero</p>
                              </div>
                              
                              ${offer.notes_to_customer ? `
                              <div class="section">
                                <div class="section-title">Lisätiedot</div>
                                <div class="info-box">${offer.notes_to_customer}</div>
                              </div>
                              ` : ''}
                              
                              <div class="footer">
                                <p>Tämä on alustava rahoitustarjous. Lopullinen sopimus syntyy vasta erillisellä allekirjoituksella.</p>
                                <p style="margin-top: 8px;">Kantama • myynti@Kantama.fi</p>
                              </div>
                            </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      className="btn-secondary"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Tulosta tarjous
                    </button>
                  </div>
                  
                  {/* Approve button for PENDING_ADMIN offers */}
                  {offer.status === 'PENDING_ADMIN' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-orange-700 font-medium">
                          Tämä tarjous odottaa hyväksyntääsi ennen asiakkaalle lähettämistä.
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              await offers.approve(offer.id);
                              toast.success('Tarjous hyväksytty ja lähetetty asiakkaalle!');
                              // Refresh
                              const [offersRes, appRes] = await Promise.all([
                                offers.getForApplication(parseInt(id!)),
                                applications.get(parseInt(id!))
                              ]);
                              setOfferList(offersRes.data);
                              setApplication(appRes.data);
                            } catch (error: any) {
                              toast.error(error.response?.data?.detail || 'Virhe tarjouksen hyväksymisessä');
                            }
                          }}
                          className="btn-primary"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Hyväksy ja lähetä asiakkaalle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {contractList.length === 0 ? (
              <div className="card text-center py-12">
                <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei sopimuksia</h3>
                <p className="text-slate-500">Sopimuksia ei ole vielä lähetetty.</p>
              </div>
            ) : (
              contractList.map((contract) => (
                <div key={contract.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-midnight-900">
                        Sopimus {contract.contract_number || `#${contract.id}`}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Rahoittaja: {getFinancierName(contract.financier_id)}
                      </p>
                    </div>
                    <span className={`badge ${
                      contract.status === 'DRAFT' ? 'badge-gray' :
                      contract.status === 'SENT' ? 'badge-purple' :
                      contract.status === 'SIGNED' ? 'badge-green' : 'badge-red'
                    }`}>
                      {getContractStatusLabel(contract.status)}
                    </span>
                  </div>

                  {/* Contract summary */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block">Vuokralleottaja</span>
                        <span className="font-semibold text-midnight-900">
                          {contract.lessee_company_name || application?.company_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Vuokraerä</span>
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(contract.monthly_rent || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sopimuskausi</span>
                        <span className="font-semibold">{contract.lease_period_months || 0} kk</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jäännösarvo</span>
                        <span className="font-semibold">{formatCurrency(contract.residual_value || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-500 mb-4">
                    Luotu: {formatDateTime(contract.created_at)}
                    {contract.sent_at && ` • Lähetetty: ${formatDateTime(contract.sent_at)}`}
                    {contract.signed_at && ` • Allekirjoitettu: ${formatDateTime(contract.signed_at)}`}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowContractModal(contract)}
                        className="btn-secondary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Näytä sopimus
                      </button>
                      <button
                        onClick={() => handlePrintContract(contract)}
                        className="btn-ghost"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Tulosta
                      </button>
                    </div>
                    {contract.contract_file_id && (
                      <button className="btn-ghost">
                        <Download className="w-4 h-4 mr-1" />
                        Lataa liite
                      </button>
                    )}
                  </div>

                  {contract.status === 'SIGNED' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">
                          Sopimus allekirjoitettu {contract.lessee_signer_name && `(${contract.lessee_signer_name})`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Hidden contract document for printing */}
            {previewContract && application && (
              <div className="hidden">
                <ContractDocument
                  ref={contractDocRef}
                  contract={previewContract}
                  application={application}
                />
              </div>
            )}

            {/* Contract Modal - Full screen preview */}
            {showContractModal && application && (
              <div className="fixed inset-0 bg-black/70 z-50 overflow-auto p-4 flex items-start justify-center">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 relative">
                  <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-xl z-10">
                    <h3 className="font-bold text-lg text-midnight-900">
                      Rahoitusleasingsopimus {showContractModal.contract_number}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handlePrintContract(showContractModal)}
                        className="btn-secondary text-sm"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Tulosta PDF
                      </button>
                      <button
                        onClick={() => setShowContractModal(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 overflow-auto max-h-[80vh]">
                    <ContractDocument
                      contract={showContractModal}
                      application={application}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {infoRequestList.length === 0 ? (
              <div className="card text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei viestejä</h3>
                <p className="text-slate-500">Lisätietopyynnöt näkyvät tässä.</p>
              </div>
            ) : (
              infoRequestList.map((ir) => (
                <div key={ir.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-midnight-900">Lisätietopyyntö</h4>
                      <p className="text-sm text-slate-500">
                        Rahoittaja: {getFinancierName(ir.financier_id)}
                      </p>
                    </div>
                    <span className={`badge ${
                      ir.status === 'PENDING' ? 'badge-yellow' :
                      ir.status === 'RESPONDED' ? 'badge-green' : 'badge-gray'
                    }`}>
                      {ir.status === 'PENDING' ? 'Odottaa' :
                       ir.status === 'RESPONDED' ? 'Vastattu' : 'Suljettu'}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <p className="text-slate-700">{ir.message}</p>
                  </div>
                  {ir.responses && ir.responses.length > 0 && (
                    <div className="space-y-2">
                      {ir.responses.map((resp) => (
                        <div key={resp.id} className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-600 mb-1">
                            {resp.user.first_name || resp.user.email} • {formatDateTime(resp.created_at)}
                          </p>
                          <p className="text-blue-800">{resp.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


