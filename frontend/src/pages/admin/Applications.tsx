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
  Download
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

export default function AdminApplications() {
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
        app.business_id.includes(searchTerm) ||
        app.equipment_description.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Statistics
  const stats = {
    total: appList.length,
    submitted: appList.filter(a => a.status === 'SUBMITTED').length,
    inProgress: appList.filter(a => ['SUBMITTED_TO_FINANCIER', 'INFO_REQUESTED'].includes(a.status)).length,
    offersSent: appList.filter(a => ['OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).length,
    contracts: appList.filter(a => ['CONTRACT_SENT', 'SIGNED'].includes(a.status)).length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-900">Hakemukset</h1>
          <p className="text-slate-600 mt-1">Hallitse ja seuraa kaikkia hakemuksia</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4 mr-2" />
          Vie Excel
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Yhteensä', value: stats.total, onClick: () => setStatusFilter('') },
          { label: 'Uudet', value: stats.submitted, onClick: () => setStatusFilter('SUBMITTED') },
          { label: 'Käsittelyssä', value: stats.inProgress, onClick: () => setStatusFilter('SUBMITTED_TO_FINANCIER') },
          { label: 'Tarjottu', value: stats.offersSent, onClick: () => setStatusFilter('OFFER_SENT') },
          { label: 'Sopimukset', value: stats.contracts, onClick: () => setStatusFilter('CONTRACT_SENT') },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-Kantama-300 hover:shadow-sm transition-all text-left"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-midnight-900 mt-1">{stat.value}</p>
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
              <option value="SUBMITTED">Lähetetty</option>
              <option value="SUBMITTED_TO_FINANCIER">Rahoittajalla</option>
              <option value="INFO_REQUESTED">Lisätietopyyntö</option>
              <option value="OFFER_SENT">Tarjous lähetetty</option>
              <option value="OFFER_ACCEPTED">Tarjous hyväksytty</option>
              <option value="OFFER_REJECTED">Tarjous hylätty</option>
              <option value="CONTRACT_SENT">Sopimus lähetetty</option>
              <option value="SIGNED">Allekirjoitettu</option>
              <option value="CLOSED">Suljettu</option>
              <option value="CANCELLED">Peruutettu</option>
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
        </div>
      </div>

      {/* Applications table */}
      {filteredApps.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">
            {appList.length === 0 ? 'Ei hakemuksia' : 'Ei hakemuksia valituilla suodattimilla'}
          </h3>
          <p className="text-slate-500">
            {appList.length === 0
              ? 'Hakemukset näkyvät täällä kun asiakkaat lähettävät niitä'
              : 'Kokeile muuttaa hakuehtoja'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Viite</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Tyyppi</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Yritys</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Y-tunnus</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Summa</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Tila</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Päivämäärä</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app, index) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 px-6">
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="font-medium text-Kantama-600 hover:text-Kantama-700"
                      >
                        {app.reference_number}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center ${
                        app.application_type === 'LEASING' ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {app.application_type === 'LEASING' ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        {getApplicationTypeLabel(app.application_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{app.company_name}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-sm">{app.business_id}</td>
                    <td className="py-4 px-6 font-semibold text-midnight-900">
                      {formatCurrency(app.equipment_price)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusColor(app.status)}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">{formatDate(app.created_at)}</td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="p-2 hover:bg-slate-100 rounded-lg inline-flex"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-500 text-center">
        Näytetään {filteredApps.length} / {appList.length} hakemusta
      </div>
    </div>
  );
}




