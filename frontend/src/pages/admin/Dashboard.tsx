import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Building2,
  Users,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Euro,
  FileCheck,
  Send
} from 'lucide-react';
import api from '../../lib/api';
import { applications, financiers, users } from '../../lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Application, Financier, User, Offer, Contract } from '../../types';

export default function AdminDashboard() {
  const [appList, setAppList] = useState<Application[]>([]);
  const [financierList, setFinancierList] = useState<Financier[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [offerList, setOfferList] = useState<any[]>([]);
  const [contractList, setContractList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, financiersRes, usersRes, offersRes, contractsRes] = await Promise.all([
          applications.list(),
          financiers.list(),
          users.list(),
          api.get('/offers/admin/all'),
          api.get('/contracts/admin/all')
        ]);
        setAppList(appsRes.data);
        setFinancierList(financiersRes.data);
        setUserList(usersRes.data);
        setOfferList(offersRes.data);
        setContractList(contractsRes.data);
      } catch (error) {
        console.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats
  const newApplications = appList.filter(a => a.status === 'SUBMITTED').length;
  const inProgress = appList.filter(a => 
    ['SUBMITTED_TO_FINANCIER', 'INFO_REQUESTED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'CONTRACT_SENT'].includes(a.status)
  ).length;
  const completed = appList.filter(a => ['SIGNED', 'CLOSED'].includes(a.status)).length;
  const totalValue = appList.reduce((sum, app) => sum + app.equipment_price, 0);

  const activeFinanciers = financierList.filter(f => f.is_active).length;
  const totalCustomers = userList.filter(u => u.role === 'CUSTOMER').length;

  // Offer stats
  const pendingOffers = offerList.filter(o => o.status === 'PENDING_ADMIN').length;
  const sentOffers = offerList.filter(o => o.status === 'SENT').length;
  const acceptedOffers = offerList.filter(o => o.status === 'ACCEPTED').length;

  // Contract stats
  const pendingContracts = contractList.filter(c => c.status === 'SENT').length;
  const signedContracts = contractList.filter(c => c.status === 'SIGNED').length;

  const recentApplications = appList
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-midnight-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Yleiskatsaus järjestelmän tilasta</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Uusia hakemuksia', value: newApplications, icon: AlertCircle, color: 'bg-orange-500', link: '/admin/applications?status=SUBMITTED' },
          { label: 'Käsittelyssä', value: inProgress, icon: Clock, color: 'bg-blue-500', link: '/admin/applications' },
          { label: 'Valmistuneet', value: completed, icon: CheckCircle, color: 'bg-green-500', link: '/admin/applications?status=SIGNED' },
          { label: 'Kokonaisarvo', value: formatCurrency(totalValue), icon: Euro, color: 'bg-purple-500', link: '/admin/applications' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link} className="card block hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-midnight-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Offers & Contracts stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-midnight-900 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-Kantama-600" />
              Tarjoukset
            </h3>
            <Link to="/admin/offers" className="text-Kantama-600 hover:text-Kantama-700 text-sm font-medium">
              Näytä kaikki →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/admin/offers?status=PENDING_ADMIN" className="text-center p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
              <p className="text-2xl font-bold text-orange-600">{pendingOffers}</p>
              <p className="text-xs text-orange-700">Odottaa hyväksyntää</p>
            </Link>
            <Link to="/admin/offers?status=SENT" className="text-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <p className="text-2xl font-bold text-blue-600">{sentOffers}</p>
              <p className="text-xs text-blue-700">Lähetetty</p>
            </Link>
            <Link to="/admin/offers?status=ACCEPTED" className="text-center p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <p className="text-2xl font-bold text-green-600">{acceptedOffers}</p>
              <p className="text-xs text-green-700">Hyväksytty</p>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-midnight-900 flex items-center">
              <FileCheck className="w-5 h-5 mr-2 text-Kantama-600" />
              Sopimukset
            </h3>
            <Link to="/admin/contracts" className="text-Kantama-600 hover:text-Kantama-700 text-sm font-medium">
              Näytä kaikki →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <p className="text-2xl font-bold text-slate-600">{contractList.length}</p>
              <p className="text-xs text-slate-600">Yhteensä</p>
            </div>
            <Link to="/admin/contracts?status=SENT" className="text-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <p className="text-2xl font-bold text-purple-600">{pendingContracts}</p>
              <p className="text-xs text-purple-700">Odottaa allekirj.</p>
            </Link>
            <Link to="/admin/contracts?status=SIGNED" className="text-center p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <p className="text-2xl font-bold text-green-600">{signedContracts}</p>
              <p className="text-xs text-green-700">Allekirjoitettu</p>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Secondary stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/financiers" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Rahoittajat</p>
              <p className="text-xl font-bold text-midnight-900">{activeFinanciers} / {financierList.length}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/users?role=CUSTOMER" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Asiakkaat</p>
              <p className="text-xl font-bold text-midnight-900">{totalCustomers}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/applications" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Hakemuksia yhteensä</p>
              <p className="text-xl font-bold text-midnight-900">{appList.length}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-midnight-900">Viimeisimmät hakemukset</h2>
          <Link
            to="/admin/applications"
            className="text-Kantama-600 hover:text-Kantama-700 text-sm font-medium flex items-center"
          >
            Näytä kaikki
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Ei hakemuksia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Viite</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tyyppi</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Yritys</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Summa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tila</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Päivämäärä</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="font-medium text-Kantama-600 hover:text-Kantama-700"
                      >
                        {app.reference_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center ${
                        app.application_type === 'LEASING' ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {app.application_type === 'LEASING' ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        {app.application_type === 'LEASING' ? 'Leasing' : 'SLB'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{app.company_name}</td>
                    <td className="py-3 px-4 font-medium text-midnight-900">{formatCurrency(app.equipment_price)}</td>
                    <td className="py-3 px-4">
                      <span className={getStatusColor(app.status)}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{formatDate(app.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/admin/financiers"
          className="card bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">Hallitse rahoittajia</h3>
              <p className="text-emerald-100 text-sm mt-1">
                Lisää, muokkaa ja hallitse rahoittajia
              </p>
            </div>
            <Building2 className="w-10 h-10 text-emerald-200" />
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="card bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">Käyttäjähallinta</h3>
              <p className="text-indigo-100 text-sm mt-1">
                Hallitse käyttäjiä ja oikeuksia
              </p>
            </div>
            <Users className="w-10 h-10 text-indigo-200" />
          </div>
        </Link>
      </div>
    </div>
  );
}


