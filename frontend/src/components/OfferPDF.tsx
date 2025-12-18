import { forwardRef } from 'react';
import type { Application, Offer } from '../types';
import { formatCurrency } from '../lib/utils';

interface OfferPDFProps {
  application: Application;
  offer: Offer;
  financierName?: string;
}

const OfferPDF = forwardRef<HTMLDivElement, OfferPDFProps>(
  ({ application, offer, financierName }, ref) => {
    const today = new Date().toLocaleDateString('fi-FI');
    const residualPercent = offer.residual_value && application.equipment_price
      ? ((offer.residual_value / application.equipment_price) * 100).toFixed(1)
      : null;

    return (
      <div ref={ref} className="bg-white p-8 max-w-2xl mx-auto print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">e</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Kantama</h1>
              <p className="text-sm text-slate-500">Rahoitustarjous</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p><strong>Päivämäärä:</strong> {today}</p>
            <p><strong>Viite:</strong> {application.reference_number}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Asiakas</h2>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-semibold text-slate-900">{application.company_name}</p>
            <p className="text-slate-600">Y-tunnus: {application.business_id}</p>
            {application.contact_email && (
              <p className="text-slate-600">{application.contact_email}</p>
            )}
          </div>
        </div>

        {/* Financier Info */}
        {financierName && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Rahoittaja</h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-900">{financierName}</p>
            </div>
          </div>
        )}

        {/* Offer Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Rahoitustarjous</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">Kauppasumma:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(application.equipment_price)} alv 0 %
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">Käsiraha:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(offer.upfront_payment || 0)} alv 0 %
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">Rahoitettava osuus:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(application.equipment_price - (offer.upfront_payment || 0))} alv 0 %
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-emerald-50">
                  <td className="py-4 px-4 text-emerald-700 font-medium">Kuukausierä:</td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-700 text-xl">
                    {formatCurrency(offer.monthly_payment)} alv 0 %
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">Sopimusaika:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {offer.term_months} kk
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">Avausmaksu:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    300 € alv 0 %
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">Laskutuslisä:</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    9 €/kk
                  </td>
                </tr>
                {residualPercent && (
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-600">Jäännösarvo:</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {residualPercent} %
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-500 mt-3 italic">
            Hintoihin lisätään voimassa oleva arvonlisävero
          </p>
        </div>

        {/* Additional Services */}
        {offer.included_services && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Lisäpalvelut</h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{offer.included_services}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {offer.notes_to_customer && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Lisätiedot</h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{offer.notes_to_customer}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>Tämä on alustava rahoitustarjous. Lopullinen sopimus syntyy vasta erillisellä allekirjoituksella.</p>
          <p className="mt-2">
            Kantama • myynti@Kantama.fi • www.Kantama.fi
          </p>
        </div>
      </div>
    );
  }
);

OfferPDF.displayName = 'OfferPDF';

export default OfferPDF;



