/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './node_modules/@tremor/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    DEFAULT: '#8BC34A',
                    50: '#F1F8E9',
                    100: '#DCEDC8',
                    200: '#C5E1A5',
                    300: '#AED581',
                    400: '#9CCC65',
                    500: '#8BC34A',
                    600: '#7CB342',
                    700: '#689F38',
                    800: '#558B2F',
                    900: '#33691E',
                    950: '#2E7D32', 
                  },
                  neutral: {
                    50: '#FAFAF9',
                    100: '#F5F5F4',
                    200: '#E7E5E4',
                    300: '#D7D3D0',
                    400: '#A8A29E',
                    500: '#78716C',
                    600: '#57534E',
                    700: '#44403C',
                    800: '#292524',
                    900: '#1C1917',
                    950: '#0C0A09',
                  },
                  electric: {
  DEFAULT: '#00BFFF',
  50: '#B8EDFF',
  100: '#A3E8FF',
  200: '#7ADEFF',
  300: '#52D3FF',
  400: '#29C9FF',
  500: '#00BFFF',
  600: '#0095C7',
  700: '#006B8F',
  800: '#004157',
  900: '#00171F',
  950: '#000203'
},
            },
            transitionProperty: {
                width: 'width',
                height: 'height',
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('tailwindcss-animated'), require('@tailwindcss/aspect-ratio')],
    safelist: [
        {
            pattern: /(bg|text|border|ring|shadow)-(brand)-(50|100|200|300|400|500|600|700|800|900|950)?/,
            variant: ['hover', 'focus', 'sm', 'md', 'lg', 'xl', '2xl'],
        },
    ],
}

