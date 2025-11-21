/**
 * 清理数据库中乱码的文书记录
 */

const { query, run } = require('./src/config/database');
const fs = require('fs');

async function cleanGarbledDocuments() {
  try {
    console.log('开始清理乱码文书记录...\n');
    
    // 获取所有文书
    const documents = await query('SELECT * FROM smart_documents');
    
    console.log(`共找到 ${documents.length} 条文书记录\n`);
    
    let cleanedCount = 0;
    
    for (const doc of documents) {
      // 检查文件名是否包含乱码（包含 \x 或 æ 等字符）
      const hasGarbled = doc.document_name && (
        doc.document_name.includes('\\x') || 
        doc.document_name.includes('æ') ||
        doc.document_name.includes('è') ||
        doc.document_name.includes('ä') ||
        /[^\x00-\x7F\u4e00-\u9fa5]/.test(doc.document_name)
      );
      
      if (hasGarbled) {
        console.log(`发现乱码记录 ID: ${doc.id}`);
        console.log(`  乱码文件名: ${doc.document_name}`);
        
        // 删除数据库记录
        await run('DELETE FROM smart_documents WHERE id = ?', [doc.id]);
        
        // 如果有物理文件，也删除
        if (doc.file_path && fs.existsSync(doc.file_path)) {
          try {
            fs.unlinkSync(doc.file_path);
            console.log(`  ✓ 已删除物理文件: ${doc.file_path}`);
          } catch (err) {
            console.log(`  ✗ 删除物理文件失败: ${err.message}`);
          }
        }
        
        console.log(`  ✓ 已删除数据库记录\n`);
        cleanedCount++;
      }
    }
    
    if (cleanedCount === 0) {
      console.log('✓ 没有发现乱码记录');
    } else {
      console.log(`✓ 共清理了 ${cleanedCount} 条乱码记录`);
    }
    
    // 显示剩余的文书
    const remainingDocs = await query('SELECT id, document_name, document_type, created_at FROM smart_documents ORDER BY created_at DESC');
    
    if (remainingDocs.length > 0) {
      console.log(`\n剩余 ${remainingDocs.length} 条文书记录:\n`);
      remainingDocs.forEach((doc, index) => {
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   名称: ${doc.document_name}`);
        console.log(`   类型: ${doc.document_type}`);
        console.log(`   创建时间: ${doc.created_at}\n`);
      });
    } else {
      console.log('\n数据库中没有文书记录');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

cleanGarbledDocuments();
