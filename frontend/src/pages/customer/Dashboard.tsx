import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Bell
} from 'lucide-react';
import { applications, notifications as notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Application, Notification } from '../../types';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [appList, setAppList] = useState<Application[]>([]);
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, notifsRes] = await Promise.all([
          applications.list(),
          notificationsApi.list()
        ]);
        setAppList(appsRes.data);
        setNotificationList(notifsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats
  const totalApplications = appList.length;
  const pendingApplications = appList.filter(a => 
    ['SUBMITTED', 'SUBMITTED_TO_FINANCIER', 'INFO_REQUESTED'].includes(a.status)
  ).length;
  const offersAvailable = appList.filter(a => a.status === 'OFFER_SENT').length;
  const completed = appList.filter(a => ['SIGNED', 'CLOSED'].includes(a.status)).length;

  const recentApplications = appList.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-midnight-900">
          Tervetuloa, {user?.first_name || 'Asiakas'}!
        </h1>
        <p className="text-slate-600 mt-1">
          Seuraa rahoitushakemuksiasi ja hallitse tarjouksia.
        </p>
      </div>

      {/* Verification warning */}
      {user && !user.is_verified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">Vahvista sähköpostiosoitteesi</p>
            <p className="text-yellow-700 text-sm mt-1">
              Tarkista sähköpostisi ja klikkaa vahvistuslinkkiä, jotta voit seurata hakemuksiasi.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Hakemuksia', value: totalApplications, icon: FileText, color: 'bg-blue-500' },
          { label: 'Käsittelyssä', value: pendingApplications, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Tarjouksia', value: offersAvailable, icon: TrendingUp, color: 'bg-green-500' },
          { label: 'Valmis', value: completed, icon: CheckCircle, color: 'bg-purple-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
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
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-midnight-900">Viimeisimmät hakemukset</h2>
            <Link
              to="/dashboard/applications"
              className="text-Kantama-600 hover:text-Kantama-700 text-sm font-medium flex items-center"
            >
              Näytä kaikki
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ei hakemuksia vielä</p>
              <Link to="/" className="btn-primary mt-4 inline-flex">
                Hae rahoitusta
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/dashboard/applications/${app.id}`}
                  className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        app.application_type === 'LEASING' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                        {app.application_type === 'LEASING' ? (
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <RefreshCw className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-midnight-900">{app.reference_number}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(app.equipment_price)}</p>
                      </div>
                    </div>
                    <span className={getStatusColor(app.status)}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-midnight-900">Ilmoitukset</h2>
          </div>

          {notificationList.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ei ilmoituksia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationList.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border ${
                    notif.is_read ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100'
                  }`}
                >
                  <p className="font-medium text-midnight-900">{notif.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(notif.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-gradient-to-r from-Kantama-600 to-Kantama-700 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-display font-bold">Tarvitsetko lisää rahoitusta?</h3>
            <p className="text-Kantama-100 mt-1">
              Hae uutta rahoitusta - saat tarjouksen nopeasti.
            </p>
          </div>
          <Link to="/" className="btn bg-white text-Kantama-700 hover:bg-Kantama-50">
            Hae rahoitusta
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


