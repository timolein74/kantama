import { Building2, MapPin, Phone, Globe, Mail, Briefcase, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CompanyInfo } from '../lib/api';

interface YTJInfoCardProps {
  ytjData: CompanyInfo;
  compact?: boolean;
}

export default function YTJInfoCard({ ytjData, compact = false }: YTJInfoCardProps) {
  if (!ytjData) return null;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fi-FI');
  };

  if (compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">PRH/YTJ-tiedot</span>
          {ytjData.is_active ? (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Aktiivinen
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Ei aktiivinen
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">Yritysmuoto:</span>
            <span className="ml-1 font-medium">{ytjData.company_form || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500">Toimiala:</span>
            <span className="ml-1 font-medium">{ytjData.main_business || '-'}</span>
          </div>
          {ytjData.phone && (
            <div>
              <span className="text-slate-500">Puhelin:</span>
              <span className="ml-1 font-medium">{ytjData.phone}</span>
            </div>
          )}
          {ytjData.website && (
            <div>
              <span className="text-slate-500">Verkkosivu:</span>
              <a href={ytjData.website.startsWith('http') ? ytjData.website : `https://${ytjData.website}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="ml-1 font-medium text-blue-600 hover:underline">
                {ytjData.website}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">PRH/YTJ-tiedot</h3>
              <p className="text-blue-100 text-sm">Haettu automaattisesti rekisteristä</p>
            </div>
          </div>
          {ytjData.is_active ? (
            <span className="flex items-center gap-1.5 bg-green-500/20 text-white px-3 py-1 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" /> Aktiivinen yritys
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-orange-500/30 text-white px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4" /> Ei aktiivinen
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Perustiedot */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Perustiedot</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-600">Y-tunnus:</dt>
                <dd className="font-mono font-medium">{ytjData.business_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Yritysmuoto:</dt>
                <dd className="font-medium">{ytjData.company_form || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Rekisteröity:</dt>
                <dd className="font-medium">{formatDate(ytjData.registration_date)}</dd>
              </div>
              {ytjData.end_date && (
                <div className="flex justify-between text-red-600">
                  <dt>Päättynyt:</dt>
                  <dd className="font-medium">{formatDate(ytjData.end_date)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Toimiala</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-slate-600 text-sm">Päätoimiala:</dt>
                <dd className="font-medium">
                  {ytjData.main_business || '-'}
                  {ytjData.main_business_code && (
                    <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      TOL: {ytjData.main_business_code}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Osoitteet */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {ytjData.visiting_address && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Käyntiosoite
              </h4>
              <address className="not-italic text-slate-700">
                {ytjData.visiting_address.street && <div>{ytjData.visiting_address.street}</div>}
                {(ytjData.visiting_address.postal_code || ytjData.visiting_address.city) && (
                  <div>{ytjData.visiting_address.postal_code} {ytjData.visiting_address.city}</div>
                )}
              </address>
            </div>
          )}

          {ytjData.postal_address && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Postiosoite
              </h4>
              <address className="not-italic text-slate-700">
                {ytjData.postal_address.street && <div>{ytjData.postal_address.street}</div>}
                {(ytjData.postal_address.postal_code || ytjData.postal_address.city) && (
                  <div>{ytjData.postal_address.postal_code} {ytjData.postal_address.city}</div>
                )}
              </address>
            </div>
          )}
        </div>

        {/* Yhteystiedot */}
        {(ytjData.phone || ytjData.email || ytjData.website) && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Yhteystiedot</h4>
            <div className="flex flex-wrap gap-4">
              {ytjData.phone && (
                <a href={`tel:${ytjData.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600">
                  <Phone className="w-4 h-4" />
                  {ytjData.phone}
                </a>
              )}
              {ytjData.email && (
                <a href={`mailto:${ytjData.email}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600">
                  <Mail className="w-4 h-4" />
                  {ytjData.email}
                </a>
              )}
              {ytjData.website && (
                <a 
                  href={ytjData.website.startsWith('http') ? ytjData.website : `https://${ytjData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-700 hover:text-blue-600"
                >
                  <Globe className="w-4 h-4" />
                  {ytjData.website}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Muut toimialat */}
        {ytjData.business_lines && ytjData.business_lines.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Kaikki toimialat
            </h4>
            <div className="flex flex-wrap gap-2">
              {ytjData.business_lines.filter(bl => !bl.end_date).map((bl, idx) => (
                <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  {bl.description || bl.code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rekisterimerkinnät */}
        {ytjData.registered_entries && ytjData.registered_entries.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Rekisterimerkinnät
            </h4>
            <div className="space-y-1">
              {ytjData.registered_entries.map((entry, idx) => (
                <div key={idx} className="text-sm flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${entry.status === '1' ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className="text-slate-600">{entry.description || entry.register}</span>
                  {entry.date && <span className="text-slate-400 text-xs">({formatDate(entry.date)})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yrityksen tilanteet (selvitystila, konkurssi) */}
        {ytjData.company_situations && ytjData.company_situations.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Huomautukset
            </h4>
            <div className="space-y-1">
              {ytjData.company_situations.map((sit, idx) => (
                <div key={idx} className="text-sm text-orange-800">
                  {sit.description}
                  {sit.start_date && <span className="text-orange-600 text-xs ml-2">({formatDate(sit.start_date)})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

