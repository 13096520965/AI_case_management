/**
 * 检查数据库中的文书数据
 */

const { query } = require('./src/config/database');

async function checkDocuments() {
  try {
    console.log('查询数据库中的文书数据...\n');
    
    const documents = await query(
      `SELECT id, case_id, document_type, document_name, file_name, created_at 
       FROM smart_documents 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    console.log(`共找到 ${documents.length} 条文书记录:\n`);
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   案件ID: ${doc.case_id}`);
      console.log(`   类型: ${doc.document_type}`);
      console.log(`   名称: ${doc.document_name}`);
      console.log(`   文件名: ${doc.file_name || '无'}`);
      console.log(`   创建时间: ${doc.created_at}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkDocuments();
