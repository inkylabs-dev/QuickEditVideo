/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{js,jsx,ts,tsx,md,mdx}',
		'./pages/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./styles/**/*.css'
	],
	theme: {
		extend: {
			maxWidth: {
				'8xl': '96rem', // 1536px - wider than default 7xl (80rem/1280px)
				'9xl': '112rem', // 1792px - for ultra-wide screens
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
						'--tw-prose-td-borders': '#e5e7eb',
					},
				},
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
}
