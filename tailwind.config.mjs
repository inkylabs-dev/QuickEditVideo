/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			maxWidth: {
				'8xl': '96rem', // 1536px - wider than default 7xl (80rem/1280px)
				'9xl': '112rem', // 1792px - for ultra-wide screens
			},
		},
	},
	plugins: [],
}