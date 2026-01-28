import { colorsTuple, type DefaultMantineColor, type MantineColorsTuple } from '@mantine/core'

// Color palette based on HappyCo design system
const colorPalette = {
  blue: ['#e7fdff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#114b5e'],
  purple: ['#efefff', '#e0deff', '#d0ceff', '#b1adff', '#928cff', '#827cff', '#635bff', '#5952e6', '#4f49cc', '#3b3799'],
  cyan: ['#ebffff', '#d7fdfd', '#aafcfd', '#7dfcfc', '#62fbfc', '#56fbfc', '#4efbfc', '#41dfe1', '#30c7c8', '#00acad'],
  dark: ['#c9c9c9', '#b8b8b8', '#828282', '#696969', '#424242', '#3b3b3b', '#2e2e2e', '#242424', '#1f1f1f', '#141414'],
  grape: ['#f5eeff', '#e5daf8', '#c6b4e9', '#a68bda', '#8b67cd', '#7a51c6', '#7246c3', '#6038ad', '#55319b', '#49288a'],
  gray: ['#f3f5f7', '#e7e7e7', '#caced0', '#abb3b9', '#909ca5', '#7f8e99', '#758795', '#637481', '#566774', '#455968'],
  green: ['#e6f9f3', '#ccf3e7', '#b3eddc', '#80e1c4', '#4dd5ac', '#00c389', '#01af7b', '#019c6e', '#017552', '#004e37'],
  indigo: ['#e3fafc', '#ccedf8', '#b3e4f5', '#80d1ee', '#4dbfe7', '#33b6e4', '#21a3dc', '#0094c7', '#0083b1', '#006285'],
  navy: ['#e8eaf3', '#c6c9e2', '#a1a7ce', '#7e84ba', '#636aac', '#4b509e', '#444895', '#3c3e89', '#35357c', '#28245a'],
  orange: ['#ffeee2', '#ffdccb', '#ffb99a', '#ff9263', '#ff7236', '#ff5d18', '#ff5207', '#e44200', '#cc3900', '#b22d00'],
  red: ['#ffe9e9', '#ffd2d2', '#f8a4a4', '#f27272', '#ec4848', '#e92e2e', '#e10001', '#cf0f13', '#b9060f', '#a3000a'],
  teal: ['#ebfeff', '#d7fcfd', '#aaf9fc', '#7df7fc', '#62f5fb', '#56f4fb', '#4ef4fb', '#41d9e0', '#30c1c8', '#00a7ad'],
  violet: ['#efefff', '#e0deff', '#d0ceff', '#b1adff', '#928cff', '#827cff', '#635bff', '#5952e6', '#4f49cc', '#3b3799'],
  yellow: ['#fff9e3', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
}

export const MANTINE_COLORS: Record<DefaultMantineColor | 'purple' | 'navy', MantineColorsTuple> = {
  blue: colorsTuple(colorPalette.blue),
  purple: colorsTuple(colorPalette.purple),
  cyan: colorsTuple(colorPalette.cyan),
  dark: colorsTuple(colorPalette.dark),
  grape: colorsTuple(colorPalette.grape),
  gray: colorsTuple(colorPalette.gray),
  green: colorsTuple(colorPalette.green),
  indigo: colorsTuple(colorPalette.indigo),
  navy: colorsTuple(colorPalette.navy),
  orange: colorsTuple(colorPalette.orange),
  red: colorsTuple(colorPalette.red),
  teal: colorsTuple(colorPalette.teal),
  violet: colorsTuple(colorPalette.violet),
  yellow: colorsTuple(colorPalette.yellow),
  // Aliases
  success: colorsTuple(colorPalette.green),
  danger: colorsTuple(colorPalette.red),
  warning: colorsTuple(colorPalette.yellow),
}



