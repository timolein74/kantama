import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'FINANCIER': return '/financier';
      default: return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-midnight-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-Kantama-500 to-Kantama-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">e</span>
              </div>
              <span className="text-white font-display font-bold text-xl">Kantama</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#leasing" className="text-slate-300 hover:text-white transition-colors">
                Leasing
              </a>
              <a href="#sale-leaseback" className="text-slate-300 hover:text-white transition-colors">
                Sale-Leaseback
              </a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
                Näin se toimii
              </a>
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(getDashboardLink())}
                  className="btn-primary"
                >
                  Oma portaali
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Kirjaudu</span>
                  </Link>
                  <Link to="/register" className="btn-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Rekisteröidy
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-midnight-950 border-t border-white/10">
            <div className="px-4 py-4 space-y-4">
              <a href="#leasing" className="block text-slate-300 hover:text-white">
                Leasing
              </a>
              <a href="#sale-leaseback" className="block text-slate-300 hover:text-white">
                Sale-Leaseback
              </a>
              <a href="#how-it-works" className="block text-slate-300 hover:text-white">
                Näin se toimii
              </a>
              <div className="pt-4 border-t border-white/10 space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate(getDashboardLink())}
                    className="btn-primary w-full"
                  >
                    Oma portaali
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary w-full">
                      Kirjaudu
                    </Link>
                    <Link to="/register" className="btn-primary w-full">
                      Rekisteröidy
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-midnight-950 text-slate-400 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-Kantama-500 to-Kantama-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">e</span>
                </div>
                <span className="text-white font-display font-bold text-lg">Kantama</span>
              </div>
              <p className="text-sm">
                Yritysrahoitusta helposti ja nopeasti. Leasing ja takaisinvuokraus yrityksille.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Palvelut</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#leasing" className="hover:text-white transition-colors">Leasing</a></li>
                <li><a href="#sale-leaseback" className="hover:text-white transition-colors">Sale-Leaseback</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Yhteystiedot</h4>
              <ul className="space-y-2 text-sm">
                <li>myynti@Kantama.fi</li>
                <li>+358 9 123 4567</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tietoa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Tietosuoja</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Käyttöehdot</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm">
            <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

