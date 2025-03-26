export type CountryCode =
  | 'AT' | 'BE' | 'BG' | 'CY' | 'CZ' | 'DE' | 'DK' | 'EE' | 'EL' | 'ES'
  | 'FI' | 'FR' | 'GR' | 'HR' | 'HU' | 'IE' | 'IT' | 'LT' | 'LU' | 'LV'
  | 'MT' | 'NL' | 'PL' | 'PT' | 'RO' | 'SE' | 'SI' | 'SK' | 'GB'

export type VatRateType = 'high' | 'low' | 'low1' | 'super-reduced' | 'parking'

export interface VatRates {
  'high': number
  'low'?: number
  'low1'?: number
  'super-reduced'?: number
  'parking'?: number
}

export interface CountryVatRule {
  rate: number
  rates?: VatRates
  exceptions?: Record<string, number>
  postalCodeRules?: Array<{
    pattern: RegExp | string
    rate: number
  }>
  specialRules?: {
    isCompanyRequired?: boolean
    reverseCharge?: boolean
    vatNumberRequired?: boolean
  }
}

export type VatRules = Record<CountryCode, CountryVatRule>

export interface VatCalculatorConfig {
  rules?: VatRules
  businessCountryCode?: CountryCode
  forwardSoapFaults?: boolean
  soapTimeout?: number
  validateVatNumbers?: boolean
  validatePostalCodes?: boolean
  validateCountryCodes?: boolean
}

export interface VatNumberFormat {
  pattern: RegExp
  name: string
  example: string
}

export interface VatNumberValidationResult {
  isValid: boolean
  name?: string
  address?: string
  countryCode?: CountryCode
  vatNumber?: string
  requestDate?: Date
  consultationNumber?: string
  isCompany?: boolean
}

export interface VatCalculationResult {
  netPrice: number
  grossPrice: number
  vatAmount: number
  vatRate: number
  countryCode: CountryCode
  isCompany: boolean
  details?: {
    ruleApplied?: string
    reverseCharge?: boolean
    vatNumberUsed?: string
    postalCodeUsed?: string
  }
}
