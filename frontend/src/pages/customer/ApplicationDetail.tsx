import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Calendar,
  Euro,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Send,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Printer,
  Edit,
  Eye,
  X
} from 'lucide-react';
import { applications, offers, contracts, infoRequests, files } from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getApplicationTypeLabel,
  getOfferStatusLabel,
  formatFileSize
} from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ContractDocument } from '../../components/contract';
import type { Application, Offer, InfoRequest } from '../../types';
import type { Contract } from '../../types/contract';

export default function CustomerApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [offerList, setOfferList] = useState<Offer[]>([]);
  const [contractList, setContractList] = useState<Contract[]>([]);
  const [infoRequestList, setInfoRequestList] = useState<InfoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'contracts' | 'messages'>('details');
  
  // Info request response
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  
  // Contract upload
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState<Contract | null>(null);
  const contractDocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [appRes, offersRes, contractsRes, infoRes] = await Promise.all([
          applications.get(parseInt(id)),
          offers.getForApplication(parseInt(id)),
          contracts.getForApplication(parseInt(id)),
          infoRequests.getForApplication(parseInt(id))
        ]);
        
        setApplication(appRes.data);
        setOfferList(offersRes.data);
        setContractList(contractsRes.data);
        setInfoRequestList(infoRes.data);
        
        // Auto-select tab based on status
        if (appRes.data.status === 'INFO_REQUESTED') {
          setActiveTab('messages');
        } else if (['OFFER_SENT', 'OFFER_ACCEPTED'].includes(appRes.data.status)) {
          setActiveTab('offers');
        } else if (appRes.data.status === 'CONTRACT_SENT') {
          setActiveTab('contracts');
        }
      } catch (error) {
        toast.error('Virhe hakemuksen latauksessa');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleAcceptOffer = async (offerId: number) => {
    try {
      await offers.accept(offerId);
      toast.success('Tarjous hyväksytty!');
      // Refresh data
      const [appRes, offersRes] = await Promise.all([
        applications.get(parseInt(id!)),
        offers.getForApplication(parseInt(id!))
      ]);
      setApplication(appRes.data);
      setOfferList(offersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe tarjouksen hyväksymisessä');
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      await offers.reject(offerId);
      toast.success('Tarjous hylätty');
      // Refresh data
      const [appRes, offersRes] = await Promise.all([
        applications.get(parseInt(id!)),
        offers.getForApplication(parseInt(id!))
      ]);
      setApplication(appRes.data);
      setOfferList(offersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe tarjouksen hylkäämisessä');
    }
  };

  const handleRespondToInfoRequest = async (infoRequestId: number) => {
    if (!responseMessage.trim()) {
      toast.error('Kirjoita viesti');
      return;
    }
    
    setIsResponding(true);
    try {
      await infoRequests.respond({
        info_request_id: infoRequestId,
        message: responseMessage
      });
      toast.success('Vastaus lähetetty');
      setResponseMessage('');
      // Refresh
      const [appRes, infoRes] = await Promise.all([
        applications.get(parseInt(id!)),
        infoRequests.getForApplication(parseInt(id!))
      ]);
      setApplication(appRes.data);
      setInfoRequestList(infoRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe vastauksen lähettämisessä');
    } finally {
      setIsResponding(false);
    }
  };

  const handleUploadSignedContract = async (contractId: number) => {
    if (!signedFile) {
      toast.error('Valitse tiedosto');
      return;
    }
    
    setIsUploading(true);
    try {
      await contracts.uploadSigned(contractId, signedFile);
      toast.success('Allekirjoitettu sopimus lähetetty!');
      setSignedFile(null);
      // Refresh
      const [appRes, contractsRes] = await Promise.all([
        applications.get(parseInt(id!)),
        contracts.getForApplication(parseInt(id!))
      ]);
      setApplication(appRes.data);
      setContractList(contractsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe sopimuksen lataamisessa');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignContract = async (contractId: number) => {
    setIsSigning(true);
    try {
      await contracts.sign(contractId, 'Finland');
      toast.success('Sopimus allekirjoitettu!');
      // Refresh
      const [appRes, contractsRes] = await Promise.all([
        applications.get(parseInt(id!)),
        contracts.getForApplication(parseInt(id!))
      ]);
      setApplication(appRes.data);
      setContractList(contractsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe sopimuksen allekirjoittamisessa');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrintContract = (contract: Contract) => {
    setShowContractPreview(contract);
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow && contractDocRef.current) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Rahoitusleasingsopimus - ${contract.contract_number}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            ${contractDocRef.current.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      setShowContractPreview(null);
    }, 100);
  };

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
        <Link to="/dashboard/applications" className="btn-primary mt-4">
          Takaisin hakemuksiin
        </Link>
      </div>
    );
  }

  const pendingInfoRequest = infoRequestList.find(ir => ir.status === 'PENDING');
  const activeOffer = offerList.find(o => o.status === 'SENT');
  const pendingContract = contractList.find(c => c.status === 'SENT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard/applications"
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
            <p className="text-slate-600 mt-1">{getApplicationTypeLabel(application.application_type)}</p>
          </div>
        </div>
      </div>

      {/* Action alerts */}
      {application.status === 'INFO_REQUESTED' && pendingInfoRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">Lisätietopyyntö</p>
            <p className="text-yellow-700 text-sm mt-1">
              Rahoittaja pyytää lisätietoja hakemukseesi. Vastaa alla.
            </p>
          </div>
        </motion.div>
      )}

      {application.status === 'OFFER_SENT' && activeOffer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Tarjous saatavilla!</p>
            <p className="text-green-700 text-sm mt-1">
              Olet saanut rahoitustarjouksen. Tarkista tarjous ja hyväksy tai hylkää se.
            </p>
          </div>
        </motion.div>
      )}

      {application.status === 'CONTRACT_SENT' && pendingContract && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start space-x-3"
        >
          <FileCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-800 font-medium">Sopimus odottaa allekirjoitusta</p>
            <p className="text-purple-700 text-sm mt-1">
              Lataa sopimus, allekirjoita se ja palauta allekirjoitettu versio.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'details', label: 'Tiedot', icon: FileText },
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
                  <dd className="font-medium text-midnight-900">{application.equipment_description}</dd>
                </div>
                {application.equipment_supplier && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Toimittaja</dt>
                    <dd className="font-medium text-midnight-900">{application.equipment_supplier}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Summa</dt>
                  <dd className="font-medium text-midnight-900">{formatCurrency(application.equipment_price)}</dd>
                </div>
                {application.requested_term_months && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Toivottu sopimuskausi</dt>
                    <dd className="font-medium text-midnight-900">{application.requested_term_months} kk</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Luotu</dt>
                  <dd className="font-medium text-midnight-900">{formatDateTime(application.created_at)}</dd>
                </div>
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
                  <dd className="font-medium text-midnight-900">{application.business_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Yhteyshenkilö</dt>
                  <dd className="font-medium text-midnight-900">{application.contact_person || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Sähköposti</dt>
                  <dd className="font-medium text-midnight-900">{application.contact_email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Puhelin</dt>
                  <dd className="font-medium text-midnight-900">{application.contact_phone || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            {offerList.length === 0 ? (
              <div className="card text-center py-12">
                <Euro className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei tarjouksia vielä</h3>
                <p className="text-slate-500">Rahoittaja valmistelee tarjousta hakemukseesi.</p>
              </div>
            ) : (
              offerList.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-midnight-900">Rahoitustarjous</h3>
                    <span className={`badge ${
                      offer.status === 'SENT' ? 'badge-blue' :
                      offer.status === 'ACCEPTED' ? 'badge-green' :
                      offer.status === 'REJECTED' ? 'badge-red' : 'badge-gray'
                    }`}>
                      {getOfferStatusLabel(offer.status)}
                    </span>
                  </div>

                  {/* Tarjouksen tiedot */}
                  <div className="bg-slate-50 rounded-xl p-5 mb-4">
                    <div className="space-y-2 text-sm">
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
                      <hr className="my-2 border-slate-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Kk-maksu:</span>
                        <span className="font-bold text-green-700 text-xl">{formatCurrency(offer.monthly_payment)} alv 0 %</span>
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
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">Hintoihin lisätään voimassa oleva arvonlisävero</p>
                  </div>

                  {offer.notes_to_customer && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-sm font-medium text-slate-600 mb-1">Rahoittajan viesti:</p>
                      <p className="text-slate-700">{offer.notes_to_customer}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const residualPercent = offer.residual_value && application.equipment_price
                            ? ((offer.residual_value / application.equipment_price) * 100).toFixed(1)
                            : null;
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

                    {offer.status === 'SENT' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRejectOffer(offer.id)}
                          className="btn-ghost text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Hylkää
                        </button>
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="btn-primary"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Hyväksy tarjous
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {contractList.length === 0 ? (
              <div className="card text-center py-12">
                <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei sopimuksia vielä</h3>
                <p className="text-slate-500">
                  Sopimus lähetetään tarjouksen hyväksymisen jälkeen.
                </p>
              </div>
            ) : (
              contractList.map((contract) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-midnight-900">
                        Rahoitusleasingsopimus {contract.contract_number}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {contract.lessor_company_name} • {contract.lease_period_months} kk
                      </p>
                    </div>
                    <span className={`badge ${
                      contract.status === 'SENT' ? 'badge-purple' :
                      contract.status === 'SIGNED' ? 'badge-green' : 'badge-gray'
                    }`}>
                      {contract.status === 'SENT' ? 'Odottaa allekirjoitusta' :
                       contract.status === 'SIGNED' ? 'Allekirjoitettu' : contract.status}
                    </span>
                  </div>

                  {/* Contract summary */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-4">
                    <h4 className="font-medium text-emerald-800 mb-3">Sopimuksen yhteenveto</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block">Vuokraerä</span>
                        <span className="font-bold text-lg text-emerald-700">
                          {formatCurrency(contract.monthly_rent || 0)}
                        </span>
                        <span className="text-xs text-slate-500 block">alv 0 %</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sopimuskausi</span>
                        <span className="font-semibold text-midnight-900">
                          {contract.lease_period_months} kk
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jäännösarvo</span>
                        <span className="font-semibold text-midnight-900">
                          {formatCurrency(contract.residual_value || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ennakkovuokra</span>
                        <span className="font-semibold text-midnight-900">
                          {formatCurrency(contract.advance_payment || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Käsittelymaksu/erä: </span>
                        <span className="font-medium">{formatCurrency(contract.processing_fee || 500)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Järjestelypalkkio: </span>
                        <span className="font-medium">{formatCurrency(contract.arrangement_fee || 10)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">
                      Hintoihin lisätään voimassa oleva arvonlisävero
                    </p>
                  </div>

                  {contract.message_to_customer && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-sm font-medium text-slate-600 mb-1">Rahoittajan viesti:</p>
                      <p className="text-slate-700">{contract.message_to_customer}</p>
                    </div>
                  )}

                  <div className="text-sm text-slate-500 mb-4">
                    {contract.sent_at && <span>Lähetetty: {formatDateTime(contract.sent_at)}</span>}
                    {contract.signed_at && <span> • Allekirjoitettu: {formatDateTime(contract.signed_at)}</span>}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between gap-4">
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
                    
                    {contract.status === 'SENT' && (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        {/* E-signature button */}
                        <button
                          onClick={() => handleSignContract(contract.id)}
                          disabled={isSigning}
                          className="btn-primary"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {isSigning ? 'Allekirjoitetaan...' : 'Allekirjoita sähköisesti'}
                        </button>
                        
                        {/* OR upload signed PDF */}
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">tai</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id={`signed-${contract.id}`}
                          />
                          <label
                            htmlFor={`signed-${contract.id}`}
                            className="btn-secondary cursor-pointer"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {signedFile ? signedFile.name : 'Lataa allekirj. PDF'}
                          </label>
                          {signedFile && (
                            <button
                              onClick={() => handleUploadSignedContract(contract.id)}
                              disabled={isUploading}
                              className="btn-ghost text-emerald-600"
                            >
                              {isUploading ? 'Lähetetään...' : 'Lähetä'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {contract.status === 'SIGNED' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <div>
                          <span className="font-medium">Sopimus allekirjoitettu</span>
                          {contract.lessee_signer_name && (
                            <span className="text-sm ml-2">({contract.lessee_signer_name})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {/* Hidden contract document for printing */}
            {showContractPreview && application && (
              <div className="hidden">
                <ContractDocument
                  ref={contractDocRef}
                  contract={showContractPreview}
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
                  {showContractModal.status === 'SENT' && (
                    <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-b-xl">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            handleSignContract(showContractModal.id);
                            setShowContractModal(null);
                          }}
                          disabled={isSigning}
                          className="btn-primary"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {isSigning ? 'Allekirjoitetaan...' : 'Allekirjoita sähköisesti'}
                        </button>
                      </div>
                    </div>
                  )}
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
                <motion.div
                  key={ir.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-midnight-900">Lisätietopyyntö</h3>
                    <span className={`badge ${
                      ir.status === 'PENDING' ? 'badge-yellow' :
                      ir.status === 'RESPONDED' ? 'badge-green' : 'badge-gray'
                    }`}>
                      {ir.status === 'PENDING' ? 'Odottaa vastausta' :
                       ir.status === 'RESPONDED' ? 'Vastattu' : 'Suljettu'}
                    </span>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                    <p className="text-sm text-yellow-600 mb-1">Rahoittajan pyyntö:</p>
                    <p className="text-yellow-800">{ir.message}</p>
                    {ir.requested_items && ir.requested_items.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-yellow-700">
                        {ir.requested_items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Responses */}
                  {ir.responses && ir.responses.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {ir.responses.map((resp) => (
                        <div key={resp.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-600">
                              {resp.user.first_name || resp.user.email}
                            </span>
                            <span className="text-xs text-blue-500">{formatDateTime(resp.created_at)}</span>
                          </div>
                          <p className="text-blue-800">{resp.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Response form */}
                  {ir.status === 'PENDING' && (
                    <div className="border-t pt-4">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Kirjoita vastauksesi..."
                        className="input min-h-[100px] mb-3"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRespondToInfoRequest(ir.id)}
                          disabled={isResponding}
                          className="btn-primary"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isResponding ? 'Lähetetään...' : 'Lähetä vastaus'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


