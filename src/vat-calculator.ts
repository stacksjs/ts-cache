import type { CountryCode, VatCalculationResult, VatCalculatorConfig, VatNumberValidationResult, VatRateType } from './types'
import { DOMParser } from '@xmldom/xmldom'
import { defaultConfig } from './config'
import { InvalidCountryCodeException, InvalidPostalCodeException, InvalidVatNumberException, VatCheckUnavailableException } from './exceptions'

export class VatCalculator {
  private static readonly VAT_SERVICE_URL = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService'
  private static readonly VAT_NUMBER_PATTERNS: Record<CountryCode, RegExp> = {
    AT: /^ATU\d{8}$/,
    BE: /^BE[01]\d{9}$/,
    BG: /^BG\d{9,10}$/,
    CY: /^CY\d{8}[A-Z]$/,
    CZ: /^CZ\d{8,10}$/,
    DE: /^DE\d{9}$/,
    DK: /^DK\d{8}$/,
    EE: /^EE\d{9}$/,
    EL: /^EL\d{9}$/,
    ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    FI: /^FI\d{8}$/,
    FR: /^FR[A-HJ-NP-Z0-9][A-HJ-NP-Z0-9]\d{9}$/,
    GB: /^GB(\d{9}|\d{12}|(HA|GD)\d{3})$/,
    GR: /^GR\d{9}$/,
    HR: /^HR\d{11}$/,
    HU: /^HU\d{8}$/,
    IE: /^IE\d{7}[A-Z]{1,2}$/,
    IT: /^IT\d{11}$/,
    LT: /^LT(\d{9}|\d{12})$/,
    LU: /^LU\d{8}$/,
    LV: /^LV\d{11}$/,
    MT: /^MT\d{8}$/,
    NL: /^NL\d{9}B\d{2}$/,
    PL: /^PL\d{10}$/,
    PT: /^PT\d{9}$/,
    RO: /^RO\d{2,10}$/,
    SE: /^SE\d{12}$/,
    SI: /^SI\d{8}$/,
    SK: /^SK\d{10}$/,
  }

  private static readonly POSTAL_CODE_PATTERNS: Record<CountryCode, RegExp> = {
    AT: /^\d{4}$/,
    BE: /^\d{4}$/,
    BG: /^\d{4}$/,
    CY: /^\d{4}$/,
    CZ: /^\d{3}\s?\d{2}$/,
    DE: /^\d{5}$/,
    DK: /^\d{4}$/,
    EE: /^\d{5}$/,
    EL: /^\d{3}\s?\d{2}$/,
    ES: /^\d{5}$/,
    FI: /^\d{5}$/,
    FR: /^\d{2}\s?\d{3}$/,
    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/,
    GR: /^\d{3}\s?\d{2}$/,
    HR: /^\d{5}$/,
    HU: /^\d{4}$/,
    IE: /^[A-Z]\d{2}\s?[A-Z\d]{4}$/,
    IT: /^\d{5}$/,
    LT: /^LT-\d{5}$/,
    LU: /^L-\d{4}$/,
    LV: /^LV-\d{4}$/,
    MT: /^[A-Z]{3}\s?\d{4}$/,
    NL: /^\d{4}\s?[A-Z]{2}$/,
    PL: /^\d{2}-\d{3}$/,
    PT: /^\d{4}-\d{3}$/,
    RO: /^\d{6}$/,
    SE: /^\d{3}\s?\d{2}$/,
    SI: /^\d{4}$/,
    SK: /^\d{3}\s?\d{2}$/,
  }

  private config: VatCalculatorConfig
  private netPrice: number = 0
  private countryCode?: CountryCode
  private postalCode?: string
  private company: boolean = false
  private businessCountryCode?: CountryCode
  private vatNumber?: string

  constructor(config: Partial<VatCalculatorConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.businessCountryCode = config.businessCountryCode
  }

  public shouldCollectVat(countryCode: CountryCode): boolean {
    if (!this.isValidCountryCode(countryCode)) {
      return false
    }

    if (this.company && this.businessCountryCode === countryCode) {
      return false
    }

    const countryRules = this.config.rules?.[countryCode]
    if (!countryRules) {
      return false
    }

    if (countryRules.specialRules?.vatNumberRequired && !this.vatNumber) {
      return true
    }

    return true
  }

