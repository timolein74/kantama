import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Euro,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  FileText
} from 'lucide-react';
import api from '../../lib/api';
import { offers } from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getOfferStatusLabel
} from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Offer, Application } from '../../types';

interface OfferWithApplication extends Offer {
  application?: Application;
  financier_name?: string;
}

export default function AdminOffers() {
  const [offerList, setOfferList] = useState<OfferWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await api.get<OfferWithApplication[]>('/offers/admin/all');
        setOfferList(response.data);
      } catch (error) {
        toast.error('Virhe tarjousten latauksessa');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleApprove = async (offerId: number) => {
    try {
      await offers.approve(offerId);
      toast.success('Tarjous hyväksytty ja lähetetty asiakkaalle!');
      // Refresh list
      const response = await api.get<OfferWithApplication[]>('/offers/admin/all');
      setOfferList(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe tarjouksen hyväksymisessä');
    }
  };

  const filteredOffers = offerList.filter(offer => {
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      offer.application?.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.application?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.financier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = offerList.filter(o => o.status === 'PENDING_ADMIN').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-900">Tarjoukset</h1>
          <p className="text-slate-600 mt-1">Hallitse rahoittajien tarjouksia</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">
            {pendingCount} odottaa hyväksyntää
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Hae viitenumerolla, yrityksellä tai rahoittajalla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">Kaikki tilat</option>
              <option value="PENDING_ADMIN">Odottaa hyväksyntää</option>
              <option value="SENT">Lähetetty asiakkaalle</option>
              <option value="ACCEPTED">Hyväksytty</option>
              <option value="REJECTED">Hylätty</option>
              <option value="DRAFT">Luonnos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers list */}
      {filteredOffers.length === 0 ? (
        <div className="card text-center py-12">
          <Euro className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei tarjouksia</h3>
          <p className="text-slate-500">Tarjouksia ei löytynyt valituilla kriteereillä.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card ${offer.status === 'PENDING_ADMIN' ? 'border-2 border-orange-300 bg-orange-50' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      to={`/admin/applications/${offer.application_id}`}
                      className="font-semibold text-midnight-900 hover:text-Kantama-600"
                    >
                      {offer.application?.reference_number || `Hakemus #${offer.application_id}`}
                    </Link>
                    <span className={`badge ${
                      offer.status === 'DRAFT' ? 'badge-gray' :
                      offer.status === 'PENDING_ADMIN' ? 'badge-orange' :
                      offer.status === 'SENT' ? 'badge-blue' :
                      offer.status === 'ACCEPTED' ? 'badge-green' : 'badge-red'
                    }`}>
                      {getOfferStatusLabel(offer.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      {offer.financier_name || 'Tuntematon rahoittaja'}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {offer.application?.company_name || '-'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDateTime(offer.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Kuukausierä</p>
                    <p className="text-lg font-bold text-midnight-900">{formatCurrency(offer.monthly_payment)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Kausi</p>
                    <p className="text-lg font-bold text-midnight-900">{offer.term_months} kk</p>
                  </div>

                  {offer.status === 'PENDING_ADMIN' && (
                    <button
                      onClick={() => handleApprove(offer.id)}
                      className="btn-primary"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Hyväksy ja lähetä
                    </button>
                  )}

                  {offer.status !== 'PENDING_ADMIN' && (
                    <Link
                      to={`/admin/applications/${offer.application_id}`}
                      className="btn-secondary"
                    >
                      Avaa
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}



