# API Reference

## VatCalculator Class

The main class for handling VAT calculations and validations.

### Constructor

```typescript
constructor(config: Partial<VatCalculatorConfig> = {})
```

Creates a new VAT calculator instance with optional configuration.

#### Configuration Options

```typescript
interface VatCalculatorConfig {
  businessCountryCode?: CountryCode
  validateVatNumbers?: boolean
  validatePostalCodes?: boolean
  validateCountryCodes?: boolean
  forwardSoapFaults?: boolean
  soapTimeout?: number
  rules?: VatRules
}
```

### Core Methods

#### calculate

```typescript
calculate(
  netPrice: number,
  countryCode?: CountryCode,
  postalCode?: string,
  company: boolean = false,
  type?: VatRateType
): VatCalculationResult
```

Calculates VAT for a given price and location.

**Returns:**

```typescript
interface VatCalculationResult {
  netPrice: number
  grossPrice: number
  vatAmount: number
  vatRate: number
  countryCode: CountryCode
  isCompany: boolean
  details: {
    ruleApplied: VatRateType
    reverseCharge: boolean
    vatNumberUsed?: string
    postalCodeUsed?: string
  }
}
```

#### calculateNet

```typescript
calculateNet(
  grossPrice: number,
  countryCode?: CountryCode,
  postalCode?: string,
  company: boolean = false,
  type?: VatRateType
): VatCalculationResult
```

Calculates the net price from a gross price.

### VAT Number Methods

#### isValidVatNumber

```typescript
async isValidVatNumber(vatNumber: string): Promise<boolean>
```

Validates a VAT number against the VIES service.

#### getVatDetails

```typescript
async getVatDetails(vatNumber: string): Promise<VatNumberValidationResult>
```

Gets detailed information about a VAT number.

**Returns:**

```typescript
interface VatNumberValidationResult {
  isValid: boolean
  name?: string
  address?: string
  countryCode?: CountryCode
  vatNumber?: string
  isCompany: boolean
}
```

### Setter Methods

#### setCountryCode

```typescript
setCountryCode(countryCode: CountryCode): this
```

Sets the country code for VAT calculations.

#### setPostalCode

```typescript
setPostalCode(postalCode: string): this
```

Sets the postal code for VAT calculations.

#### setCompany

```typescript
setCompany(company: boolean): this
```

Sets whether the customer is a business.

#### setVatNumber

```typescript
setVatNumber(vatNumber: string): this
```

Sets the VAT number for the calculation.

#### setBusinessCountryCode

```typescript
setBusinessCountryCode(businessCountryCode: CountryCode): this
```

Sets the business country code.

### Getter Methods

#### getNetPrice

```typescript
getNetPrice(): number
```

Gets the current net price.

#### getCountryCode

```typescript
getCountryCode(): CountryCode | undefined
```

Gets the current country code.

#### getPostalCode

```typescript
getPostalCode(): string | undefined
```

Gets the current postal code.

#### isCompany

```typescript
isCompany(): boolean
```

Gets whether the customer is a business.

#### getVatNumber

```typescript
getVatNumber(): string | undefined
```

Gets the current VAT number.

### Utility Methods

#### shouldCollectVat

```typescript
shouldCollectVat(countryCode: CountryCode): boolean
```

Determines whether VAT should be collected for a given country.

#### getTaxRateForCountry

```typescript
getTaxRateForCountry(
  countryCode: CountryCode,
  company: boolean = false,
  type?: VatRateType
): number
```

Gets the VAT rate for a specific country.

#### getTaxRateForLocation

```typescript
getTaxRateForLocation(
  countryCode: CountryCode,
  postalCode?: string,
  company: boolean = false,
  type?: VatRateType
): number
```

Gets the VAT rate for a specific location, considering special territories.

## Types

### CountryCode

```typescript
type CountryCode = 'AT' | 'BE' | 'BG' | 'CY' | 'CZ' | 'DE' | 'DK' | 'EE' | 'EL' |
  'ES' | 'FI' | 'FR' | 'GB' | 'HR' | 'HU' | 'IE' | 'IT' | 'LT' | 'LU' | 'LV' |
  'MT' | 'NL' | 'PL' | 'PT' | 'RO' | 'SE' | 'SI' | 'SK'
```

### VatRateType

```typescript
type VatRateType = 'standard' | 'reduced' | 'super-reduced' | 'parking' | 'high' | 'low'
```

### VatRules

```typescript
interface VatRules {
  [key: string]: CountryVatRule
}

interface CountryVatRule {
  rate: number
  rates?: {
    [key in VatRateType]?: number
  }
  specialRules?: {
    vatNumberRequired?: boolean
    reverseCharge?: boolean
  }
}
```

## Exceptions

The library throws the following exceptions:

### VatCalculatorException

Base exception class for all VAT calculator errors.

### InvalidCountryCodeException

Thrown when an invalid country code is provided.

### InvalidPostalCodeException

Thrown when an invalid postal code format is provided.

### InvalidVatNumberException

Thrown when an invalid VAT number format is provided.

### VatCheckUnavailableException

Thrown when the VIES VAT validation service is unavailable.

## Usage Examples

See the [Usage Guide](./usage.md) for detailed examples of how to use these APIs.
