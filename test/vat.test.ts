import type { VatRateType, VatRules } from '../src/types'
import { describe, expect, it, mock } from 'bun:test'
import { defaultConfig } from '../src/config'
import { InvalidCountryCodeException, InvalidPostalCodeException, InvalidVatNumberException, VatCheckUnavailableException } from '../src/exceptions'
import { VatCalculator } from '../src/vat-calculator'

describe('VatCalculator', () => {
  describe('Basic VAT Calculations', () => {
    it('should calculate VAT without country', () => {
      const net = 25.00
      const calculator = new VatCalculator()
      const result = calculator.calculate(net)

      expect(result.netPrice).toBe(25.00)
      expect(result.grossPrice).toBe(25.00)
      expect(result.vatAmount).toBe(0)
      expect(result.vatRate).toBe(0)
    })

    it('should calculate VAT with predefined rules', () => {
      const net = 24.00
      const countryCode = 'DE'
      const calculator = new VatCalculator()
      const result = calculator.calculate(net, countryCode)

      expect(result.netPrice).toBe(24.00)
      expect(result.grossPrice).toBeCloseTo(28.56, 2)
      expect(result.vatAmount).toBeCloseTo(4.56, 2)
      expect(result.vatRate).toBe(0.19)
    })

    it('should calculate VAT with custom rules', () => {
      const net = 24.00
      const countryCode = 'DE'
      const calculator = new VatCalculator({
        rules: {
          ...defaultConfig.rules!,
          DE: { rate: 0.50, rates: { high: 0.50, low: 0.07 } },
          FR: { rate: 0.20, rates: { high: 0.20, low: 0.055 } },
          GB: { rate: 0.20, rates: { high: 0.20, low: 0.05 } },
        } as VatRules,
      })
      const result = calculator.calculate(net, countryCode)

      expect(result.netPrice).toBe(24.00)
      expect(result.grossPrice).toBe(36.00)
      expect(result.vatAmount).toBe(12.00)
      expect(result.vatRate).toBe(0.50)
    })
  })

  describe('B2B Transactions', () => {
    it('should handle B2B transactions with zero VAT', () => {
      const net = 24.00
      const countryCode = 'DE'
      const calculator = new VatCalculator()
      const result = calculator.calculate(net, countryCode, undefined, true)

      expect(result.netPrice).toBe(24.00)
      expect(result.grossPrice).toBe(24.00)
      expect(result.vatAmount).toBe(0)
      expect(result.vatRate).toBe(0)
      expect(result.isCompany).toBe(true)
    })

    it('should handle B2B transactions with business country code', () => {
      const net = 24.00
      const calculator = new VatCalculator({ businessCountryCode: 'DE' })
      const result = calculator.calculate(net, 'DE', undefined, true)

      expect(result.netPrice).toBe(24.00)
      expect(result.grossPrice).toBeCloseTo(28.56, 2)
      expect(result.vatAmount).toBeCloseTo(4.56, 2)
      expect(result.vatRate).toBe(0.19)
      expect(result.isCompany).toBe(true)
      expect(result.details?.reverseCharge).toBe(true)
    })
  })

  describe('Special Territories', () => {
    it('should handle special territory exceptions', () => {
      const net = 24.00
      const calculator = new VatCalculator()

      // Heligoland (Germany)
      const result1 = calculator.calculate(net, 'DE', '27498')
      expect(result1.grossPrice).toBe(24.00)
      expect(result1.vatRate).toBe(0)

      // Canary Islands (Spain)
      const result2 = calculator.calculate(net, 'ES', '35001')
      expect(result2.grossPrice).toBe(24.00)
      expect(result2.vatRate).toBe(0)
    })
  })

  describe('VAT Number Validation', () => {
    it('should validate VAT number format', () => {
      const calculator = new VatCalculator()
      const validVatNumbers = [
        'ATU12345678',
        'BE0123456789',
        'BE1234567891',
        'BG123456789',
        'BG1234567890',
        'CY12345678X',
        'CZ12345678',
        'DE123456789',
        'DE190098891',
        'DK12345678',
        'EE123456789',
        'EL123456789',
        'ESX12345678',
        'FI12345678',
        'FR12345678901',
        'GB999999973',
        'HU12345678',
        'HR12345678901',
        'IE1234567X',
        'IT12345678901',
        'LT123456789',
        'LU12345678',
        'LV12345678901',
        'MT12345678',
        'NL123456789B12',
        'PL1234567890',
        'PT123456789',
        'RO123456789',
        'SE123456789012',
        'SI12345678',
        'SK1234567890',
      ]

      for (const vatNumber of validVatNumbers) {
        expect(() => calculator.setVatNumber(vatNumber)).not.toThrow()
      }

      const invalidVatNumbers = [
        '',
        'ATU1234567',
        'BE012345678',
        'BE123456789',
        'BG1234567',
        'CY1234567X',
        'CZ1234567',
        'DE12345678',
        'DK1234567',
        'invalid_prefix_GB999999973',
        'IE1234567X_invalid_suffix',
      ]

      for (const vatNumber of invalidVatNumbers) {
        expect(() => calculator.setVatNumber(vatNumber)).toThrow(InvalidVatNumberException)
      }
    })

    it('should validate VAT number against VIES service', async () => {
      const calculator = new VatCalculator()
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns1:checkVatResponse>
      <tns1:countryCode>DE</tns1:countryCode>
      <tns1:vatNumber>123456789</tns1:vatNumber>
      <tns1:requestDate>2024-03-25</tns1:requestDate>
      <tns1:valid>true</tns1:valid>
      <tns1:name>Test Company</tns1:name>
      <tns1:address>Test Address</tns1:address>
    </tns1:checkVatResponse>
  </soap:Body>
</soap:Envelope>`

      const mockFetch = mock(() => Promise.resolve(new Response(mockXmlResponse, { status: 200 })))
      const originalFetch = globalThis.fetch
      globalThis.fetch = mockFetch

      try {
        const details = await calculator.getVatDetails('DE123456789')
        expect(details.isValid).toBe(true)
        expect(details.name).toBe('Test Company')
        expect(details.address).toBe('Test Address')
        expect(details.countryCode).toBe('DE')
        expect(details.vatNumber).toBe('123456789')
        expect(details.isCompany).toBe(true)

        const isValid = await calculator.isValidVatNumber('DE123456789')
        expect(isValid).toBe(true)
      }
      finally {
        globalThis.fetch = originalFetch
      }
    })

    it('should handle VIES service errors', async () => {
      const calculator = new VatCalculator()
      globalThis.fetch = mock(() => Promise.reject(new Error('Service unavailable')))

      await expect(calculator.getVatDetails('DE123456789')).rejects.toThrow(VatCheckUnavailableException)
      await expect(calculator.isValidVatNumber('DE123456789')).resolves.toBe(false)

      const calculatorWithForwardFaults = new VatCalculator({ forwardSoapFaults: true })
      await expect(calculatorWithForwardFaults.isValidVatNumber('DE123456789')).rejects.toThrow(VatCheckUnavailableException)
    })
  })

  describe('Postal Code Validation', () => {
    it('should validate postal codes', () => {
      const calculator = new VatCalculator({ validatePostalCodes: true })

      // Valid postal codes
      expect(() => calculator.setCountryCode('DE').setPostalCode('12345')).not.toThrow()
      expect(() => calculator.setCountryCode('FR').setPostalCode('75001')).not.toThrow()
      expect(() => calculator.setCountryCode('GB').setPostalCode('SW1A 1AA')).not.toThrow()

      // Invalid postal codes
      expect(() => calculator.setCountryCode('DE').setPostalCode('1234')).toThrow(InvalidPostalCodeException)
      expect(() => calculator.setCountryCode('FR').setPostalCode('7501')).toThrow(InvalidPostalCodeException)
      expect(() => calculator.setCountryCode('GB').setPostalCode('SW1A')).toThrow(InvalidPostalCodeException)
    })
  })

  describe('Net/Gross Calculations', () => {
    it('should calculate net price from gross', () => {
      const calculator = new VatCalculator()
      const result = calculator.calculateNet(119, 'DE')

      expect(result.netPrice).toBeCloseTo(100, 2)
      expect(result.grossPrice).toBe(119)
      expect(result.vatAmount).toBeCloseTo(19, 2)
      expect(result.vatRate).toBe(0.19)
    })

    it('should calculate net price from gross with B2B', () => {
      const calculator = new VatCalculator()
      const result = calculator.calculateNet(100, 'DE', undefined, true)

      expect(result.netPrice).toBe(100)
      expect(result.grossPrice).toBe(100)
      expect(result.vatAmount).toBe(0)
      expect(result.vatRate).toBe(0)
      expect(result.isCompany).toBe(true)
    })
  })

  describe('Special VAT Rates', () => {
    it('should handle different VAT rate types', () => {
      const calculator = new VatCalculator()

      // Standard rate
      const result1 = calculator.calculate(100, 'DE')
      expect(result1.vatRate).toBe(0.19)

      // Reduced rate
      const result2 = calculator.calculate(100, 'DE', undefined, false, 'low')
      expect(result2.vatRate).toBe(0.07)

      // Super-reduced rate (Spain)
      const result3 = calculator.calculate(100, 'ES', undefined, false, 'super-reduced')
      expect(result3.vatRate).toBe(0.04)
    })
  })

  describe('Method Chaining', () => {
    it('should support method chaining', () => {
      const calculator = new VatCalculator()
      const result = calculator
        .setCountryCode('DE')
        .setPostalCode('10115')
        .setCompany(true)
        .setVatNumber('DE123456789')
        .calculate(100)

      expect(result.countryCode).toBe('DE')
      expect(result.details?.postalCodeUsed).toBe('10115')
      expect(result.isCompany).toBe(true)
      expect(result.details?.vatNumberUsed).toBe('DE123456789')
    })
  })

  describe('Country Code Validation', () => {
    it('should validate country codes', () => {
      const calculator = new VatCalculator()

      // Valid country codes
      expect(() => calculator.setCountryCode('DE')).not.toThrow()
      expect(() => calculator.setCountryCode('FR')).not.toThrow()
      expect(() => calculator.setCountryCode('GB')).not.toThrow()

      // Invalid country codes
      expect(() => calculator.setCountryCode('XX' as any)).toThrow(InvalidCountryCodeException)
      expect(() => calculator.setCountryCode('ZZ' as any)).toThrow(InvalidCountryCodeException)
    })

    it('should return zero for invalid country code', () => {
      const calculator = new VatCalculator()
      const result = calculator.getTaxRateForCountry('XX' as any)
      expect(result).toBe(0)
    })

    it('should enforce country code types', () => {
      const calculator = new VatCalculator({
        rules: {
          ...defaultConfig.rules!,
          DE: { rate: 0.19, rates: { high: 0.19, low: 0.07 } },
          FR: { rate: 0.20, rates: { high: 0.20, low: 0.055 } },
          GB: { rate: 0.20, rates: { high: 0.20, low: 0.05 } },
        } as VatRules,
      })

      // These should compile without type errors
      calculator.setCountryCode('DE')
      calculator.setCountryCode('FR')
      calculator.setCountryCode('GB')

      expect(() => calculator.setCountryCode('XX' as any)).toThrow(InvalidCountryCodeException)
    })
  })

  describe('VAT Collection Rules', () => {
    it('should determine when to collect VAT', () => {
      const calculator = new VatCalculator()

      // Should collect VAT for valid EU countries
      expect(calculator.shouldCollectVat('DE')).toBe(true)
      expect(calculator.shouldCollectVat('FR')).toBe(true)

      // Should not collect VAT for invalid countries
      expect(calculator.shouldCollectVat('XX' as any)).toBe(false)
      expect(calculator.shouldCollectVat('' as any)).toBe(false)
    })

    it('should handle VAT number requirements', () => {
      const calculator = new VatCalculator({
        rules: {
          ...defaultConfig.rules,
          GB: {
            rate: 0.20,
            rates: {
              'high': 0.20,
              'low': 0.05,
              'super-reduced': 0,
            },
            specialRules: {
              vatNumberRequired: true,
            },
          },
        } as VatRules,
      })

      // Should require VAT number for GB
      expect(calculator.shouldCollectVat('GB')).toBe(true)

      // After setting VAT number
      calculator.setVatNumber('GB123456789')
      expect(calculator.shouldCollectVat('GB')).toBe(true)
    })
  })

  describe('Special Territory Rules', () => {
    it('should handle all special territories', () => {
      const calculator = new VatCalculator()
      const net = 100

      // Heligoland (Germany)
      const result1 = calculator.calculate(net, 'DE', '27498')
      expect(result1.vatRate).toBe(0)

      // Büsingen am Hochrhein (Germany)
      const result2 = calculator.calculate(net, 'DE', '78266')
      expect(result2.vatRate).toBe(0)

      // Jungholz (Austria)
      const result3 = calculator.calculate(net, 'AT', '6691')
      expect(result3.vatRate).toBe(0.19) // German VAT rate

      // Mount Athos (Greece)
      const result4 = calculator.calculate(net, 'EL', '63086')
      expect(result4.vatRate).toBe(0)

      // Canary Islands (Spain)
      const result5 = calculator.calculate(net, 'ES', '35001')
      expect(result5.vatRate).toBe(0)

      // Madeira (Portugal)
      const result6 = calculator.calculate(net, 'PT', '9000')
      expect(result6.vatRate).toBe(0.22)

      // Azores (Portugal)
      const result7 = calculator.calculate(net, 'PT', '9500')
      expect(result7.vatRate).toBe(0.16)
    })
  })

  describe('Business Country Rules', () => {
    it('should handle same-country B2B transactions', () => {
      const calculator = new VatCalculator({ businessCountryCode: 'DE' })
      const result = calculator.calculate(100, 'DE', undefined, true)

      expect(result.vatRate).toBe(0.19)
      expect(result.details?.reverseCharge).toBe(true)
    })

    it('should handle cross-border B2B transactions', () => {
      const calculator = new VatCalculator({ businessCountryCode: 'DE' })
      const result = calculator.calculate(100, 'FR', undefined, true)

      expect(result.vatRate).toBe(0)
      expect(result.details?.reverseCharge).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle SOAP faults with different configurations', () => {
      const calculator1 = new VatCalculator({ forwardSoapFaults: false })
      const calculator2 = new VatCalculator({ forwardSoapFaults: true })

      globalThis.fetch = mock(() => Promise.reject(new Error('SOAP Fault')))

      // Should return false when not forwarding faults
      expect(calculator1.isValidVatNumber('DE123456789')).resolves.toBe(false)

      // Should throw when forwarding faults
      expect(calculator2.isValidVatNumber('DE123456789')).rejects.toThrow()
    })

    it('should handle invalid postal codes with proper error messages', () => {
      const calculator = new VatCalculator({ validatePostalCodes: true })
      calculator.setCountryCode('DE')

      expect(() => calculator.setPostalCode('invalid')).toThrow(
        'Invalid postal code format for country DE',
      )
    })
  })

  describe('TypeScript-Specific Features', () => {
    it('should properly type VAT rate types', () => {
      const calculator = new VatCalculator()

      // These should compile without type errors
      calculator.calculate(100, 'DE', undefined, false, 'high' as VatRateType)
      calculator.calculate(100, 'DE', undefined, false, 'low' as VatRateType)
      calculator.calculate(100, 'ES', undefined, false, 'super-reduced' as VatRateType)
      calculator.calculate(100, 'DE', undefined, false, 'standard' as VatRateType)
      calculator.calculate(100, 'DE', undefined, false, 'reduced' as VatRateType)

      // @ts-expect-error - Invalid rate type
      calculator.calculate(100, 'DE', undefined, false, 'invalid-rate')
    })

    it('should enforce country code types', () => {
      const calculator = new VatCalculator({
        rules: {
          ...defaultConfig.rules!,
          DE: { rate: 0.19, rates: { high: 0.19, low: 0.07 } },
          FR: { rate: 0.20, rates: { high: 0.20, low: 0.055 } },
          GB: { rate: 0.20, rates: { high: 0.20, low: 0.05 } },
        },
      })

      // These should compile without type errors
      calculator.setCountryCode('DE')
      calculator.setCountryCode('FR')
      calculator.setCountryCode('GB')

      // @ts-expect-error - Invalid country code
      expect(() => calculator.setCountryCode('XX')).toThrow(InvalidCountryCodeException)
    })
  })
})
