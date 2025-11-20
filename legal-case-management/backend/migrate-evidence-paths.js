/**
 * 证据路径迁移脚本
 * 
 * 功能：将现有证据记录的完整文件系统路径转换为相对HTTP路径格式
 * 
 * 使用方法：
 *   node migrate-evidence-paths.js [--dry-run] [--verbose]
 * 
 * 参数：
 *   --dry-run: 仅模拟运行，不实际修改数据库
 *   --verbose: 显示详细日志
 */

const { query, run } = require('./src/config/database');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

/**
 * 日志输出函数
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (level === 'verbose' && !isVerbose) {
    return;
  }
  
  console.log(`${prefix} ${message}`);
}

/**
 * 转换完整路径为相对路径
 * @param {string} fullPath - 完整文件系统路径
 * @returns {string|null} 相对路径或null（如果无法转换）
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
    log(`无法在路径中找到 'uploads' 目录: ${fullPath}`, 'warn');
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
 * 验证转换后的路径是否可访问
 * @param {string} relativePath - 相对路径
 * @returns {boolean} 文件是否存在
 */
function verifyPathAccessibility(relativePath) {
  if (!relativePath) {
    return false;
  }
  
  // 构建绝对路径用于文件系统检查
  const absolutePath = path.join(__dirname, relativePath);
  
  return fs.existsSync(absolutePath);
}

/**
 * 迁移证据表的路径
 */
