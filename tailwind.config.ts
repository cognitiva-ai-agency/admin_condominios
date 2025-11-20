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
  			xs: '475px',
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1536px'
  		},
  		spacing: {
  			'safe-bottom': 'env(safe-area-inset-bottom)',
  			'safe-top': 'env(safe-area-inset-top)',
  			'section-gap': '2rem',
  			'card-gap': '1rem',
  			'element-gap': '0.5rem',
  			'touch-target': '2.75rem',
  			'touch-target-lg': '3rem'
  		},
  		fontSize: {
  			hero: [
  				'2rem',
  				{
  					lineHeight: '2.5rem',
  					fontWeight: '700'
  				}
  			],
  			section: [
  				'1.5rem',
  				{
  					lineHeight: '2rem',
  					fontWeight: '600'
  				}
  			],
  			'card-title': [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem',
  					fontWeight: '600'
  				}
  			],
  			'body-lg': [
  				'1rem',
  				{
  					lineHeight: '1.5rem',
  					fontWeight: '400'
  				}
  			],
  			body: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem',
  					fontWeight: '400'
  				}
  			],
  			caption: [
  				'0.75rem',
  				{
  					lineHeight: '1rem',
  					fontWeight: '400'
  				}
  			]
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
  			status: {
  				pending: {
  					DEFAULT: '#fbbf24',
  					bg: '#fef3c7',
  					border: '#fde68a',
  					text: '#92400e'
  				},
  				progress: {
  					DEFAULT: '#3b82f6',
  					bg: '#dbeafe',
  					border: '#bfdbfe',
  					text: '#1e3a8a'
  				},
  				completed: {
  					DEFAULT: '#10b981',
  					bg: '#d1fae5',
  					border: '#a7f3d0',
  					text: '#065f46'
  				},
  				urgent: {
  					DEFAULT: '#ef4444',
  					bg: '#fee2e2',
  					border: '#fecaca',
  					text: '#991b1b'
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
  			'9xl': '96rem'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
