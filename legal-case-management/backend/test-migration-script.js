/**
 * 测试迁移脚本功能
 * 
 * 此脚本用于验证路径转换逻辑的正确性
 */

const path = require('path');

/**
 * 转换完整路径为相对路径（从迁移脚本复制）
 */
function convertToRelativePath(fullPath) {
  if (!fullPath) {
    return null;
  }
  
  // 如果已经是相对路径格式，直接返回
  if (fullPath.startsWith('/uploads/')) {
    return fullPath;
  }
  
  // 查找 'uploads' 在路径中的位置
  const uploadsIndex = fullPath.indexOf('uploads');
  
  if (uploadsIndex === -1) {
    console.log(`无法在路径中找到 'uploads' 目录: ${fullPath}`);
    return null;
  }
  
  // 提取从 uploads 开始的路径部分
  const relativePart = fullPath.substring(uploadsIndex);
  
  // 标准化路径分隔符为正斜杠
  const normalizedPath = relativePart.replace(/\\/g, '/');
  
  // 确保以 / 开头
  const finalPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  return finalPath;
}

/**
 * 测试用例
 */
const testCases = [
  {
    name: 'Windows完整路径',
    input: 'C:\\Users\\username\\project\\backend\\uploads\\evidence\\file.pdf',
    expected: '/uploads/evidence/file.pdf'
  },
  {
    name: 'Unix完整路径',
    input: '/Users/username/project/backend/uploads/evidence/file.pdf',
    expected: '/uploads/evidence/file.pdf'
  },
  {
    name: '已经是相对路径',
    input: '/uploads/evidence/file.pdf',
    expected: '/uploads/evidence/file.pdf'
  },
  {
    name: '混合路径分隔符',
    input: 'C:/Users/username/project\\backend\\uploads/evidence\\file.pdf',
    expected: '/uploads/evidence/file.pdf'
  },
  {
    name: '中文文件名',
    input: 'C:\\Users\\username\\project\\backend\\uploads\\evidence\\合同文件.pdf',
    expected: '/uploads/evidence/合同文件.pdf'
  },
  {
    name: '无效路径（不包含uploads）',
    input: 'C:\\Users\\username\\documents\\file.pdf',
    expected: null
  },
  {
    name: '空路径',
    input: '',
    expected: null
  },
  {
    name: 'null路径',
    input: null,
    expected: null
  }
];

/**
 * 运行测试
 */
function runTests() {
  console.log('='.repeat(70));
  console.log('迁移脚本路径转换功能测试');
  console.log('='.repeat(70));
  console.log('');
  
  let passedCount = 0;
  let failedCount = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`  输入: ${testCase.input}`);
    console.log(`  期望: ${testCase.expected}`);
    
    const result = convertToRelativePath(testCase.input);
    console.log(`  结果: ${result}`);
    
    if (result === testCase.expected) {
      console.log(`  ✓ 通过`);
      passedCount++;
    } else {
      console.log(`  ✗ 失败`);
      failedCount++;
    }
    console.log('');
  });
  
  console.log('='.repeat(70));
  console.log('测试结果汇总:');
  console.log(`  ✓ 通过: ${passedCount}/${testCases.length}`);
  console.log(`  ✗ 失败: ${failedCount}/${testCases.length}`);
  console.log('='.repeat(70));
  
  if (failedCount === 0) {
    console.log('');
    console.log('✓ 所有测试通过！路径转换逻辑正确。');
    process.exit(0);
  } else {
    console.log('');
    console.log('✗ 部分测试失败，请检查路径转换逻辑。');
    process.exit(1);
  }
}

// 运行测试
runTests();
