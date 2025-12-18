import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  Building2,
  User
} from 'lucide-react';
import { users } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { User as UserType, UserRole } from '../../types';

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userList, setUserList] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>(
    searchParams.get('role') as UserRole || ''
  );
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await users.list();
      setUserList(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      toast.error('Virhe käyttäjien latauksessa');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = userList;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (!showInactive) {
      filtered = filtered.filter(user => user.is_active);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, showInactive, userList]);

  const handleToggleStatus = async (user: UserType) => {
    try {
      if (user.is_active) {
        await users.deactivate(user.id);
        toast.success('Käyttäjä deaktivoitu');
      } else {
        await users.activate(user.id);
        toast.success('Käyttäjä aktivoitu');
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe käyttäjän päivityksessä');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'FINANCIER':
        return <Building2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Ylläpitäjä';
      case 'FINANCIER':
        return 'Rahoittaja';
      default:
        return 'Asiakas';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-red';
      case 'FINANCIER':
        return 'badge-green';
      default:
        return 'badge-blue';
    }
  };

  // Stats
  const stats = {
    total: userList.length,
    customers: userList.filter(u => u.role === 'CUSTOMER').length,
    financiers: userList.filter(u => u.role === 'FINANCIER').length,
    admins: userList.filter(u => u.role === 'ADMIN').length,
    active: userList.filter(u => u.is_active).length,
    verified: userList.filter(u => u.is_verified).length
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
        <h1 className="text-2xl font-display font-bold text-midnight-900">Käyttäjät</h1>
        <p className="text-slate-600 mt-1">Hallitse järjestelmän käyttäjiä</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Yhteensä', value: stats.total, color: 'bg-slate-500' },
          { label: 'Asiakkaat', value: stats.customers, color: 'bg-blue-500', onClick: () => setRoleFilter('CUSTOMER') },
          { label: 'Rahoittajat', value: stats.financiers, color: 'bg-emerald-500', onClick: () => setRoleFilter('FINANCIER') },
          { label: 'Ylläpitäjät', value: stats.admins, color: 'bg-red-500', onClick: () => setRoleFilter('ADMIN') },
          { label: 'Aktiivisia', value: stats.active, color: 'bg-green-500' },
          { label: 'Vahvistettu', value: stats.verified, color: 'bg-purple-500' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-Kantama-300 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-midnight-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-3 h-3 ${stat.color} rounded-full`} />
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Hae nimellä, sähköpostilla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setSearchParams(e.target.value ? { role: e.target.value } : {});
              }}
              className="input pl-10 min-w-[150px]"
            >
              <option value="">Kaikki roolit</option>
              <option value="CUSTOMER">Asiakkaat</option>
              <option value="FINANCIER">Rahoittajat</option>
              <option value="ADMIN">Ylläpitäjät</option>
            </select>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-Kantama-600 focus:ring-Kantama-500"
            />
            <span className="text-sm text-slate-600">Näytä deaktivoidut</span>
          </label>
        </div>
      </div>

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei käyttäjiä</h3>
          <p className="text-slate-500">
            {userList.length === 0
              ? 'Käyttäjiä ei ole vielä'
              : 'Muuta hakuehtoja nähdäksesi käyttäjiä'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Käyttäjä</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Sähköposti</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Rooli</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Yritys</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Tila</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Rekisteröity</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-t border-slate-100 hover:bg-slate-50 ${
                      !user.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === 'ADMIN' ? 'bg-red-100' :
                          user.role === 'FINANCIER' ? 'bg-emerald-100' : 'bg-blue-100'
                        }`}>
                          <span className={`font-medium text-sm ${
                            user.role === 'ADMIN' ? 'text-red-700' :
                            user.role === 'FINANCIER' ? 'text-emerald-700' : 'text-blue-700'
                          }`}>
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-midnight-900">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.email.split('@')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {user.company_name || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {user.is_active ? (
                          <span className="badge badge-green">Aktiivinen</span>
                        ) : (
                          <span className="badge badge-gray">Deaktivoitu</span>
                        )}
                        {!user.is_verified && (
                          <span className="badge badge-yellow">Vahvistamaton</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-4 px-6">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg ${
                            user.is_active
                              ? 'hover:bg-red-50 text-red-500'
                              : 'hover:bg-green-50 text-green-500'
                          }`}
                          title={user.is_active ? 'Deaktivoi' : 'Aktivoi'}
                        >
                          {user.is_active ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-500 text-center">
        Näytetään {filteredUsers.length} / {userList.length} käyttäjää
      </div>
    </div>
  );
}




