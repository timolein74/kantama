import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  // Get the first day of the previous month
  const now = new Date();
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const formattedDate = firstDayPrevMonth.toLocaleDateString('fi-FI');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-midnight-950 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-slate-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Takaisin etusivulle
          </Link>
          <h1 className="text-3xl font-display font-bold">Tietosuojaseloste</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 prose prose-slate max-w-none">
          <p className="text-slate-500 mb-8">
            <strong>Viimeksi päivitetty:</strong> {formattedDate}
          </p>

          <p className="lead text-lg text-slate-600 mb-8">
            Kantama ("palvelu") on yrityksille suunnattu digitaalinen palvelu rahoitusleasing- ja 
            takaisinvuokraushakemusten käsittelyyn. Tietosuoja on meille tärkeää. Tässä selosteessa 
            kerromme, miten käsittelemme henkilötietoja.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">1. Rekisterinpitäjä</h2>
          <p>
            Kantama<br />
            Sähköposti: <a href="mailto:myynti@Kantama.fi" className="text-Kantama-600 hover:text-Kantama-700">myynti@Kantama.fi</a>
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">2. Käsiteltävät henkilötiedot</h2>
          <p>Keräämme vain palvelun kannalta välttämättömiä tietoja, kuten:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Yrityksen nimi ja Y-tunnus</li>
            <li>Yhteyshenkilön nimi</li>
            <li>Sähköpostiosoite</li>
            <li>Puhelinnumero</li>
            <li>Hakemuksiin liittyvät tiedot ja liitteet</li>
            <li>Käyttäjätilin kirjautumis- ja käyttöön liittyvät tekniset tiedot</li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">3. Henkilötietojen käyttötarkoitus</h2>
          <p>Tietoja käytetään:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>rahoitusleasing- ja takaisinvuokraushakemusten käsittelyyn</li>
            <li>käyttäjätilin luomiseen ja hallintaan</li>
            <li>yhteydenpitoon asiakkaan, adminin ja rahoittajien välillä</li>
            <li>tarjousten ja sopimusten toimittamiseen</li>
            <li>lakisääteisten velvoitteiden täyttämiseen</li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">4. Tietojen luovutus</h2>
          <p>Tietoja voidaan luovuttaa:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Kantamain valitsemille rahoittajille hakemuksen käsittelyä varten</li>
            <li>teknisille palveluntarjoajille (esim. sähköposti, hosting), vain palvelun toteuttamiseksi</li>
          </ul>
          <p className="mt-4 font-medium">Tietoja ei luovuteta ulkopuolisille markkinointitarkoituksiin.</p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">5. Tietojen säilytys</h2>
          <p>
            Tietoja säilytetään niin kauan kuin se on tarpeen palvelun tarjoamiseksi tai 
            lakisääteisten velvoitteiden täyttämiseksi.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">6. Rekisteröidyn oikeudet</h2>
          <p>Käyttäjällä on oikeus:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>tarkastaa omat tietonsa</li>
            <li>pyytää tietojen oikaisua tai poistamista</li>
            <li>rajoittaa tai vastustaa tietojen käsittelyä</li>
            <li>peruuttaa suostumuksensa, siltä osin kuin käsittely perustuu suostumukseen</li>
          </ul>
          <p className="mt-4">
            Pyynnöt: <a href="mailto:myynti@Kantama.fi" className="text-Kantama-600 hover:text-Kantama-700">myynti@Kantama.fi</a>
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">7. Tietoturva</h2>
          <p>
            Tietoja käsitellään suojatuissa järjestelmissä ja vain niihin oikeutettujen henkilöiden toimesta.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">8. Muutokset</h2>
          <p>
            Pidätämme oikeuden päivittää tätä tietosuojaselostetta. Muutoksista ilmoitetaan palvelussa.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-midnight-950 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400">
            © {new Date().getFullYear()} Kantama. Kaikki oikeudet pidätetään.
          </p>
        </div>
      </footer>
    </div>
  );
}



