import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		screens: {
  			'xs': '475px',
  			'sm': '640px',
  			'md': '768px',
  			'lg': '1024px',
  			'xl': '1280px',
  			'2xl': '1536px',
  		},
  		spacing: {
  			'safe-bottom': 'env(safe-area-inset-bottom)',
  			'safe-top': 'env(safe-area-inset-top)',
  			// Sistema de spacing consistente
  			'section-gap': '2rem',      // 32px - Entre secciones principales
  			'card-gap': '1rem',          // 16px - Entre cards
  			'element-gap': '0.5rem',     // 8px - Entre elementos pequeños
  			'touch-target': '2.75rem',   // 44px - Mínimo para touch
  			'touch-target-lg': '3rem',   // 48px - Touch target grande
  		},
  		fontSize: {
  			// Jerarquía tipográfica clara
  			'hero': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],        // 32px
  			'section': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],      // 24px
  			'card-title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 18px
  			'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],      // 16px
  			'body': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],    // 14px
  			'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],     // 12px
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Sistema de colores semántico para estados de tareas
  			status: {
  				pending: {
  					DEFAULT: '#fbbf24',  // yellow-400
  					bg: '#fef3c7',       // yellow-100
  					border: '#fde68a',   // yellow-200
  					text: '#92400e'      // yellow-900
  				},
  				progress: {
  					DEFAULT: '#3b82f6',  // blue-500
  					bg: '#dbeafe',       // blue-100
  					border: '#bfdbfe',   // blue-200
  					text: '#1e3a8a'      // blue-900
  				},
  				completed: {
  					DEFAULT: '#10b981',  // green-500
  					bg: '#d1fae5',       // green-100
  					border: '#a7f3d0',   // green-200
  					text: '#065f46'      // green-900
  				},
  				urgent: {
  					DEFAULT: '#ef4444',  // red-500
  					bg: '#fee2e2',       // red-100
  					border: '#fecaca',   // red-200
  					text: '#991b1b'      // red-900
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
