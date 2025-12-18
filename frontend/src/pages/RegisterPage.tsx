import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  email: z.string().email('Virheellinen sähköposti'),
  password: z.string().min(6, 'Salasanan tulee olla vähintään 6 merkkiä'),
  password_confirm: z.string(),
  first_name: z.string().min(2, 'Etunimi vaaditaan'),
  last_name: z.string().min(2, 'Sukunimi vaaditaan'),
  company_name: z.string().optional(),
  business_id: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Salasanat eivät täsmää',
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { password_confirm, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Rekisteröityminen onnistui! Tarkista sähköpostisi.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Rekisteröityminen epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center px-4 py-20 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-Kantama-500 to-Kantama-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">e</span>
              </div>
            </Link>
            <h1 className="text-2xl font-display font-bold text-midnight-900 mb-2">
              Luo tili
            </h1>
            <p className="text-slate-600">
              Aloita yritysrahoituksen hakeminen
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Etunimi *</label>
                <input
                  {...register('first_name')}
                  className={`input ${errors.first_name ? 'input-error' : ''}`}
                  placeholder="Matti"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="label">Sukunimi *</label>
                <input
                  {...register('last_name')}
                  className={`input ${errors.last_name ? 'input-error' : ''}`}
                  placeholder="Meikäläinen"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Sähköposti *</label>
              <input
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="email@yritys.fi"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Yrityksen nimi</label>
                <input
                  {...register('company_name')}
                  className="input"
                  placeholder="Oy Yritys Ab"
                />
              </div>
              <div>
                <label className="label">Y-tunnus</label>
                <input
                  {...register('business_id')}
                  className="input"
                  placeholder="1234567-8"
                />
              </div>
            </div>

            <div>
              <label className="label">Puhelin</label>
              <input
                {...register('phone')}
                className="input"
                placeholder="+358 40 123 4567"
              />
            </div>

            <div>
              <label className="label">Salasana *</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Vähintään 6 merkkiä"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Vahvista salasana *</label>
              <input
                {...register('password_confirm')}
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.password_confirm ? 'input-error' : ''}`}
                placeholder="Sama salasana uudelleen"
              />
              {errors.password_confirm && (
                <p className="text-red-500 text-sm mt-1">{errors.password_confirm.message}</p>
              )}
            </div>

            <label className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded border-slate-300 text-Kantama-600 focus:ring-Kantama-500"
              />
              <span className="ml-2 text-sm text-slate-600">
                Hyväksyn{' '}
                <a href="#" className="text-Kantama-600 hover:underline">käyttöehdot</a>
                {' '}ja{' '}
                <a href="#" className="text-Kantama-600 hover:underline">tietosuojakäytännön</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4"
            >
              {isLoading ? 'Luodaan tiliä...' : 'Luo tili'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Onko sinulla jo tili?{' '}
              <Link to="/login" className="text-Kantama-600 font-medium hover:text-Kantama-700">
                Kirjaudu sisään
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

