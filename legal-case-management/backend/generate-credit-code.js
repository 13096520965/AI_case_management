/**
 * 生成正规的统一社会信用代码
 * 
 * 统一社会信用代码规则：
 * - 共18位
 * - 第1位：登记管理部门代码（1-9，A-Z，不含I、O、Z、S、V）
 * - 第2位：机构类别代码
 * - 第3-8位：登记管理机关行政区划码（6位数字）
 * - 第9-17位：主体标识码（组织机构代码）
 * - 第18位：校验码
 */

// 可用字符集（不含I、O、Z、S、V）
const CODE_CHARS = '0123456789ABCDEFGHJKLMNPQRTUWXY'
const CODE_VALUES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'P': 23, 'Q': 24, 'R': 25,
  'T': 26, 'U': 27, 'W': 28, 'X': 29, 'Y': 30
}

// 权重因子
const WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]

/**
 * 计算校验码
 */
function calculateCheckCode(code17) {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const char = code17[i]
    const value = CODE_VALUES[char]
    sum += value * WEIGHTS[i]
  }
  
  const remainder = 31 - (sum % 31)
  return remainder === 31 ? '0' : CODE_CHARS[remainder]
}

/**
 * 生成统一社会信用代码
 * @param {string} registrationCode - 登记管理部门代码（默认9=企业）
 * @param {string} categoryCode - 机构类别代码（默认1=企业法人）
 * @param {string} regionCode - 行政区划码（6位，默认110105=北京市朝阳区）
 */
function generateCreditCode(
  registrationCode = '9',
  categoryCode = '1', 
  regionCode = '110105'
) {
  // 生成9位主体标识码（组织机构代码）
  let organizationCode = ''
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length)
    organizationCode += CODE_CHARS[randomIndex]
  }
  
  // 组合前17位
  const code17 = registrationCode + categoryCode + regionCode + organizationCode
  
  // 计算校验码
  const checkCode = calculateCheckCode(code17)
  
  return code17 + checkCode
}

/**
 * 验证统一社会信用代码
 */
function validateCreditCode(code) {
  if (!code || code.length !== 18) {
    return false
  }
  
  const code17 = code.substring(0, 17)
  const checkCode = code[17]
  const calculatedCheckCode = calculateCheckCode(code17)
  
  return checkCode === calculatedCheckCode
}

// 生成几个测试用的统一社会信用代码
console.log('生成统一社会信用代码示例：\n')

const examples = [
  { name: '北京企业', registration: '9', category: '1', region: '110105' },
  { name: '上海企业', registration: '9', category: '1', region: '310104' },
  { name: '深圳企业', registration: '9', category: '1', region: '440304' },
  { name: '广州企业', registration: '9', category: '1', region: '440103' },
  { name: '杭州企业', registration: '9', category: '1', region: '330102' }
]

examples.forEach(example => {
  const code = generateCreditCode(example.registration, example.category, example.region)
  const isValid = validateCreditCode(code)
  console.log(`${example.name}: ${code} ${isValid ? '✓' : '✗'}`)
})

console.log('\n可以直接复制使用以上任意一个代码进行测试！')

module.exports = {
  generateCreditCode,
  validateCreditCode
}
