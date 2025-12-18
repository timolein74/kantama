import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  RefreshCw,
  ChevronRight
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

export default function CustomerApplications() {
  const [appList, setAppList] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
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
        <p className="text-slate-600 mt-1">Seuraa rahoitushakemuksiasi</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Hae hakemusta..."
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
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
              className="input pl-10 min-w-[180px]"
            >
              <option value="">Kaikki tilat</option>
              <option value="SUBMITTED">Lähetetty</option>
              <option value="SUBMITTED_TO_FINANCIER">Käsittelyssä</option>
              <option value="INFO_REQUESTED">Lisätietopyyntö</option>
              <option value="OFFER_SENT">Tarjous saatavilla</option>
              <option value="OFFER_ACCEPTED">Tarjous hyväksytty</option>
              <option value="CONTRACT_SENT">Sopimus lähetetty</option>
              <option value="SIGNED">Allekirjoitettu</option>
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

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">
            {appList.length === 0 ? 'Ei hakemuksia' : 'Ei hakemuksia valituilla suodattimilla'}
          </h3>
          <p className="text-slate-500 mb-6">
            {appList.length === 0
              ? 'Aloita hakemalla rahoitusta'
              : 'Kokeile muuttaa hakuehtoja'}
          </p>
          {appList.length === 0 && (
            <Link to="/" className="btn-primary">
              Hae rahoitusta
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/dashboard/applications/${app.id}`}
                className="card block hover:shadow-lg transition-shadow"
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
                        {getApplicationTypeLabel(app.application_type)} • {app.equipment_description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-6">
                    <div className="text-right">
                      <p className="font-semibold text-midnight-900">
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
    </div>
  );
}




