const { run, query } = require('./src/config/database')
const { generateCreditCode } = require('./generate-credit-code')

async function updateCreditCodes() {
  console.log('============================================================')
  console.log('更新测试数据的统一社会信用代码')
  console.log('============================================================\n')

  try {
    // 为"测试科技有限公司"生成一个正规的统一社会信用代码
    const testCompanyCreditCode = generateCreditCode('9', '1', '110105')

    console.log(`生成的统一社会信用代码: ${testCompanyCreditCode}`)
    console.log('（北京市朝阳区企业法人）\n')

    // 更新数据库
    const result = await run(
      `UPDATE litigation_parties 
       SET unified_credit_code = ? 
       WHERE name = ? AND entity_type = '企业'`,
      [testCompanyCreditCode, '测试科技有限公司']
    )
    
    console.log(`✓ 已更新 ${result.changes} 条记录\n`)
    
    // 验证更新结果
    const rows = await query(
      `SELECT name, unified_credit_code, entity_type
       FROM litigation_parties
       WHERE name = '测试科技有限公司'`
    )
    
    console.log('验证结果:')
    console.log('------------------------------------------------------------')
    rows.forEach(row => {
      console.log(`企业名称: ${row.name}`)
      console.log(`实体类型: ${row.entity_type}`)
      console.log(`统一社会信用代码: ${row.unified_credit_code}`)
      console.log('------------------------------------------------------------')
    })
    
    console.log('\n✓ 更新完成！')
    console.log('\n提示: 刷新浏览器后，编辑"测试科技有限公司"可以看到正规的统一社会信用代码')
  } catch (error) {
    console.error('❌ 更新失败:', error.message)
    process.exit(1)
  }
}

updateCreditCodes()
