import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  Phone,
  X
} from 'lucide-react';
import { financiers } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Financier } from '../../types';

export default function AdminFinanciers() {
  const [financierList, setFinancierList] = useState<Financier[]>([]);
  const [filteredList, setFilteredList] = useState<Financier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinancier, setEditingFinancier] = useState<Financier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    business_id: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFinanciers();
  }, []);

  const fetchFinanciers = async () => {
    try {
      const response = await financiers.list();
      setFinancierList(response.data);
      setFilteredList(response.data);
    } catch (error) {
      toast.error('Virhe rahoittajien latauksessa');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = financierList;

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!showInactive) {
      filtered = filtered.filter(f => f.is_active);
    }

    setFilteredList(filtered);
  }, [searchTerm, showInactive, financierList]);

  const openModal = (financier?: Financier) => {
    if (financier) {
      setEditingFinancier(financier);
      setFormData({
        name: financier.name,
        email: financier.email,
        phone: financier.phone || '',
        address: financier.address || '',
        business_id: financier.business_id || '',
        notes: financier.notes || ''
      });
    } else {
      setEditingFinancier(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_id: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFinancier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      business_id: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Täytä pakolliset kentät');
      return;
    }

    setIsSaving(true);
    try {
      if (editingFinancier) {
        await financiers.update(editingFinancier.id, formData);
        toast.success('Rahoittaja päivitetty');
      } else {
        await financiers.create(formData);
        toast.success('Rahoittaja lisätty');
      }
      closeModal();
      fetchFinanciers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe tallennuksessa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (financier: Financier) => {
    if (!confirm(`Haluatko varmasti deaktivoida rahoittajan ${financier.name}?`)) {
      return;
    }

    try {
      await financiers.delete(financier.id);
      toast.success('Rahoittaja deaktivoitu');
      fetchFinanciers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe deaktivoinnissa');
    }
  };

  const handleActivate = async (financier: Financier) => {
    try {
      await financiers.update(financier.id, { is_active: true });
      toast.success('Rahoittaja aktivoitu');
      fetchFinanciers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Virhe aktivoinnissa');
    }
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
          <h1 className="text-2xl font-display font-bold text-midnight-900">Rahoittajat</h1>
          <p className="text-slate-600 mt-1">Hallitse rahoittajia ja heidän käyttäjiään</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Lisää rahoittaja
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Hae rahoittajaa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
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

      {/* Financiers list */}
      {filteredList.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-midnight-900 mb-2">Ei rahoittajia</h3>
          <p className="text-slate-500 mb-6">Lisää ensimmäinen rahoittaja aloittaaksesi.</p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Lisää rahoittaja
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((financier, index) => (
            <motion.div
              key={financier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card ${!financier.is_active ? 'opacity-60 bg-slate-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    financier.is_active ? 'bg-emerald-100' : 'bg-slate-200'
                  }`}>
                    <Building2 className={`w-6 h-6 ${
                      financier.is_active ? 'text-emerald-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-900">{financier.name}</h3>
                    {financier.is_active ? (
                      <span className="badge badge-green text-xs">Aktiivinen</span>
                    ) : (
                      <span className="badge badge-gray text-xs">Deaktivoitu</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openModal(financier)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                    title="Muokkaa"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  {financier.is_active ? (
                    <button
                      onClick={() => handleDeactivate(financier)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Deaktivoi"
                    >
                      <XCircle className="w-4 h-4 text-red-500" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(financier)}
                      className="p-2 hover:bg-green-50 rounded-lg"
                      title="Aktivoi"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-600">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  <a href={`mailto:${financier.email}`} className="hover:text-Kantama-600">
                    {financier.email}
                  </a>
                </div>
                {financier.phone && (
                  <div className="flex items-center text-slate-600">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {financier.phone}
                  </div>
                )}
                {financier.users && financier.users.length > 0 && (
                  <div className="flex items-center text-slate-600">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    {financier.users.length} käyttäjää
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <span>Lisätty: {formatDate(financier.created_at)}</span>
                <Link
                  to={`/admin/financiers/${financier.id}`}
                  className="text-Kantama-600 hover:text-Kantama-700 font-medium"
                >
                  Näytä lisää →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-midnight-900">
                  {editingFinancier ? 'Muokkaa rahoittajaa' : 'Uusi rahoittaja'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nimi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Rahoittaja Oy"
                    required
                  />
                </div>

                <div>
                  <label className="label">Sähköposti *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="info@rahoittaja.fi"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Puhelin</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="+358 9 123 4567"
                    />
                  </div>
                  <div>
                    <label className="label">Y-tunnus</label>
                    <input
                      type="text"
                      value={formData.business_id}
                      onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
                      className="input"
                      placeholder="1234567-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Osoite</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="Esimerkkikatu 1, 00100 Helsinki"
                  />
                </div>

                <div>
                  <label className="label">Muistiinpanot</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Sisäiset muistiinpanot..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-ghost">
                    Peruuta
                  </button>
                  <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? 'Tallennetaan...' : editingFinancier ? 'Tallenna' : 'Lisää'}
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




