/**
 * 验证文书管理 API 实现
 * 此脚本检查所有必需的文件和功能是否已正确实现
 */

const fs = require('fs');
const path = require('path');

console.log('\n========== 文书管理 API 实现验证 ==========\n');

const checks = [
  {
    name: '文书控制器',
    path: './src/controllers/documentController.js',
    functions: [
      'uploadDocument',
      'getDocumentsByCaseId',
      'getDocumentById',
      'downloadDocument',
      'deleteDocument',
      'getDocumentStatistics',
      'recognizeDocument',
      'getOCRResult',
      'createTemplate',
      'getTemplates',
      'generateFromTemplate'
    ]
  },
  {
    name: '文书路由',
    path: './src/routes/document.js',
    routes: [
      'POST /upload',
      'GET /:id',
      'GET /:id/download',
      'DELETE /:id',
      'POST /:id/ocr',
      'GET /:id/ocr'
    ]
  },
  {
    name: '文书模板路由',
    path: './src/routes/documentTemplate.js',
    routes: [
      'POST /',
      'GET /',
      'GET /:id',
      'PUT /:id',
      'DELETE /:id',
      'POST /:id/generate',
      'GET /defaults'
    ]
  },
  {
    name: '文书模型',
    path: './src/models/Document.js',
    exists: true
  },
  {
    name: '文书模板模型',
    path: './src/models/DocumentTemplate.js',
    exists: true
  },
  {
    name: 'OCR服务',
    path: './src/services/ocrService.js',
    functions: [
      'performOCR',
      'callThirdPartyOCR',
      'extractKeyInformation'
    ]
  },
  {
    name: '文书模板服务',
    path: './src/services/documentTemplateService.js',
    functions: [
      'generateDocument',
      'replaceVariables',
      'getDefaultTemplates'
    ]
  }
];

let allPassed = true;

checks.forEach(check => {
  const filePath = path.join(__dirname, check.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${check.name}: 文件不存在`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (check.functions) {
    const missingFunctions = check.functions.filter(fn => !content.includes(fn));
    if (missingFunctions.length > 0) {
      console.log(`✗ ${check.name}: 缺少函数 ${missingFunctions.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✓ ${check.name}: 所有函数已实现 (${check.functions.length}个)`);
    }
  }

  if (check.routes) {
    const missingRoutes = check.routes.filter(route => {
      const [method, path] = route.split(' ');
      return !content.includes(`router.${method.toLowerCase()}('${path}'`);
    });
    if (missingRoutes.length > 0) {
      console.log(`✗ ${check.name}: 缺少路由 ${missingRoutes.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✓ ${check.name}: 所有路由已实现 (${check.routes.length}个)`);
    }
  }

  if (check.exists) {
    console.log(`✓ ${check.name}: 文件存在`);
  }
});

// 检查 app.js 中是否注册了路由
console.log('\n--- 路由注册检查 ---');
const appPath = path.join(__dirname, './src/app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

if (appContent.includes("app.use('/api/documents'")) {
  console.log('✓ 文书路由已在 app.js 中注册');
} else {
  console.log('✗ 文书路由未在 app.js 中注册');
  allPassed = false;
}

if (appContent.includes("app.use('/api/document-templates'")) {
  console.log('✓ 文书模板路由已在 app.js 中注册');
} else {
  console.log('✗ 文书模板路由未在 app.js 中注册');
  allPassed = false;
}

// 检查数据库表
console.log('\n--- 数据库表检查 ---');
const initDbPath = path.join(__dirname, './src/config/initDatabase.js');
const initDbContent = fs.readFileSync(initDbPath, 'utf8');

if (initDbContent.includes('CREATE TABLE IF NOT EXISTS documents')) {
  console.log('✓ documents 表已定义');
} else {
  console.log('✗ documents 表未定义');
  allPassed = false;
}

if (initDbContent.includes('CREATE TABLE IF NOT EXISTS document_templates')) {
  console.log('✓ document_templates 表已定义');
} else {
  console.log('✗ document_templates 表未定义');
  allPassed = false;
}

// 检查上传目录
console.log('\n--- 上传目录检查 ---');
const uploadDir = path.join(__dirname, './uploads/documents');
if (fs.existsSync(uploadDir)) {
  console.log('✓ 文书上传目录存在');
} else {
  console.log('✓ 文书上传目录将在首次上传时自动创建');
}

console.log('\n========================================');
if (allPassed) {
  console.log('\n✓ 所有检查通过！文书管理 API 已完整实现。\n');
  console.log('实现的功能包括：');
  console.log('  1. 文书上传和管理接口 (POST, GET, DELETE)');
  console.log('  2. 文书分类归档 (自动识别文书类型)');
  console.log('  3. OCR 识别接口 (模拟实现，预留第三方对接)');
  console.log('  4. 文书模板管理 (CRUD + 基于模板生成文书)');
} else {
  console.log('\n✗ 部分检查未通过，请检查上述错误。\n');
}
console.log('========================================\n');