async function migrateEvidencePaths() {
  log('开始迁移证据路径...');
  
  try {
    // 获取所有证据记录
    const evidenceRecords = await query('SELECT id, storage_path, file_name FROM evidence');
    
    log(`找到 ${evidenceRecords.length} 条证据记录`);
    
    if (evidenceRecords.length === 0) {
      log('没有需要迁移的记录', 'info');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const record of evidenceRecords) {
      const { id, storage_path, file_name } = record;
      
      log(`处理证据 ID: ${id}, 文件名: ${file_name}`, 'verbose');
      log(`  原路径: ${storage_path}`, 'verbose');
      
      // 转换路径
      const relativePath = convertToRelativePath(storage_path);
      
      if (!relativePath) {
        log(`  ✗ 无法转换路径，跳过`, 'warn');
        failedCount++;
        continue;
      }
      
      // 检查路径是否已经是相对格式
      if (relativePath === storage_path) {
        log(`  ○ 路径已是相对格式，跳过`, 'verbose');
        skippedCount++;
        continue;
      }
      
      log(`  新路径: ${relativePath}`, 'verbose');
      
      // 验证文件可访问性
      const isAccessible = verifyPathAccessibility(relativePath);
      
      if (!isAccessible) {
        log(`  ⚠ 警告: 文件不存在或无法访问: ${relativePath}`, 'warn');
        // 继续处理，因为文件可能已被删除，但仍需更新路径格式
      } else {
        log(`  ✓ 文件验证成功`, 'verbose');
      }
      
      // 更新数据库
      if (!isDryRun) {
        try {
          await run('UPDATE evidence SET storage_path = ? WHERE id = ?', [relativePath, id]);
          log(`  ✓ 更新成功`, 'verbose');
          successCount++;
        } catch (error) {
          log(`  ✗ 更新失败: ${error.message}`, 'error');
          failedCount++;
        }
      } else {
        log(`  [DRY RUN] 将更新为: ${relativePath}`, 'verbose');
        successCount++;
      }
    }
    
    return { success: successCount, failed: failedCount, skipped: skippedCount };
    
  } catch (error) {
    log(`迁移过程出错: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 迁移证据版本历史表的路径
 */
async function migrateVersionPaths() {
  log('开始迁移证据版本历史路径...');
  
  try {
    // 获取所有版本记录
    const versionRecords = await query('SELECT id, storage_path, file_name FROM evidence_versions');
    
    log(`找到 ${versionRecords.length} 条版本记录`);
    
    if (versionRecords.length === 0) {
      log('没有需要迁移的版本记录', 'info');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const record of versionRecords) {
      const { id, storage_path, file_name } = record;
      
      log(`处理版本 ID: ${id}, 文件名: ${file_name}`, 'verbose');
      log(`  原路径: ${storage_path}`, 'verbose');
      
      // 转换路径
      const relativePath = convertToRelativePath(storage_path);
      
      if (!relativePath) {
        log(`  ✗ 无法转换路径，跳过`, 'warn');
        failedCount++;
        continue;
      }
      
      // 检查路径是否已经是相对格式
      if (relativePath === storage_path) {
        log(`  ○ 路径已是相对格式，跳过`, 'verbose');
        skippedCount++;
        continue;
      }
      
      log(`  新路径: ${relativePath}`, 'verbose');
      
      // 验证文件可访问性
      const isAccessible = verifyPathAccessibility(relativePath);
      
      if (!isAccessible) {
        log(`  ⚠ 警告: 文件不存在或无法访问: ${relativePath}`, 'warn');
      } else {
        log(`  ✓ 文件验证成功`, 'verbose');
      }
      
      // 更新数据库
      if (!isDryRun) {
        try {
          await run('UPDATE evidence_versions SET storage_path = ? WHERE id = ?', [relativePath, id]);
          log(`  ✓ 更新成功`, 'verbose');
          successCount++;
        } catch (error) {
          log(`  ✗ 更新失败: ${error.message}`, 'error');
          failedCount++;
        }
      } else {
        log(`  [DRY RUN] 将更新为: ${relativePath}`, 'verbose');
        successCount++;
      }
    }
    
    return { success: successCount, failed: failedCount, skipped: skippedCount };
    
  } catch (error) {
    log(`迁移版本历史过程出错: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('证据路径迁移脚本');
  console.log('='.repeat(60));
  
  if (isDryRun) {
    console.log('⚠ 运行模式: DRY RUN (不会实际修改数据库)');
  } else {
    console.log('⚠ 运行模式: 实际修改数据库');
  }
  
  if (isVerbose) {
    console.log('📝 详细日志: 已启用');
  }
  
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 迁移主证据表
    const evidenceResult = await migrateEvidencePaths();
    
    console.log('');
    console.log('-'.repeat(60));
    console.log('证据表迁移结果:');
    console.log(`  ✓ 成功: ${evidenceResult.success}`);
    console.log(`  ✗ 失败: ${evidenceResult.failed}`);
    console.log(`  ○ 跳过: ${evidenceResult.skipped}`);
    console.log('-'.repeat(60));
    console.log('');
    
    // 迁移版本历史表
    const versionResult = await migrateVersionPaths();
    
    console.log('');
    console.log('-'.repeat(60));
    console.log('版本历史表迁移结果:');
    console.log(`  ✓ 成功: ${versionResult.success}`);
    console.log(`  ✗ 失败: ${versionResult.failed}`);
    console.log(`  ○ 跳过: ${versionResult.skipped}`);
    console.log('-'.repeat(60));
    console.log('');
    
    // 总结
    const totalSuccess = evidenceResult.success + versionResult.success;
    const totalFailed = evidenceResult.failed + versionResult.failed;
    const totalSkipped = evidenceResult.skipped + versionResult.skipped;
    
    console.log('='.repeat(60));
    console.log('总体迁移结果:');
    console.log(`  ✓ 总成功: ${totalSuccess}`);
    console.log(`  ✗ 总失败: ${totalFailed}`);
    console.log(`  ○ 总跳过: ${totalSkipped}`);
    console.log('='.repeat(60));
    
    if (isDryRun) {
      console.log('');
      console.log('💡 这是一次模拟运行。要实际执行迁移，请运行:');
      console.log('   node migrate-evidence-paths.js');
    } else if (totalFailed > 0) {
      console.log('');
      console.log('⚠ 部分记录迁移失败，请检查日志');
      process.exit(1);
    } else {
      console.log('');
      console.log('✓ 迁移完成！');
    }
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('✗ 迁移失败:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// 运行主函数
main();
