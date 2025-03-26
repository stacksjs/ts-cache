export class VatCalculatorException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VatCalculatorException'
  }
}

export class VatCheckUnavailableException extends VatCalculatorException {
  constructor(message = 'VAT check is currently unavailable') {
    super(message)
    this.name = 'VatCheckUnavailableException'
  }
}

export class InvalidVatNumberException extends VatCalculatorException {
  constructor(message = 'The provided VAT number is invalid') {
    super(message)
    this.name = 'InvalidVatNumberException'
  }
}

export class InvalidCountryCodeException extends VatCalculatorException {
  constructor(message = 'The provided country code is invalid') {
    super(message)
    this.name = 'InvalidCountryCodeException'
  }
}

export class InvalidPostalCodeException extends VatCalculatorException {
  constructor(message = 'The provided postal code is invalid') {
    super(message)
    this.name = 'InvalidPostalCodeException'
  }
}
