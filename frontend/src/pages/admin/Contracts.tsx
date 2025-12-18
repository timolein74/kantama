import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileCheck,
  Search,
  Filter,
  Clock,
  Building2,
  FileText,
  Download,
  CheckCircle
} from 'lucide-react';
import api from '../../lib/api';
import {
  formatCurrency,
  formatDateTime,
  getContractStatusLabel
} from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Contract, Application } from '../../types';

interface ContractWithApplication extends Contract {
  application?: Application;
  financier_name?: string;
}

export default function AdminContracts() {
  const [contractList, setContractList] = useState<ContractWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await api.get<ContractWithApplication[]>('/contracts/admin/all');
        setContractList(response.data);
      } catch (error) {
        toast.error('Virhe sopimusten latauksessa');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const filteredContracts = contractList.filter(contract => {
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      contract.application?.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.application?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.financier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = contractList.filter(c => c.status === 'SENT').length;
  const signedCount = contractList.filter(c => c.status === 'SIGNED').length;

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
          <h1 className="text-2xl font-display font-bold text-midnight-900">Sopimukset</h1>
          <p className="text-slate-600 mt-1">Kaikki rahoitussopimukset</p>
        </div>
        <div className="flex space-x-3">
          {pendingCount > 0 && (
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              {pendingCount} odottaa allekirjoitusta
            </div>
          )}
          {signedCount > 0 && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              {signedCount} allekirjoitettu
            </div>
          )}
        </div>
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
              <option value="SENT">Odottaa allekirjoitusta</option>
              <option value="SIGNED">Allekirjoitettu</option>
              <option value="DRAFT">Luonnos</option>
              <option value="REJECTED">Hylätty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts list */}
      {filteredContracts.length === 0 ? (
        <div className="card text-center py-12">
          <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei sopimuksia</h3>
          <p className="text-slate-500">Sopimuksia ei löytynyt valituilla kriteereillä.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card ${contract.status === 'SIGNED' ? 'border-2 border-green-300 bg-green-50' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      to={`/admin/applications/${contract.application_id}`}
                      className="font-semibold text-midnight-900 hover:text-Kantama-600"
                    >
                      {contract.application?.reference_number || `Hakemus #${contract.application_id}`}
                    </Link>
                    <span className={`badge ${
                      contract.status === 'DRAFT' ? 'badge-gray' :
                      contract.status === 'SENT' ? 'badge-purple' :
                      contract.status === 'SIGNED' ? 'badge-green' : 'badge-red'
                    }`}>
                      {getContractStatusLabel(contract.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      {contract.financier_name || 'Tuntematon rahoittaja'}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {contract.application?.company_name || '-'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {contract.sent_at ? `Lähetetty: ${formatDateTime(contract.sent_at)}` : formatDateTime(contract.created_at)}
                    </span>
                    {contract.signed_at && (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Allekirjoitettu: {formatDateTime(contract.signed_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {contract.contract_file_id && (
                    <button className="btn-secondary">
                      <Download className="w-4 h-4 mr-2" />
                      Lataa sopimus
                    </button>
                  )}
                  {contract.signed_file_id && (
                    <button className="btn-secondary">
                      <Download className="w-4 h-4 mr-2" />
                      Lataa allekirjoitettu
                    </button>
                  )}
                  <Link
                    to={`/admin/applications/${contract.application_id}`}
                    className="btn-primary"
                  >
                    Avaa hakemus
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}



