/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Chinese mobile)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * Validate ID number (Chinese)
 */
export const isValidIdNumber = (idNumber: string): boolean => {
  const idRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idRegex.test(idNumber)
}

/**
 * Validate unified credit code (Chinese business)
 */
export const isValidCreditCode = (code: string): boolean => {
  const codeRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
  return codeRegex.test(code)
}
