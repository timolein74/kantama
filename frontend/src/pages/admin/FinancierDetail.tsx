import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { financiers, users } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Financier, User as UserType } from '../../types';

export default function AdminFinancierDetail() {
  const { id } = useParams<{ id: string }>();
  const [financier, setFinancier] = useState<Financier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    const fetchFinancier = async () => {
      if (!id) return;
      
      try {
        const response = await financiers.get(parseInt(id));
        setFinancier(response.data);
      } catch (error) {
        toast.error('Virhe rahoittajan latauksessa');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancier();
  }, [id]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!financier || !newUserData.email || !newUserData.password) {
      toast.error('Täytä pakolliset kentät');
      return;
    }

    setIsCreatingUser(true);
    try {
      await users.createFinancierUser({
        ...newUserData,
        financier_id: financier.id
      });
      
      toast.success('Käyttäjä luotu');
      setIsUserModalOpen(false);
      setNewUserData({ email: '', password: '', first_name: '', last_name: '' });
      
      // Refresh financier data
      const response = await financiers.get(financier.id);
      setFinancier(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe käyttäjän luomisessa');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      if (user.is_active) {
        await users.deactivate(user.id);
        toast.success('Käyttäjä deaktivoitu');
      } else {
        await users.activate(user.id);
        toast.success('Käyttäjä aktivoitu');
      }
      
      // Refresh financier data
      if (financier) {
        const response = await financiers.get(financier.id);
        setFinancier(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe käyttäjän päivityksessä');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!financier) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-midnight-900 mb-2">Rahoittajaa ei löytynyt</h2>
        <Link to="/admin/financiers" className="btn-primary mt-4">
          Takaisin rahoittajiin
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
            to="/admin/financiers"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              financier.is_active ? 'bg-emerald-100' : 'bg-slate-200'
            }`}>
              <Building2 className={`w-7 h-7 ${
                financier.is_active ? 'text-emerald-600' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-midnight-900">
                {financier.name}
              </h1>
              {financier.is_active ? (
                <span className="badge badge-green">Aktiivinen</span>
              ) : (
                <span className="badge badge-gray">Deaktivoitu</span>
              )}
            </div>
          </div>
        </div>
        <Link to={`/admin/financiers`} className="btn-secondary">
          <Edit2 className="w-4 h-4 mr-2" />
          Muokkaa
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-midnight-900 mb-4">Yhteystiedot</h3>
            <div className="space-y-3">
              <div className="flex items-center text-slate-600">
                <Mail className="w-5 h-5 mr-3 text-slate-400" />
                <a href={`mailto:${financier.email}`} className="hover:text-Kantama-600">
                  {financier.email}
                </a>
              </div>
              {financier.phone && (
                <div className="flex items-center text-slate-600">
                  <Phone className="w-5 h-5 mr-3 text-slate-400" />
                  {financier.phone}
                </div>
              )}
              {financier.address && (
                <div className="flex items-start text-slate-600">
                  <MapPin className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0 mt-0.5" />
                  {financier.address}
                </div>
              )}
              {financier.business_id && (
                <div className="flex items-center text-slate-600">
                  <FileText className="w-5 h-5 mr-3 text-slate-400" />
                  <span className="font-mono">{financier.business_id}</span>
                </div>
              )}
            </div>
          </div>

          {financier.notes && (
            <div className="card">
              <h3 className="font-semibold text-midnight-900 mb-3">Muistiinpanot</h3>
              <p className="text-slate-600 text-sm">{financier.notes}</p>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-midnight-900 mb-3">Tiedot</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Lisätty</dt>
                <dd className="text-midnight-900">{formatDate(financier.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Päivitetty</dt>
                <dd className="text-midnight-900">{formatDate(financier.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Käyttäjiä</dt>
                <dd className="text-midnight-900">{financier.users?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Users section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-midnight-900">Käyttäjät</h3>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lisää käyttäjä
              </button>
            </div>

            {!financier.users || financier.users.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Ei käyttäjiä vielä</p>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lisää ensimmäinen käyttäjä
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Käyttäjä</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Sähköposti</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tila</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Luotu</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {financier.users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-emerald-700 font-medium text-sm">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-midnight-900">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          {user.is_active ? (
                            <span className="badge badge-green">Aktiivinen</span>
                          ) : (
                            <span className="badge badge-gray">Deaktivoitu</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-2 rounded-lg ${
                              user.is_active
                                ? 'hover:bg-red-50 text-red-500'
                                : 'hover:bg-green-50 text-green-500'
                            }`}
                            title={user.is_active ? 'Deaktivoi' : 'Aktivoi'}
                          >
                            {user.is_active ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add user modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsUserModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-midnight-900">
                  Lisää käyttäjä
                </h2>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Etunimi</label>
                    <input
                      type="text"
                      value={newUserData.first_name}
                      onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                      className="input"
                      placeholder="Matti"
                    />
                  </div>
                  <div>
                    <label className="label">Sukunimi</label>
                    <input
                      type="text"
                      value={newUserData.last_name}
                      onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                      className="input"
                      placeholder="Meikäläinen"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Sähköposti *</label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="input"
                    placeholder="matti@rahoittaja.fi"
                    required
                  />
                </div>

                <div>
                  <label className="label">Salasana *</label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="input"
                    placeholder="********"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-slate-500 mt-1">Vähintään 8 merkkiä</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="btn-ghost"
                  >
                    Peruuta
                  </button>
                  <button type="submit" disabled={isCreatingUser} className="btn-primary">
                    {isCreatingUser ? 'Luodaan...' : 'Luo käyttäjä'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}




