const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function backupArchivePackages(rows) {
  const dir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `archive_packages_backup_${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf8');
  return file;
}

async function clearArchivePackages({ backup = true } = {}) {
  try {
    const packages = await db.query('SELECT * FROM archive_packages');
    if (!packages || packages.length === 0) {
      console.log('没有发现归档包（archive_packages）数据，跳过删除。');
      return;
    }

    let backupFile = null;
    if (backup) {
      backupFile = await backupArchivePackages(packages);
      console.log('已备份 archive_packages 到:', backupFile);
    }

    // 开始删除：先将 case_knowledge.archive_package_id 置空（外键为 SET NULL，但做一遍以明确）
    const updateResult = await db.run('UPDATE case_knowledge SET archive_package_id = NULL WHERE archive_package_id IS NOT NULL');
    console.log('已清空 case_knowledge.archive_package_id，影响行数:', updateResult.changes || 0);

    // 删除归档包记录
    const delResult = await db.run('DELETE FROM archive_packages');
    console.log('已删除 archive_packages 表，删除行数:', delResult.changes || 0);

    console.log('归档列表数据清理完成。');
    if (backupFile) console.log('备份文件位于：', backupFile);
  } catch (err) {
    console.error('清理 archive_packages 失败:', err);
    process.exit(1);
  }
}

// CLI
(async () => {
  const args = process.argv.slice(2);
  const noBackup = args.includes('--no-backup');
  await clearArchivePackages({ backup: !noBackup });
  process.exit(0);
})();