  public calculate(
    netPrice: number,
    countryCode?: CountryCode,
    postalCode?: string,
    company: boolean = false,
    type?: VatRateType,
  ): VatCalculationResult {
    this.netPrice = netPrice

    if (countryCode) {
      this.setCountryCode(countryCode)
    }

    if (postalCode) {
      this.setPostalCode(postalCode)
    }

    if (company) {
      this.setCompany(company)
    }

    const vatRate = this.getTaxRateForLocation(
      this.countryCode!,
      this.postalCode,
      this.company,
      type,
    )

    const vatAmount = this.netPrice * vatRate
    const grossPrice = this.netPrice + vatAmount

    const result: VatCalculationResult = {
      netPrice: this.netPrice,
      grossPrice,
      vatAmount,
      vatRate,
      countryCode: this.countryCode!,
      isCompany: this.company,
      details: {
        ruleApplied: type || 'standard',
        reverseCharge: this.company && this.businessCountryCode === this.countryCode,
        vatNumberUsed: this.vatNumber,
        postalCodeUsed: this.postalCode,
      },
    }

    return result
  }

  public calculateNet(
    grossPrice: number,
    countryCode?: CountryCode,
    postalCode?: string,
    company: boolean = false,
    type?: VatRateType,
  ): VatCalculationResult {
    if (countryCode) {
      this.setCountryCode(countryCode)
    }

    if (postalCode) {
      this.setPostalCode(postalCode)
    }

    this.setCompany(company)

    const vatRate = this.getTaxRateForLocation(
      this.countryCode!,
      this.postalCode,
      this.company,
      type,
    )

    this.netPrice = grossPrice / (1 + vatRate)
    const vatAmount = grossPrice - this.netPrice

    return {
      netPrice: this.netPrice,
      grossPrice,
      vatAmount,
      vatRate,
      countryCode: this.countryCode!,
      isCompany: this.company,
      details: {
        ruleApplied: type || 'standard',
        reverseCharge: this.company && this.businessCountryCode === this.countryCode,
        vatNumberUsed: this.vatNumber,
        postalCodeUsed: this.postalCode,
      },
    }
  }

  public getNetPrice(): number {
    return this.netPrice
  }

  public getCountryCode(): CountryCode | undefined {
    return this.countryCode
  }

  public setCountryCode(countryCode: CountryCode): this {
    if (this.config.validateCountryCodes && !this.isValidCountryCode(countryCode)) {
      throw new InvalidCountryCodeException()
    }
    this.countryCode = countryCode
    return this
  }

  public getPostalCode(): string | undefined {
    return this.postalCode
  }

  public setPostalCode(postalCode: string): this {
    if (this.config.validatePostalCodes && this.countryCode) {
      const pattern = VatCalculator.POSTAL_CODE_PATTERNS[this.countryCode]
      if (pattern && !pattern.test(postalCode)) {
        throw new InvalidPostalCodeException(`Invalid postal code format for country ${this.countryCode}`)
      }
    }
    this.postalCode = postalCode
    return this
  }

  public isCompany(): boolean {
    return this.company
  }

  public setCompany(company: boolean): this {
    this.company = company
    return this
  }

  public setVatNumber(vatNumber: string): this {
    if (this.config.validateVatNumbers && !this.isValidVatNumberFormat(vatNumber)) {
      throw new InvalidVatNumberException()
    }
    this.vatNumber = vatNumber
    return this
  }

  public getVatNumber(): string | undefined {
    return this.vatNumber
  }

  public setBusinessCountryCode(businessCountryCode: CountryCode): this {
    if (this.config.validateCountryCodes && !this.isValidCountryCode(businessCountryCode)) {
      throw new InvalidCountryCodeException()
    }
    this.businessCountryCode = businessCountryCode
    return this
  }

  public getTaxRateForCountry(
    countryCode: CountryCode,
    company: boolean = false,
    type?: VatRateType,
  ): number {
    const countryRules = this.config.rules?.[countryCode]
    if (!countryRules) {
      return 0
    }

    if (company && this.businessCountryCode !== countryCode) {
      return 0
    }

    if (type && countryRules.rates?.[type]) {
      return countryRules.rates[type]
    }

    return countryRules.rate
  }

