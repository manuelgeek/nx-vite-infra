/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
import defaultTheme from 'tailwindcss/defaultTheme'

export const tailwindTheme = {
  fontFamily: {
    sans: ['Inter var', ...defaultTheme.fontFamily.sans],
  },
  colors: {
    primary: '#1A56DB',
    'primary-50': '#EBF5FF',
    'primary-100': '#bbdefb',
    'primary-200': '#A4CAFE',
    'primary-500': '#3F83F8',
    'primary-600': '#1C64F2',
    'primary-700': '#1A56DB',
    'primary-800': '#1E429F',
  },
}
