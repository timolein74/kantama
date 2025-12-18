import { forwardRef } from 'react';
import type { Contract, LeaseObject } from '../../types/contract';
import type { Application } from '../../types';

interface ContractDocumentProps {
  contract: Contract;
  application: Application;
  logoUrl?: string;
  showDeliveryConfirmation?: boolean;
}

/**
 * Professional financing lease contract document
 * Based on Finnish leasing contract standards
 * Clean, professional PDF-ready design
 */
const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  ({ contract, application, logoUrl, showDeliveryConfirmation = true }, ref) => {
    const formatEuro = (value: number | null | undefined) => {
      if (value === null || value === undefined) return '€ 0,00';
      return `€ ${value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateFi = (date: string | null | undefined) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('fi-FI');
    };

    const leaseObjects: LeaseObject[] = contract.lease_objects || [];
    const today = new Date().toLocaleDateString('fi-FI');
    const contractNumber = contract.contract_number || 'XXXXXXXXXX';

    // Styles for print
    const tableStyle = {
      borderCollapse: 'collapse' as const,
      width: '100%',
    };

    const cellStyle = {
      border: '1px solid #374151',
      padding: '6px 10px',
      fontSize: '9pt',
      verticalAlign: 'top' as const,
    };

    const headerCellStyle = {
      ...cellStyle,
      backgroundColor: '#f3f4f6',
      fontWeight: 'bold' as const,
    };

    return (
      <div 
        ref={ref}
        className="bg-white text-gray-900"
        style={{ 
          fontFamily: 'Arial, Helvetica, sans-serif',
          width: '210mm', 
          minHeight: '297mm', 
          padding: '15mm 20mm',
          boxSizing: 'border-box',
          fontSize: '10pt',
          lineHeight: '1.4',
          color: '#1f2937'
        }}
      >
        {/* ===== PAGE 1: SOPIMUSETUSIVU ===== */}
        
        {/* HEADER */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '3px solid #1f2937'
        }}>
          {/* Logo and company name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {contract.lessor_company_name?.[0] || 'R'}
              </div>
            )}
            <div>
              <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1f2937' }}>
                {contract.lessor_company_name || 'Rahoittaja Oy'}
              </div>
              {contract.lessor_business_id && (
                <div style={{ fontSize: '9pt', color: '#6b7280' }}>
                  Y-tunnus: {contract.lessor_business_id}
                </div>
              )}
            </div>
          </div>
          
          {/* Document title */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '5px'
            }}>
              Rahoitusleasingsopimus
            </div>
            <div style={{ 
              background: '#f3f4f6', 
              padding: '8px 15px', 
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '8pt', color: '#6b7280' }}>Sopimusnumero</div>
              <div style={{ 
                fontSize: '14pt', 
                fontWeight: 'bold', 
                fontFamily: 'Monaco, Consolas, monospace',
                letterSpacing: '1px'
              }}>
                {contractNumber}
              </div>
            </div>
          </div>
        </div>

        {/* CONTRACT NUMBER BOX */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              <tr>
                <td style={{ 
                  ...headerCellStyle, 
                  padding: '4px 8px',
                  fontSize: '8pt'
                }}>
                  Sopimusnumero
                </td>
                {contractNumber.split('').map((char, i) => (
                  <td key={i} style={{ 
                    ...cellStyle, 
                    padding: '4px 8px',
                    textAlign: 'center',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontWeight: 'bold',
                    width: '22px'
                  }}>
                    {char}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* VUOKRALLEOTTAJA */}
        <table style={{ ...tableStyle, marginBottom: '15px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                VUOKRALLEOTTAJA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: '50%' }}>
                <span style={{ color: '#6b7280' }}>Nimi: </span>
                <strong>{contract.lessee_company_name}</strong>
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Y-tunnus: </span>
                <span style={{ fontFamily: 'monospace' }}>{contract.lessee_business_id}</span>
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Katuosoite: </span>
                {contract.lessee_street_address}
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Postinumero ja -toimipaikka: </span>
                {contract.lessee_postal_code} {contract.lessee_city}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Yhteyshenkilö: </span>
                {contract.lessee_contact_person}
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Puhelinnumero: </span>
                {contract.lessee_phone}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Sähköpostiosoite: </span>
                {contract.lessee_email}
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Verotusmaa: </span>
                {contract.lessee_tax_country || 'Suomi'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* VUOKRALLEANTAJA */}
        <table style={{ ...tableStyle, marginBottom: '15px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                VUOKRALLEANTAJA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: '50%' }}>
                <span style={{ color: '#6b7280' }}>Nimi: </span>
                <strong>{contract.lessor_company_name}</strong>
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Y-tunnus: </span>
                <span style={{ fontFamily: 'monospace' }}>{contract.lessor_business_id || '-'}</span>
              </td>
            </tr>
            {contract.lessor_street_address && (
              <tr>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Katuosoite: </span>
                  {contract.lessor_street_address}
                </td>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Postinumero ja -toimipaikka: </span>
                  {contract.lessor_postal_code} {contract.lessor_city}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* MYYJÄ */}
        {contract.seller_company_name && (
          <table style={{ ...tableStyle, marginBottom: '15px' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ 
                  ...headerCellStyle, 
                  textAlign: 'left',
                  fontSize: '10pt',
                  padding: '8px 10px',
                  backgroundColor: '#e5e7eb'
                }}>
                  MYYJÄ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, width: '50%' }}>
                  <span style={{ color: '#6b7280' }}>Nimi: </span>
                  <strong>{contract.seller_company_name}</strong>
                </td>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Y-tunnus: </span>
                  <span style={{ fontFamily: 'monospace' }}>{contract.seller_business_id || '-'}</span>
                </td>
              </tr>
              <tr>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Katuosoite: </span>
                  {contract.seller_street_address}
                </td>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Postinumero ja -toimipaikka: </span>
                  {contract.seller_postal_code} {contract.seller_city}
                </td>
              </tr>
              <tr>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Yhteyshenkilö: </span>
                  {contract.seller_contact_person}
                </td>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Puhelinnumero: </span>
                  {contract.seller_phone}
                </td>
              </tr>
              <tr>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Sähköpostiosoite: </span>
                  {contract.seller_email}
                </td>
                <td style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Verotusmaa: </span>
                  {contract.seller_tax_country || 'Suomi'}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* VUOKRAKOHDE */}
        <table style={{ ...tableStyle, marginBottom: '15px' }}>
          <thead>
            <tr>
              <th colSpan={5} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                VUOKRAKOHDE
              </th>
            </tr>
            <tr>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Uusi/Käytetty</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Merkki ja malli</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Lisävarusteet</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Sarja-/Rekisterinumero</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Vuosimalli</th>
            </tr>
          </thead>
          <tbody>
            {leaseObjects.length > 0 ? (
              leaseObjects.map((obj, index) => (
                <tr key={index}>
                  <td style={{ ...cellStyle, width: '12%' }}>{obj.is_new ? 'Uusi' : 'Käytetty'}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold', width: '30%' }}>{obj.brand_model}</td>
                  <td style={{ ...cellStyle, width: '20%' }}>{obj.accessories || ''}</td>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '8pt', width: '23%' }}>{obj.serial_number || ''}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', width: '15%' }}>{obj.year_model || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cellStyle}></td>
                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{application.equipment_description}</td>
                <td style={cellStyle}></td>
                <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '8pt' }}>{application.equipment_serial_number || ''}</td>
                <td style={cellStyle}></td>
              </tr>
            )}
            <tr>
              <td colSpan={5} style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Käyttöpaikka: </span>
                {contract.usage_location || 'Suomi'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TOIMITUS */}
        <table style={{ ...tableStyle, marginBottom: '10px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                TOIMITUS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: '50%' }}>
                <span style={{ color: '#6b7280' }}>Toimitustapa: </span>
                {contract.delivery_method || 'Toimitus'}
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Arvioitu toimituspäivä: </span>
                {formatDateFi(contract.estimated_delivery_date)}
              </td>
            </tr>
            {contract.other_delivery_terms && (
              <tr>
                <td colSpan={2} style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Muut toimitusehdot: </span>
                  {contract.other_delivery_terms}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p style={{ fontSize: '8pt', color: '#6b7280', fontStyle: 'italic', marginBottom: '15px' }}>
          Vuokralleottajan tulee toimittaa allekirjoittamansa toimitusvahvistus vuokralleantajalle välittömästi vuokrakohteen toimituksen jälkeen.
        </p>

        {/* VUOKRAN MÄÄRÄ */}
        <table style={{ ...tableStyle, marginBottom: '10px' }}>
          <thead>
            <tr>
              <th colSpan={4} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                VUOKRAN MÄÄRÄ
              </th>
            </tr>
            <tr>
              <th colSpan={4} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '9pt',
                backgroundColor: '#f9fafb',
                padding: '6px 10px'
              }}>
                Vuokraerät:
              </th>
            </tr>
            <tr>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb', width: '25%' }}>Nro.</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb', width: '25%' }}>Vuokrajakson pituus</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb', width: '25%' }}>Arvioitu eräpäivä</th>
              <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb', width: '25%', textAlign: 'right' }}>Vuokraerä (ALV 0%)</th>
            </tr>
          </thead>
          <tbody>
            {contract.advance_payment && contract.advance_payment > 0 && (
              <tr>
                <td style={cellStyle}>Ennakkovuokra</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>
                  {formatEuro(contract.advance_payment)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>
                {contract.rent_installments_start || 1}-{contract.rent_installments_end || contract.lease_period_months}
              </td>
              <td style={cellStyle}>{contract.lease_period_months} kk</td>
              <td style={cellStyle}>{contract.lease_start_date ? formatDateFi(contract.lease_start_date) : 'Toimituspäivästä'}</td>
              <td style={{ 
                ...cellStyle, 
                textAlign: 'right', 
                fontWeight: 'bold',
                fontSize: '12pt',
                color: '#059669'
              }}>
                {formatEuro(contract.monthly_rent)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ ...cellStyle, backgroundColor: '#f9fafb' }}>
                <strong style={{ color: '#374151' }}>
                  Jäännösarvo varsinaisen vuokra-ajan päättyessä (alv 0%) {formatEuro(contract.residual_value)}
                </strong>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Käsittelymaksu/vuokraerä: </span>
                <strong>{formatEuro(contract.processing_fee || 500)}</strong>
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Järjestelypalkkio: </span>
                <strong>{formatEuro(contract.arrangement_fee || 10)}</strong>
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Laskutustapa: </span>
                <strong>{contract.invoicing_method || 'E-Lasku'}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '15px' }}>
          Vuokraan ja muihin tämän rahoitusleasingsopimuksen mukaisiin palkkioihin lisätään arvonlisävero kulloinkin voimassaolevien säännösten mukaan. 
          Järjestelypalkkio lisätään ensimmäiseen vuokraerään ja käsittelymaksu lisätään jokaiseen vuokraerään.
        </p>

        {/* VUOKRA-AIKA */}
        <table style={{ ...tableStyle, marginBottom: '10px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ 
                ...headerCellStyle, 
                textAlign: 'left',
                fontSize: '10pt',
                padding: '8px 10px',
                backgroundColor: '#e5e7eb'
              }}>
                VUOKRA-AIKA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: '50%' }}>
                <span style={{ color: '#6b7280' }}>Vuokra-aika/kk: </span>
                <strong style={{ fontSize: '14pt' }}>{contract.lease_period_months}</strong>
              </td>
              <td style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Vuokra-ajan alkamispäivä: </span>
                <strong>
                  {contract.lease_start_date ? formatDateFi(contract.lease_start_date) : '(täytetään toimituksen jälkeen)'}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '15px' }}>
          Vuokra-aika alkaa vuokrakohteen toimituspäivänä.
        </p>

        {/* ERITYISEHDOT */}
        {(contract.special_conditions || contract.guarantees || contract.guarantee_type) && (
          <table style={{ ...tableStyle, marginBottom: '15px' }}>
            <thead>
              <tr>
                <th style={{ 
                  ...headerCellStyle, 
                  textAlign: 'left',
                  fontSize: '10pt',
                  padding: '8px 10px',
                  backgroundColor: '#e5e7eb'
                }}>
                  ERITYISEHDOT JA VAKUUDET
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cellStyle}>
                  {contract.guarantee_type && (
                    <p style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Vakuuden tyyppi: </span>
                      <strong>{contract.guarantee_type}</strong>
                    </p>
                  )}
                  {contract.guarantees && (
                    <p style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Vakuudet: </span>
                      {contract.guarantees}
                    </p>
                  )}
                  {contract.special_conditions && (
                    <p>
                      <span style={{ color: '#6b7280' }}>Erityisehdot: </span>
                      {contract.special_conditions}
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* PAGE 1 FOOTER */}
        <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '9pt', color: '#6b7280' }}>
          <p>NIMIKIRJAIMET ___________</p>
          <p style={{ marginTop: '10px' }}>Sivu 1/3</p>
        </div>

        {/* ===== PAGE 2: YLEISET SOPIMUSEHDOT ===== */}
        <div style={{ pageBreakBefore: 'always' }}></div>
        
        {/* Page 2 header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '1px solid #d1d5db'
        }}>
          <span style={{ fontSize: '10pt', fontWeight: 'bold', color: '#374151' }}>
            Rahoitusleasingsopimus
          </span>
          <span style={{ fontSize: '9pt', color: '#6b7280' }}>
            Sopimusnumero: <strong style={{ fontFamily: 'monospace' }}>{contractNumber}</strong>
          </span>
        </div>

        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '12pt', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Yleiset sopimusehdot
        </h2>
        
        <div style={{ 
          columnCount: 2, 
          columnGap: '25px',
          columnRule: '1px solid #e5e7eb',
          fontSize: '8pt',
          lineHeight: '1.5',
          color: '#374151'
        }}>
          {/* Terms 1-11 */}
          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>1. SOPIMUKSEN TARKOITUS</h4>
            <p style={{ textAlign: 'justify' }}>Tällä sopimuksella vuokralleantaja antaa vuokralleottajalle vuokralle sopimuksen etusivulla määritellyn vuokrakohteen. Vuokrakohde on tarkoitettu käytettäväksi vuokralleottajan liiketoiminnassa.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>2. SOPIMUKSEN VOIMASSAOLO</h4>
            <p style={{ textAlign: 'justify' }}>Sopimus on voimassa toistaiseksi, kunnes jompikumpi osapuoli irtisanoo sen päättymään. Sopimus voidaan irtisanoa aikaisintaan sopimuksen kansilehdellä mainitun varsinaisen vuokra-ajan päätyttyä. Irtisanomisaika on kolme (3) kuukautta.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>3. VUOKRAKOHTEEN TOIMITUS JA OMISTUSOIKEUS</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantaja tai vuokralleantajan osoittama myyjä toimittaa vuokrakohteen vuokralleottajalle sopimuksen etusivulla sovitun mukaisesti. Vuokrakohteen omistusoikeus säilyy vuokralleantajalla koko sopimuksen voimassaoloajan. Vuokralleottajalla ei ole oikeutta myydä, pantata tai muutoin luovuttaa vuokrakohdetta tai siihen liittyviä oikeuksia.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>4. VUOKRAKOHTEEN TARKASTUS</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottajan on tarkastettava vuokrakohde viipymättä toimituksen jälkeen ja ilmoitettava välittömästi vuokralleantajalle ja myyjälle kirjallisesti mahdollisista virheistä. Vuokralleottaja menettää oikeutensa vedota virheeseen, ellei ilmoitusta ole tehty 14 päivän kuluessa toimituksesta.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>5. VUOKRAKOHTEEN KÄYTTÖ JA HOITO</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja sitoutuu käyttämään vuokrakohdetta huolellisesti ja vain sen tavanomaiseen käyttötarkoitukseen. Vuokralleottaja vastaa vuokrakohteen asianmukaisesta huollosta, kunnossapidosta ja korjauksista omalla kustannuksellaan. Vuokrakohteeseen ei saa tehdä muutoksia ilman vuokralleantajan kirjallista suostumusta.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>6. VUOKRA JA MAKSUEHDOT</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja sitoutuu maksamaan vuokralleantajalle sopimuksen etusivulla määritellyn vuokran sovituissa erissä. Vuokraan lisätään kulloinkin voimassa oleva arvonlisävero. Maksujen viivästyessä vuokralleottaja on velvollinen maksamaan viivästyskorkoa korkolain mukaisesti.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>7. VUOKRAN JA PALKKIOIDEN MUUTOKSET</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantajalla on oikeus tarkistaa vuokraa ja palkkioita vuosittain yleisen kustannustason ja korkojen muutoksia vastaavasti. Muutoksista ilmoitetaan vuokralleottajalle kirjallisesti vähintään 30 päivää ennen muutoksen voimaantuloa.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>8. VAKUUTUKSET</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja sitoutuu pitämään vuokrakohteen asianmukaisesti vakuutettuna koko vuokra-ajan. Vakuutuksen tulee kattaa vuokrakohteen täysi jälleenhankinta-arvo ja sisältää vähintään palo-, varkaus- ja vahingonkorvausvakuutuksen. Vakuutuskirjaan tulee merkitä vuokralleantaja edunsaajaksi.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>9. VUOKRAKOHTEEN VAHINGOITTUMINEN TAI TUHOUTUMINEN</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja on velvollinen ilmoittamaan vuokralleantajalle välittömästi vuokrakohteelle sattuneesta vahingosta. Vahinko ei vapauta vuokralleottajaa vuokranmaksuvelvollisuudesta. Vakuutuskorvaus on käytettävä vuokrakohteen korjaamiseen tai se suoritetaan vuokralleantajalle.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>10. VASTUU KOLMANSILLE</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja vastaa kaikista vuokrakohteen käytöstä kolmansille aiheutuneista vahingoista ja pitää vuokralleantajan vapaana kaikista tällaisista vaatimuksista.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>11. SOPIMUSRIKKOMUS JA SOPIMUKSEN PURKAMINEN</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantajalla on oikeus purkaa sopimus välittömästi, mikäli: a) vuokralleottaja laiminlyö vuokran tai muiden maksujen suorittamisen; b) vuokralleottaja rikkoo olennaisesti sopimuksen muita ehtoja; c) vuokralleottaja asetetaan konkurssiin tai yrityssaneeraukseen; d) vuokralleottajan taloudellinen tilanne heikkenee olennaisesti.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>12. SOPIMUKSEN ENNENAIKAINEN PÄÄTTYMINEN</h4>
            <p style={{ textAlign: 'justify' }}>Sopimuksen ennenaikaisesti päättyessä vuokralleottaja on velvollinen maksamaan vuokralleantajalle kaikki jäljellä olevat vuokraerät, vakuutuskorvaukset ja mahdolliset muut saatavat. Vuokralleantajalla on oikeus vaatia vuokrakohteen välitöntä palauttamista.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>13. LUNASTUSOIKEUS</h4>
            <p style={{ textAlign: 'justify' }}>Sopimuksen päättyessä vuokralleottajalla on oikeus lunastaa vuokrakohde sopimuksen etusivulla mainitulla jäännösarvolla, mikäli vuokralleottaja on täyttänyt kaikki sopimuksen mukaiset velvoitteensa.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>14. VUOKRAKOHTEEN PALAUTTAMINEN</h4>
            <p style={{ textAlign: 'justify' }}>Mikäli vuokralleottaja ei lunasta vuokrakohdetta, on vuokrakohde palautettava vuokralleantajan osoittamaan paikkaan vuokralleottajan kustannuksella. Vuokrakohteen on oltava hyvässä ja toimintakuntoisessa tilassa normaali kuluminen huomioon ottaen.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>15. VIRANOMAISVAATIMUKSET</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottaja vastaa siitä, että vuokrakohde täyttää kaikki viranomaisten asettamat vaatimukset koko vuokra-ajan ja vastaa kaikista tähän liittyvistä kustannuksista.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>16. VUOKRALLEANTAJAN VASTUU</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantaja ei vastaa vuokrakohteen virheistä tai puutteista, toimituksen viivästymisestä eikä mistään välillisistä vahingoista. Vuokralleottajan tulee kohdistaa vaatimuksensa suoraan myyjälle.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>17. TARKASTUSOIKEUS</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantajalla tai sen valtuuttamalla edustajalla on oikeus milloin tahansa kohtuullisella ilmoitusajalla tarkastaa vuokrakohde ja sen kunto.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>18. YLIVOIMAINEN ESTE</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantaja ei vastaa vahingosta, joka johtuu lainsäädännöstä, viranomaisten toimista, sotatoimista, lakosta, työsulusta, saarrosta, pandemiasta, katkoksesta tietoliikenneyhteyksissä tai muusta ylivoimaisesta esteestä.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>19. VUOKRALLEOTTAJAN TIEDONANTOVELVOLLISUUS</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleottajan tulee ilmoittaa vuokralleantajalle yhteystiedoissaan tapahtuvista muutoksista. Vuokralleottajan tulee myös ilmoittaa muutoksista yhtiömuodossa, omistussuhteissa ja liiketoiminnassa. Vuokralleottajan on vuokralleantajan pyynnöstä toimitettava viimeisin tilinpäätöksensä.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>20. SOPIMUKSEN SIIRTO</h4>
            <p style={{ textAlign: 'justify' }}>Vuokralleantajalla on oikeus siirtää tämä sopimus kaikkine oikeuksineen kolmannelle osapuolelle. Vuokralleottajalla ei ole oikeutta siirtää tätä sopimusta ilman vuokralleantajan etukäteistä kirjallista suostumusta.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>21. MUUTOKSET</h4>
            <p style={{ textAlign: 'justify' }}>Osapuolten on sovittava kaikista muutoksista tähän sopimukseen kirjallisesti.</p>
          </div>

          <div style={{ breakInside: 'avoid', marginBottom: '10px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '2px', fontSize: '8pt' }}>22. SOVELLETTAVA LAKI JA ERIMIELISYYKSIEN RATKAISU</h4>
            <p style={{ textAlign: 'justify' }}>Tähän sopimukseen sovelletaan Suomen lakia. Tähän sopimukseen ei sovelleta irtaimen esineen vuokraa koskevia säännöksiä ja periaatteita. Mikäli erimielisyyksiä ei voida ratkaista osapuolten välisillä neuvotteluilla, asia ratkaistaan ensimmäisenä asteena vastaajan kotipaikan alioikeudessa tai Helsingin käräjäoikeudessa.</p>
          </div>
        </div>

        {/* Page 2 footer */}
        <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '9pt', color: '#6b7280' }}>
          <p>NIMIKIRJAIMET ___________</p>
          <p style={{ marginTop: '10px' }}>Sivu 2/3</p>
        </div>

        {/* ===== PAGE 3: ALLEKIRJOITUKSET ===== */}
        <div style={{ pageBreakBefore: 'always' }}></div>
        
        {/* Page 3 header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '1px solid #d1d5db'
        }}>
          <span style={{ fontSize: '10pt', fontWeight: 'bold', color: '#374151' }}>
            Rahoitusleasingsopimus
          </span>
          <span style={{ fontSize: '9pt', color: '#6b7280' }}>
            Sopimusnumero: <strong style={{ fontFamily: 'monospace' }}>{contractNumber}</strong>
          </span>
        </div>

        {/* Contract confirmation text */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '15px', 
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '10pt'
        }}>
          <p style={{ color: '#374151' }}>
            Tämä sopimus on laadittu kahtena samansisältöisenä kappaleena, yksi kummallekin osapuolelle. 
            Allekirjoituksellaan osapuolet vahvistavat tutustuneensa sopimuksen ehtoihin ja sitoutuvat noudattamaan niitä.
          </p>
        </div>

        {/* ALLEKIRJOITUKSET */}
        <h3 style={{ 
          textAlign: 'center', 
          fontWeight: 'bold',
          fontSize: '11pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '25px',
          color: '#1f2937'
        }}>
          Allekirjoitukset
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* VUOKRALLEOTTAJA */}
          <div style={{ 
            border: '1px solid #d1d5db', 
            borderRadius: '8px', 
            padding: '20px'
          }}>
            <h4 style={{ 
              fontWeight: 'bold', 
              color: '#374151',
              textAlign: 'center',
              backgroundColor: '#f3f4f6',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '10pt'
            }}>
              VUOKRALLEOTTAJAN ALLEKIRJOITUS
            </h4>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Paikka ja päivämäärä</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '30px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '5px'
              }}>
                {contract.lessee_signature_place && contract.lessee_signature_date ? (
                  <span style={{ fontSize: '10pt', fontWeight: '500' }}>
                    {contract.lessee_signature_place}, {formatDateFi(contract.lessee_signature_date)}
                  </span>
                ) : null}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Allekirjoitus</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {contract.lessee_signer_name && contract.status === 'SIGNED' ? (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#059669', fontWeight: '500', fontSize: '10pt' }}>✓ Allekirjoitettu sähköisesti</span>
                    <p style={{ fontSize: '8pt', color: '#6b7280' }}>{formatDateFi(contract.signed_at)}</p>
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Nimenselvennys</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '30px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '5px'
              }}>
                {contract.lessee_signer_name ? (
                  <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{contract.lessee_signer_name}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* VUOKRALLEANTAJA */}
          <div style={{ 
            border: '1px solid #d1d5db', 
            borderRadius: '8px', 
            padding: '20px'
          }}>
            <h4 style={{ 
              fontWeight: 'bold', 
              color: '#374151',
              textAlign: 'center',
              backgroundColor: '#f3f4f6',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '10pt'
            }}>
              VUOKRALLEANTAJAN ALLEKIRJOITUS
            </h4>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Paikka ja päivämäärä</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '30px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '5px'
              }}>
                {contract.lessor_signature_place && contract.lessor_signature_date ? (
                  <span style={{ fontSize: '10pt', fontWeight: '500' }}>
                    {contract.lessor_signature_place}, {formatDateFi(contract.lessor_signature_date)}
                  </span>
                ) : null}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Allekirjoitus</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '60px'
              }}>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Nimenselvennys</p>
              <div style={{ 
                borderBottom: '2px solid #374151', 
                height: '30px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '5px'
              }}>
                {contract.lessor_signer_name ? (
                  <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{contract.lessor_signer_name}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Bank payment details */}
        {(contract.bank_name || contract.bank_iban) && (
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '10px', fontSize: '10pt' }}>MAKSUTIEDOT</h4>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '15px',
              fontSize: '9pt'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Pankki: </span>
                  <strong>{contract.bank_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>IBAN: </span>
                  <strong style={{ fontFamily: 'monospace' }}>{contract.bank_iban}</strong>
                </div>
                {contract.bank_bic && (
                  <div>
                    <span style={{ color: '#6b7280' }}>BIC/SWIFT: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{contract.bank_bic}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '25px', 
          borderTop: '1px solid #d1d5db',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: '35px', width: 'auto', objectFit: 'contain' }} />
            ) : (
              <div style={{ 
                width: '35px', 
                height: '35px', 
                backgroundColor: '#374151',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14pt',
                fontWeight: 'bold'
              }}>
                {contract.lessor_company_name?.[0] || 'R'}
              </div>
            )}
            <div style={{ textAlign: 'left', fontSize: '9pt', color: '#4b5563' }}>
              <p style={{ fontWeight: 'bold' }}>{contract.lessor_company_name || 'Rahoittaja Oy'}</p>
              {contract.lessor_business_id && <p>Y-tunnus: {contract.lessor_business_id}</p>}
            </div>
          </div>
          {contract.lessor_street_address && (
            <p style={{ fontSize: '9pt', color: '#6b7280' }}>
              {contract.lessor_street_address}, {contract.lessor_postal_code} {contract.lessor_city}
            </p>
          )}
          <p style={{ fontSize: '8pt', color: '#9ca3af', marginTop: '15px' }}>
            Sopimus luotu Kantama-palvelussa • {formatDateFi(contract.created_at)}
          </p>
          <p style={{ marginTop: '10px', textAlign: 'right', fontSize: '9pt', color: '#6b7280' }}>Sivu 3/3</p>
        </div>

        {/* ===== PAGE 4: TOIMITUKSEN HYVÄKSYMISILMOITUS (Optional) ===== */}
        {showDeliveryConfirmation && (
          <>
            <div style={{ pageBreakBefore: 'always' }}></div>
            
            {/* Page 4 header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '3px solid #1f2937'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {contract.lessor_company_name?.[0] || 'R'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1f2937' }}>
                    {contract.lessor_company_name || 'Rahoittaja Oy'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1f2937' }}>
                  Toimituksen Hyväksymisilmoitus
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ 
              marginBottom: '25px', 
              padding: '15px', 
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '9pt'
            }}>
              <p style={{ color: '#92400e' }}>
                <strong>Ohje:</strong> Allekirjoita ja palauta tämä asiakirja välittömästi kohteen toimituksen jälkeen 
                sähköpostitse osoitteeseen: {contract.lessee_email || 'asiakaspalvelu@rahoittaja.fi'}
              </p>
            </div>

            {/* VUOKRALLEOTTAJA */}
            <table style={{ ...tableStyle, marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ ...headerCellStyle, textAlign: 'left', backgroundColor: '#e5e7eb' }}>
                    VUOKRALLEOTTAJA
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, width: '50%' }}>
                    <span style={{ color: '#6b7280' }}>Nimi: </span>
                    <strong>{contract.lessee_company_name}</strong>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Y-tunnus: </span>
                    <span style={{ fontFamily: 'monospace' }}>{contract.lessee_business_id}</span>
                  </td>
                </tr>
                <tr>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Katuosoite: </span>
                    {contract.lessee_street_address}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Postinumero ja -toimipaikka: </span>
                    {contract.lessee_postal_code} {contract.lessee_city}
                  </td>
                </tr>
                <tr>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Yhteyshenkilö: </span>
                    {contract.lessee_contact_person}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Puhelinnumero: </span>
                    {contract.lessee_phone}
                  </td>
                </tr>
                <tr>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Sähköpostiosoite: </span>
                    {contract.lessee_email}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Sopimusnumero: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{contractNumber}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* VUOKRAKOHDE */}
            <table style={{ ...tableStyle, marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={3} style={{ ...headerCellStyle, textAlign: 'left', backgroundColor: '#e5e7eb' }}>
                    VUOKRAKOHDE
                  </th>
                </tr>
                <tr>
                  <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Vuokrakohteen nimi, laatu, merkki ja malli</th>
                  <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Lisävarusteet</th>
                  <th style={{ ...headerCellStyle, fontSize: '8pt', backgroundColor: '#f9fafb' }}>Sarja-/Rekisterinumero</th>
                </tr>
              </thead>
              <tbody>
                {leaseObjects.length > 0 ? (
                  leaseObjects.map((obj, index) => (
                    <tr key={index}>
                      <td style={{ ...cellStyle, fontWeight: 'bold' }}>
                        {obj.brand_model}{obj.year_model ? `, vm. ${obj.year_model}` : ''}
                      </td>
                      <td style={cellStyle}>{obj.accessories || ''}</td>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '9pt' }}>{obj.serial_number || ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{application.equipment_description}</td>
                    <td style={cellStyle}></td>
                    <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '9pt' }}>{application.equipment_serial_number || ''}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* TOIMITUS */}
            <table style={{ ...tableStyle, marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ ...headerCellStyle, textAlign: 'left', backgroundColor: '#e5e7eb' }}>
                    TOIMITUS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, width: '50%' }}>
                    <span style={{ color: '#6b7280' }}>Toimituspäivä: </span>
                    <strong>{formatDateFi(contract.estimated_delivery_date) || '_______________'}</strong>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ color: '#6b7280' }}>Toimituspaikka: </span>
                    <strong>{contract.usage_location || '_______________'}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* VAHVISTUS JA HYVÄKSYNTÄ */}
            <table style={{ ...tableStyle, marginBottom: '25px' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', backgroundColor: '#e5e7eb' }}>
                    VAHVISTUS JA HYVÄKSYNTÄ
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, padding: '15px' }}>
                    <p style={{ marginBottom: '15px', fontStyle: 'italic', color: '#374151' }}>
                      Vahvistamme, että yllä mainittu vuokrakohde on toimitettu meille sovitun mukaisesti. 
                      Olemme huolellisesti tarkastaneet vuokrakohteen ja hyväksymme sen allekirjoittamalla 
                      tämän toimituksen hyväksymisilmoituksen.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Allekirjoitus */}
            <div style={{ 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              padding: '20px',
              maxWidth: '400px'
            }}>
              <h4 style={{ 
                fontWeight: 'bold', 
                marginBottom: '15px',
                fontSize: '10pt',
                color: '#374151'
              }}>
                VUOKRALLEOTTAJAN ALLEKIRJOITUS
              </h4>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Paikka ja päivämäärä</p>
                <div style={{ borderBottom: '2px solid #374151', height: '25px' }}></div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Allekirjoitus</p>
                <div style={{ borderBottom: '2px solid #374151', height: '50px' }}></div>
              </div>
              <div>
                <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '5px' }}>Nimenselvennys</p>
                <div style={{ borderBottom: '2px solid #374151', height: '25px' }}></div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: '40px', 
              paddingTop: '20px', 
              borderTop: '1px solid #d1d5db',
              textAlign: 'center',
              fontSize: '8pt',
              color: '#6b7280'
            }}>
              <p><strong>{contract.lessor_company_name || 'Rahoittaja Oy'}</strong></p>
              {contract.lessor_business_id && <p>Y-tunnus: {contract.lessor_business_id}</p>}
              {contract.lessor_street_address && (
                <p>{contract.lessor_street_address}, {contract.lessor_postal_code} {contract.lessor_city}</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
);

ContractDocument.displayName = 'ContractDocument';

export default ContractDocument;
