export type NumericInputRules = {
  isNegative?: boolean
  isDecimal?: boolean
  maxLength?: number
}

/** Strip leading zeros from a numeric string: "010" → "10", "005" → "5", "0" → "0". */
export function stripLeadingZeros(raw: string): string {
  if (raw === '' || raw === '-') return raw
  const negative = raw.startsWith('-')
  let body = negative ? raw.slice(1) : raw
  body = body.replace(/^0+(?=\d)/, '')
  return negative ? `-${body}` : body
}

/**
 * Keep only characters allowed by the rules.
 * Decimal separator is a comma (a typed or pasted dot is converted).
 * `maxLength` counts digits only; minus and comma do not count.
 */
export function sanitizeNumericInput(
  raw: string,
  rules: NumericInputRules = {},
): string {
  const { isNegative = false, isDecimal = false, maxLength } = rules
  let result = ''
  let digitCount = 0
  let hasComma = false

  for (const char of raw) {
    if (char === '-' && isNegative && result === '') {
      result = '-'
      continue
    }

    if ((char === ',' || char === '.') && isDecimal && !hasComma) {
      if (digitCount === 0) {
        if (maxLength != null && digitCount >= maxLength) continue
        result += '0,'
        digitCount += 1
      } else {
        result += ','
      }
      hasComma = true
      continue
    }

    if (char >= '0' && char <= '9') {
      if (maxLength != null && digitCount >= maxLength) continue
      result += char
      digitCount += 1
    }
  }

  return stripLeadingZeros(result)
}

/** Parse a number-input value. Empty, incomplete, or invalid → null. Comma is the decimal separator. */
export function parseNumericInput(raw: string): number | null {
  const normalized = stripLeadingZeros(raw.trim().replace(',', '.'))
  if (normalized === '' || normalized === '-' || normalized.endsWith('.')) {
    return null
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/**
 * Display string for a numeric field: in-progress input is kept,
 * complete values are shown from `parseNumericInput` with a comma decimal.
 */
export function displayNumericInput(raw: string): string {
  const parsed = parseNumericInput(raw)
  if (parsed === null) return raw
  return String(parsed).replace('.', ',')
}

export function numberToNumericInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ''
  return displayNumericInput(String(value).replace('.', ','))
}

/** Parse a whole-number input. Empty, decimal, or invalid → null. */
export function parseIntegerInput(raw: string): number | null {
  const normalized = stripLeadingZeros(raw.trim())
  if (normalized === '' || normalized === '-') return null
  if (!/^-?\d+$/.test(normalized)) return null
  const n = Number(normalized)
  return Number.isSafeInteger(n) ? n : null
}
