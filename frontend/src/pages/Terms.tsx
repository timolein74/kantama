import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
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
          <h1 className="text-3xl font-display font-bold">Käyttöehdot</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 prose prose-slate max-w-none">
          <p className="text-slate-500 mb-8">
            <strong>Viimeksi päivitetty:</strong> {formattedDate}
          </p>

          <p className="lead text-lg text-slate-600 mb-8">
            Käyttämällä Kantama-palvelua hyväksyt nämä käyttöehdot.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">1. Palvelun kuvaus</h2>
          <p>Kantama on digitaalinen palvelu, jonka avulla yritykset voivat:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>hakea rahoitusleasingiä</li>
            <li>hakea myynti- ja takaisinvuokrausjärjestelyjä</li>
            <li>vastaanottaa tarjouksia rahoittajilta</li>
            <li>seurata hakemustensa käsittelyä</li>
          </ul>
          <p className="mt-4 font-medium">
            Kantama ei ole pankki eikä rahoituslaitos, vaan toimii hakemusten ja tiedonvälityksen alustana.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">2. Käyttäjätili</h2>
          <p>
            Palvelun käyttö edellyttää käyttäjätilin luomista ja sähköpostin vahvistamista.
            Käyttäjä vastaa antamiensa tietojen oikeellisuudesta.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">3. Hakemukset ja tarjoukset</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Hakemuksen lähettäminen ei sido Kantamaia tai rahoittajaa tarjouksen tekemiseen.</li>
            <li>Kaikki tarjoukset ovat rahoittajien antamia ja voivat sisältää ehtoja.</li>
            <li>Lopullinen sopimus syntyy vasta, kun asiakas ja rahoittaja ovat sen hyväksyneet.</li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">4. Vastuunrajoitus</h2>
          <p>Kantama ei vastaa:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>rahoittajien tekemistä päätöksistä</li>
            <li>tarjousten sisällöstä</li>
            <li>sopimusten toteutumisesta rahoittajan ja asiakkaan välillä</li>
          </ul>
          <p className="mt-4 font-medium">Palvelu tarjotaan "sellaisena kuin se on".</p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">5. Palvelun käyttö</h2>
          <p>
            Käyttäjä sitoutuu käyttämään palvelua lain ja hyvän tavan mukaisesti.
            Palvelua ei saa käyttää väärinkäytöksiin, harhaanjohtaviin hakemuksiin tai 
            lainvastaisiin tarkoituksiin.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">6. Immateriaalioikeudet</h2>
          <p>
            Kaikki Kantama-palveluun liittyvät oikeudet (ohjelmisto, ulkoasu, sisältö) kuuluvat 
            Kantamaille tai sen lisenssinantajille.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">7. Muutokset ja palvelun päättäminen</h2>
          <p>
            Kantama voi muuttaa palvelua tai käyttöehtoja.
            Kantamaillä on oikeus keskeyttää tai lopettaa palvelu perustellusta syystä.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">8. Sovellettava laki</h2>
          <p>
            Näihin käyttöehtoihin sovelletaan Suomen lakia. 
            Mahdolliset erimielisyydet käsitellään Suomessa.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-bold text-midnight-900 mt-8 mb-4">9. Yhteystiedot</h2>
          <p>
            Kysymykset käyttöehdoista:<br />
            📧 <a href="mailto:myynti@Kantama.fi" className="text-Kantama-600 hover:text-Kantama-700">myynti@Kantama.fi</a>
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



