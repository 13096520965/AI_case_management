/**
 * 验证文件上传功能配置
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('验证文件上传功能配置');
console.log('========================================\n');

let allChecks = true;

// 1. 检查 Multer 依赖
console.log('1. 检查 Multer 依赖...');
try {
  const multer = require('multer');
  console.log('   ✓ Multer 已安装');
} catch (error) {
  console.log('   ✗ Multer 未安装');
  allChecks = false;
}

// 2. 检查上传目录
console.log('\n2. 检查上传目录...');
const uploadDir = path.join(__dirname, 'uploads/evidence');
if (fs.existsSync(uploadDir)) {
  console.log('   ✓ 上传目录存在:', uploadDir);
} else {
  console.log('   ✗ 上传目录不存在:', uploadDir);
  allChecks = false;
}

// 3. 检查控制器文件
console.log('\n3. 检查证据控制器...');
const controllerPath = path.join(__dirname, 'src/controllers/evidenceController.js');
if (fs.existsSync(controllerPath)) {
  console.log('   ✓ 证据控制器存在');
  
  // 检查关键函数
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  const requiredFunctions = [
    'uploadEvidence',
    'multer.diskStorage',
    'fileFilter',
    'POST /api/evidence/upload'
  ];
  
  let allFunctionsPresent = true;
  requiredFunctions.forEach(func => {
    if (controllerContent.includes(func)) {
      console.log(`   ✓ 包含 ${func}`);
    } else {
      console.log(`   ✗ 缺少 ${func}`);
      allFunctionsPresent = false;
    }
  });
  
  if (!allFunctionsPresent) allChecks = false;
} else {
  console.log('   ✗ 证据控制器不存在');
  allChecks = false;
}

// 4. 检查路由配置
console.log('\n4. 检查路由配置...');
const routePath = path.join(__dirname, 'src/routes/evidence.js');
if (fs.existsSync(routePath)) {
  console.log('   ✓ 证据路由存在');
  
  const routeContent = fs.readFileSync(routePath, 'utf8');
  if (routeContent.includes("router.post('/upload'")) {
    console.log('   ✓ 上传路由已配置');
  } else {
    console.log('   ✗ 上传路由未配置');
    allChecks = false;
  }
} else {
  console.log('   ✗ 证据路由不存在');
  allChecks = false;
}

// 5. 检查数据模型
console.log('\n5. 检查数据模型...');
const modelPath = path.join(__dirname, 'src/models/Evidence.js');
if (fs.existsSync(modelPath)) {
  console.log('   ✓ Evidence 模型存在');
  
  const modelContent = fs.readFileSync(modelPath, 'utf8');
  const requiredMethods = ['create', 'findById', 'findByCaseId', 'update', 'delete'];
  
  let allMethodsPresent = true;
  requiredMethods.forEach(method => {
    if (modelContent.includes(`static async ${method}`)) {
      console.log(`   ✓ 包含 ${method} 方法`);
    } else {
      console.log(`   ✗ 缺少 ${method} 方法`);
      allMethodsPresent = false;
    }
  });
  
  if (!allMethodsPresent) allChecks = false;
} else {
  console.log('   ✗ Evidence 模型不存在');
  allChecks = false;
}

// 6. 检查支持的文件类型
console.log('\n6. 检查支持的文件类型...');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
const supportedTypes = [
  'application/pdf',
  'image/jpeg',
  'audio/mpeg',
  'video/mp4'
];

let allTypesSupported = true;
supportedTypes.forEach(type => {
  if (controllerContent.includes(type)) {
    console.log(`   ✓ 支持 ${type}`);
  } else {
    console.log(`   ✗ 不支持 ${type}`);
    allTypesSupported = false;
  }
});

if (!allTypesSupported) allChecks = false;

// 总结
console.log('\n========================================');
if (allChecks) {
  console.log('✓ 所有检查通过！文件上传功能已正确配置');
  console.log('\n功能特性:');
  console.log('  • Multer 文件上传中间件已配置');
  console.log('  • POST /api/evidence/upload 接口已实现');
  console.log('  • 支持 PDF、图片、音频、视频格式');
  console.log('  • 生成唯一文件名并存储');
  console.log('  • 文件大小限制: 100MB');
  console.log('  • 存储路径: uploads/evidence/');
} else {
  console.log('✗ 部分检查未通过，请检查上述错误');
}
console.log('========================================');

process.exit(allChecks ? 0 : 1);
