import type { VatCalculatorConfig, VatRules } from './types'

export const defaultVatRules: VatRules = {
  AT: {
    rate: 0.20,
    exceptions: {
      Jungholz: 0.19,
      Mittelberg: 0.19,
    },
    rates: {
      high: 0.20,
      low: 0.10,
      low1: 0.13,
      parking: 0.13,
    },
  },
  BE: {
    rate: 0.21,
    rates: {
      high: 0.21,
      low: 0.06,
      low1: 0.12,
      parking: 0.12,
    },
  },
  BG: {
    rate: 0.20,
    rates: {
      high: 0.20,
      low: 0.09,
    },
  },
  CY: {
    rate: 0.19,
    rates: {
      high: 0.19,
      low: 0.05,
      low1: 0.09,
    },
  },
  CZ: {
    rate: 0.21,
    rates: {
      high: 0.21,
      low: 0.12,
    },
  },
  DE: {
    rate: 0.19,
    exceptions: {
      'Heligoland': 0,
      'Büsingen am Hochrhein': 0,
    },
    rates: {
      high: 0.19,
      low: 0.07,
    },
  },
  DK: {
    rate: 0.25,
    rates: {
      high: 0.25,
    },
  },
  EE: {
    rate: 0.22,
    rates: {
      high: 0.22,
      low: 0.09,
    },
  },
  EL: {
    rate: 0.24,
    exceptions: {
      'Mount Athos': 0,
    },
    rates: {
      high: 0.24,
      low: 0.06,
      low1: 0.13,
    },
  },
  ES: {
    rate: 0.21,
    exceptions: {
      'Canary Islands': 0,
      'Ceuta': 0,
      'Melilla': 0,
    },
    rates: {
      'high': 0.21,
      'low': 0.10,
      'super-reduced': 0.04,
    },
  },
  FI: {
    rate: 0.24,
    rates: {
      high: 0.24,
      low: 0.10,
      low1: 0.14,
    },
  },
  FR: {
    rate: 0.20,
    exceptions: {
      Corsica: 0.20,
      Guadeloupe: 0.085,
      Martinique: 0.085,
      Réunion: 0.085,
    },
    rates: {
      'high': 0.20,
      'low': 0.055,
      'low1': 0.10,
      'super-reduced': 0.021,
    },
  },
  GR: {
    rate: 0.24,
    exceptions: {
      'Mount Athos': 0,
    },
    rates: {
      high: 0.24,
      low: 0.06,
      low1: 0.13,
    },
  },
  HR: {
    rate: 0.25,
    rates: {
      high: 0.25,
      low: 0.05,
      low1: 0.13,
    },
  },
  HU: {
    rate: 0.27,
    rates: {
      high: 0.27,
      low: 0.05,
      low1: 0.18,
    },
  },
  IE: {
    rate: 0.23,
    rates: {
      'high': 0.23,
      'low': 0.09,
      'low1': 0.135,
      'super-reduced': 0.048,
      'parking': 0.135,
    },
  },
  IT: {
    rate: 0.22,
    rates: {
      'high': 0.22,
      'low': 0.05,
      'low1': 0.10,
      'super-reduced': 0.04,
    },
  },
  LT: {
    rate: 0.21,
    rates: {
      high: 0.21,
      low: 0.05,
      low1: 0.09,
    },
  },
  LU: {
    rate: 0.17,
    rates: {
      'high': 0.17,
      'low': 0.08,
      'super-reduced': 0.03,
      'parking': 0.14,
    },
  },
  LV: {
    rate: 0.21,
    rates: {
      'high': 0.21,
      'low': 0.12,
      'super-reduced': 0.05,
    },
  },
  MT: {
    rate: 0.18,
    rates: {
      high: 0.18,
      low: 0.05,
      low1: 0.07,
    },
  },
  NL: {
    rate: 0.21,
    rates: {
      high: 0.21,
      low: 0.09,
    },
  },
  PL: {
    rate: 0.23,
    rates: {
      high: 0.23,
      low: 0.05,
      low1: 0.08,
    },
  },
  PT: {
    rate: 0.23,
    exceptions: {
      Azores: 0.18,
      Madeira: 0.22,
    },
    rates: {
      high: 0.23,
      low: 0.06,
      low1: 0.13,
    },
  },
  RO: {
    rate: 0.19,
    rates: {
      high: 0.19,
      low: 0.05,
      low1: 0.09,
    },
  },
  SE: {
    rate: 0.25,
    rates: {
      high: 0.25,
      low: 0.06,
      low1: 0.12,
    },
  },
  SI: {
    rate: 0.22,
    rates: {
      high: 0.22,
      low: 0.095,
    },
  },
  SK: {
    rate: 0.20,
    rates: {
      high: 0.20,
      low: 0.10,
    },
  },
  GB: {
    rate: 0.20,
    rates: {
      'high': 0.20,
      'low': 0.05,
      'super-reduced': 0,
    },
    exceptions: {
      'Isle of Man': 0.20,
      'Channel Islands': 0,
    },
    specialRules: {
      vatNumberRequired: true,
      reverseCharge: true,
    },
  },
} as const

export const defaultConfig: VatCalculatorConfig = {
  rules: defaultVatRules,
  businessCountryCode: undefined,
  forwardSoapFaults: false,
  soapTimeout: 30000, // in milliseconds
  validateVatNumbers: true,
  validateCountryCodes: true,
  validatePostalCodes: false,
} as const
