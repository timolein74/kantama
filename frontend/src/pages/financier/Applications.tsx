import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { applications } from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getApplicationTypeLabel
} from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Application, ApplicationStatus, ApplicationType } from '../../types';

export default function FinancierApplications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appList, setAppList] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>(
    searchParams.get('status') as ApplicationStatus || ''
  );
  const [typeFilter, setTypeFilter] = useState<ApplicationType | ''>('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await applications.list();
        setAppList(response.data);
        setFilteredApps(response.data);
      } catch (error) {
        console.error('Failed to fetch applications');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, []);

  useEffect(() => {
    let filtered = appList;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.business_id.includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(app => app.application_type === typeFilter);
    }

    setFilteredApps(filtered);
  }, [searchTerm, statusFilter, typeFilter, appList]);

  // Stats
  const stats = {
    new: appList.filter(a => a.status === 'SUBMITTED_TO_FINANCIER').length,
    infoRequested: appList.filter(a => a.status === 'INFO_REQUESTED').length,
    offerSent: appList.filter(a => a.status === 'OFFER_SENT').length,
    accepted: appList.filter(a => a.status === 'OFFER_ACCEPTED').length,
    contract: appList.filter(a => a.status === 'CONTRACT_SENT').length,
    done: appList.filter(a => a.status === 'SIGNED').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-midnight-900">Hakemukset</h1>
        <p className="text-slate-600 mt-1">Käsittele hakemuksia ja tee tarjouksia</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Uudet', value: stats.new, status: 'SUBMITTED_TO_FINANCIER', color: 'border-orange-300 bg-orange-50' },
          { label: 'Lisätiedot', value: stats.infoRequested, status: 'INFO_REQUESTED', color: 'border-yellow-300 bg-yellow-50' },
          { label: 'Tarjottu', value: stats.offerSent, status: 'OFFER_SENT', color: 'border-blue-300 bg-blue-50' },
          { label: 'Hyväksytty', value: stats.accepted, status: 'OFFER_ACCEPTED', color: 'border-purple-300 bg-purple-50' },
          { label: 'Sopimus', value: stats.contract, status: 'CONTRACT_SENT', color: 'border-indigo-300 bg-indigo-50' },
          { label: 'Valmis', value: stats.done, status: 'SIGNED', color: 'border-green-300 bg-green-50' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => {
              setStatusFilter(stat.status as ApplicationStatus);
              setSearchParams({ status: stat.status });
            }}
            className={`rounded-xl p-3 border-2 ${stat.color} ${
              statusFilter === stat.status ? 'ring-2 ring-emerald-500' : ''
            } hover:shadow-md transition-all text-center`}
          >
            <p className="text-xl font-bold text-midnight-900">{stat.value}</p>
            <p className="text-xs text-slate-600">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Hae viitteellä, yrityksellä, Y-tunnuksella..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ApplicationStatus | '');
                setSearchParams(e.target.value ? { status: e.target.value } : {});
              }}
              className="input pl-10 min-w-[200px]"
            >
              <option value="">Kaikki tilat</option>
              <option value="SUBMITTED_TO_FINANCIER">Uudet</option>
              <option value="INFO_REQUESTED">Lisätietopyyntö</option>
              <option value="OFFER_SENT">Tarjous lähetetty</option>
              <option value="OFFER_ACCEPTED">Tarjous hyväksytty</option>
              <option value="CONTRACT_SENT">Sopimus lähetetty</option>
              <option value="SIGNED">Allekirjoitettu</option>
              <option value="CLOSED">Suljettu</option>
            </select>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ApplicationType | '')}
            className="input min-w-[150px]"
          >
            <option value="">Kaikki tyypit</option>
            <option value="LEASING">Leasing</option>
            <option value="SALE_LEASEBACK">Sale-Leaseback</option>
          </select>

          {statusFilter && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchParams({});
              }}
              className="btn-ghost text-sm"
            >
              Tyhjennä suodattimet
            </button>
          )}
        </div>
      </div>

      {/* Urgent actions banner */}
      {stats.new > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-900">
              <strong>{stats.new}</strong> uutta hakemusta odottaa käsittelyä
            </span>
          </div>
          <button
            onClick={() => {
              setStatusFilter('SUBMITTED_TO_FINANCIER');
              setSearchParams({ status: 'SUBMITTED_TO_FINANCIER' });
            }}
            className="btn bg-orange-600 text-white hover:bg-orange-700"
          >
            Näytä uudet
          </button>
        </motion.div>
      )}

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">
            {appList.length === 0 ? 'Ei hakemuksia' : 'Ei hakemuksia valituilla suodattimilla'}
          </h3>
          <p className="text-slate-500">
            {appList.length === 0
              ? 'Hakemukset näkyvät täällä kun admin lähettää niitä käsittelyyn'
              : 'Kokeile muuttaa hakuehtoja'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                to={`/financier/applications/${app.id}`}
                className={`card block hover:shadow-lg transition-all ${
                  app.status === 'SUBMITTED_TO_FINANCIER' ? 'border-l-4 border-l-orange-500' :
                  app.status === 'INFO_REQUESTED' ? 'border-l-4 border-l-yellow-500' :
                  app.status === 'OFFER_ACCEPTED' ? 'border-l-4 border-l-purple-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      app.application_type === 'LEASING' ? 'bg-blue-100' : 'bg-emerald-100'
                    }`}>
                      {app.application_type === 'LEASING' ? (
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      ) : (
                        <RefreshCw className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-midnight-900">{app.reference_number}</h3>
                        <span className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        <span className="font-medium">{app.company_name}</span>
                        {' • '}{app.business_id}
                      </p>
                      <p className="text-sm text-slate-400">{app.equipment_description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-midnight-900">
                        {formatCurrency(app.equipment_price)}
                      </p>
                      <p className="text-sm text-slate-500">{formatDate(app.created_at)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-sm text-slate-500 text-center">
        Näytetään {filteredApps.length} / {appList.length} hakemusta
      </div>
    </div>
  );
}




