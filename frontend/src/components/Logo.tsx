import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtext?: boolean;
}

export default function Logo({ 
  to = '/', 
  size = 'md', 
  variant = 'light',
  showSubtext = true 
}: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', gap: 'gap-2' },
    md: { icon: 'w-9 h-9', text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', gap: 'gap-3' },
  };

  const colors = {
    light: { 
      text: 'text-white', 
      subtext: 'text-blue-300',
      iconBg: 'from-blue-500 to-blue-700'
    },
    dark: { 
      text: 'text-slate-900', 
      subtext: 'text-blue-600',
      iconBg: 'from-blue-500 to-blue-700'
    },
  };

  const content = (
    <div className={`flex items-center ${sizes[size].gap}`}>
      {/* Logo Icon - Clean bold K */}
      <div className={`${sizes[size].icon} relative flex-shrink-0`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[variant].iconBg} rounded-xl shadow-lg`}>
          <svg 
            viewBox="0 0 40 40" 
            fill="none" 
            className="w-full h-full"
          >
            {/* Clean, bold K letter */}
            <path 
              d="M13 8V32" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
            <path 
              d="M13 20L26 8" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path 
              d="M13 20L26 32" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Subtle glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[variant].iconBg} rounded-xl blur-md opacity-30 -z-10`} />
      </div>

      {/* Text - Kantama Rahoitus on same line */}
      <div className="flex items-baseline gap-1.5">
        <span className={`${colors[variant].text} font-display font-bold ${sizes[size].text} tracking-tight`}>
          Kantama
        </span>
        {showSubtext && (
          <span className={`${colors[variant].subtext} font-display font-semibold ${sizes[size].text} tracking-tight`}>
            Rahoitus
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