  public getTaxRateForLocation(
    countryCode: CountryCode,
    postalCode?: string,
    company: boolean = false,
    type?: VatRateType,
  ): number {
    if (!postalCode) {
      return this.getTaxRateForCountry(countryCode, company, type)
    }

    // Special territory checks
    switch (countryCode) {
      case 'DE':
        // Heligoland and Büsingen
        if (['27498', '78266'].includes(postalCode)) {
          return 0
        }
        break
      case 'ES':
        // Canary Islands
        if (postalCode.startsWith('35') || postalCode.startsWith('38')) {
          return 0
        }
        break
      case 'EL':
        // Mount Athos
        if (postalCode.startsWith('63086')) {
          return 0
        }
        break
      case 'PT':
        // Azores
        if (postalCode.startsWith('95')) {
          return 0.16
        }
        // Madeira
        if (postalCode.startsWith('90')) {
          return 0.22
        }
        break
      case 'AT':
        // Jungholz and Mittelberg
        if (['6691', '6991', '6992', '6993'].includes(postalCode)) {
          return this.config.rules?.DE?.rate || 0.19
        }
        break
    }

    return this.getTaxRateForCountry(countryCode, company, type)
  }

  public async isValidVatNumber(vatNumber: string): Promise<boolean> {
    if (!this.isValidVatNumberFormat(vatNumber)) {
      if (this.config.forwardSoapFaults) {
        throw new InvalidVatNumberException()
      }
      return false
    }

    try {
      const details = await this.getVatDetails(vatNumber)
      return details.isValid
    }
    catch {
      if (this.config.forwardSoapFaults) {
        throw new VatCheckUnavailableException()
      }
      return false
    }
  }

  public async getVatDetails(vatNumber: string): Promise<VatNumberValidationResult> {
    if (!this.isValidVatNumberFormat(vatNumber)) {
      throw new InvalidVatNumberException()
    }

    try {
      const response = await fetch(VatCalculator.VAT_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': '',
        },
        body: this.createVatCheckSoapEnvelope(vatNumber),
      })

      if (!response.ok) {
        throw new VatCheckUnavailableException()
      }

      const responseText = await response.text()
      const result = this.parseVatResponse(responseText)
      return result
    }
    catch {
      throw new VatCheckUnavailableException()
    }
  }

  private isValidCountryCode(countryCode: string): countryCode is CountryCode {
    return Object.keys(this.config.rules || {}).includes(countryCode)
  }

  private isValidVatNumberFormat(vatNumber: string): boolean {
    const countryCode = vatNumber.substring(0, 2) as CountryCode
    const pattern = VatCalculator.VAT_NUMBER_PATTERNS[countryCode]
    return pattern ? pattern.test(vatNumber) : false
  }

  private createVatCheckSoapEnvelope(vatNumber: string): string {
    const countryCode = vatNumber.substring(0, 2)
    const number = vatNumber.substring(2)

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns1:checkVat>
      <tns1:countryCode>${countryCode}</tns1:countryCode>
      <tns1:vatNumber>${number}</tns1:vatNumber>
    </tns1:checkVat>
  </soap:Body>
</soap:Envelope>`
  }

  private parseVatResponse(response: string): VatNumberValidationResult {
    const parser = new DOMParser()
    const doc = parser.parseFromString(response, 'text/xml')
    const getNodeValue = (tagName: string): string | undefined => {
      const nodes = doc.getElementsByTagNameNS('urn:ec.europa.eu:taxud:vies:services:checkVat:types', tagName)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node?.textContent) {
          return node.textContent.trim()
        }
      }
      return undefined
    }

    const isValid = getNodeValue('valid') === 'true'
    const name = getNodeValue('name')
    const address = getNodeValue('address')
    const countryCode = getNodeValue('countryCode') as CountryCode | undefined
    const vatNumber = getNodeValue('vatNumber')

    return {
      isValid,
      name,
      address,
      countryCode,
      vatNumber,
      isCompany: isValid,
    }
  }
}
