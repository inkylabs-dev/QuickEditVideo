/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
		'./src/**/*.{js,jsx,ts,tsx,md,mdx}',
		'./pages/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./styles/**/*.css'
	],
	theme: {
    	extend: {
    		maxWidth: {
    			'8xl': '96rem',
    			'9xl': '112rem'
    		},
    		typography: {
    			DEFAULT: {
    				css: {
    					'--tw-prose-body': '#374151',
    					'--tw-prose-headings': '#111827',
    					'--tw-prose-links': '#0d9488',
    					'--tw-prose-links-hover': '#0f766e',
    					'--tw-prose-bold': '#111827',
    					'--tw-prose-counters': '#0d9488',
    					'--tw-prose-bullets': '#0d9488',
    					'--tw-prose-hr': '#e5e7eb',
    					'--tw-prose-quotes': '#374151',
    					'--tw-prose-quote-borders': '#0d9488',
    					'--tw-prose-captions': '#6b7280',
    					'--tw-prose-code': '#111827',
    					'--tw-prose-pre-code': '#e5e7eb',
    					'--tw-prose-pre-bg': '#1f2937',
    					'--tw-prose-th-borders': '#d1d5db',
    					'--tw-prose-td-borders': '#e5e7eb'
    				}
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
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
    			}
    		}
    	}
    },
	plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
}
