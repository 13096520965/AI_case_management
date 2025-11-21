const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../../legal_case_management.db');
const db = new sqlite3.Database(dbPath);

/**
 * 初始化默认流程模板
 */
async function initDefaultTemplates() {
  console.log('开始初始化默认流程模板...');

  // 民事案件模板
  const civilTemplate = {
    template_name: '民事诉讼标准流程',
    case_type: '民事',
    description: '适用于一般民事诉讼案件的标准流程',
    is_default: 1
  };

  const civilNodes = [
    { node_type: '立案', node_name: '立案受理', deadline_days: 7, node_order: 1, description: '法院受理案件并立案' },
    { node_type: '送达', node_name: '送达起诉状副本', deadline_days: 5, node_order: 2, description: '向被告送达起诉状副本' },
    { node_type: '举证', node_name: '举证期限', deadline_days: 30, node_order: 3, description: '双方提交证据材料' },
    { node_type: '开庭', node_name: '庭前准备', deadline_days: 15, node_order: 4, description: '准备开庭材料和辩论意见' },
    { node_type: '开庭', node_name: '第一次开庭', deadline_days: 7, node_order: 5, description: '法庭调查和辩论' },
    { node_type: '调解', node_name: '调解程序', deadline_days: 15, node_order: 6, description: '尝试调解解决纠纷' },
    { node_type: '判决', node_name: '等待判决', deadline_days: 30, node_order: 7, description: '法院作出判决' },
    { node_type: '送达', node_name: '判决书送达', deadline_days: 5, node_order: 8, description: '送达判决书' }
  ];

  // 刑事案件模板
  const criminalTemplate = {
    template_name: '刑事诉讼标准流程',
    case_type: '刑事',
    description: '适用于一般刑事诉讼案件的标准流程',
    is_default: 1
  };

  const criminalNodes = [
    { node_type: '立案', node_name: '立案侦查', deadline_days: 3, node_order: 1, description: '公安机关立案侦查' },
    { node_type: '其他', node_name: '侦查取证', deadline_days: 60, node_order: 2, description: '收集证据材料' },
    { node_type: '其他', node_name: '审查起诉', deadline_days: 30, node_order: 3, description: '检察院审查起诉' },
    { node_type: '开庭', node_name: '法院受理', deadline_days: 7, node_order: 4, description: '法院受理案件' },
    { node_type: '开庭', node_name: '庭前会议', deadline_days: 15, node_order: 5, description: '召开庭前会议' },
    { node_type: '开庭', node_name: '开庭审理', deadline_days: 7, node_order: 6, description: '法庭审理' },
    { node_type: '判决', node_name: '宣判', deadline_days: 30, node_order: 7, description: '法院宣判' }
  ];

  // 行政案件模板
  const adminTemplate = {
    template_name: '行政诉讼标准流程',
    case_type: '行政',
    description: '适用于行政诉讼案件的标准流程',
    is_default: 1
  };

  const adminNodes = [
    { node_type: '立案', node_name: '立案审查', deadline_days: 7, node_order: 1, description: '法院审查立案' },
    { node_type: '送达', node_name: '送达起诉状', deadline_days: 5, node_order: 2, description: '向被告行政机关送达' },
    { node_type: '举证', node_name: '被告举证', deadline_days: 15, node_order: 3, description: '行政机关提供证据' },
    { node_type: '举证', node_name: '原告举证', deadline_days: 15, node_order: 4, description: '原告提供证据' },
    { node_type: '开庭', node_name: '开庭审理', deadline_days: 30, node_order: 5, description: '法庭审理' },
    { node_type: '判决', node_name: '作出判决', deadline_days: 45, node_order: 6, description: '法院判决' }
  ];

  // 劳动仲裁模板
  const laborTemplate = {
    template_name: '劳动仲裁标准流程',
    case_type: '劳动仲裁',
    description: '适用于劳动争议仲裁案件的标准流程',
    is_default: 1
  };

  const laborNodes = [
    { node_type: '立案', node_name: '申请仲裁', deadline_days: 3, node_order: 1, description: '提交仲裁申请' },
    { node_type: '送达', node_name: '送达仲裁申请书', deadline_days: 5, node_order: 2, description: '向被申请人送达' },
    { node_type: '举证', node_name: '举证期', deadline_days: 15, node_order: 3, description: '双方提交证据' },
    { node_type: '开庭', node_name: '开庭审理', deadline_days: 15, node_order: 4, description: '仲裁庭审理' },
    { node_type: '调解', node_name: '调解', deadline_days: 10, node_order: 5, description: '尝试调解' },
    { node_type: '判决', node_name: '仲裁裁决', deadline_days: 15, node_order: 6, description: '作出仲裁裁决' }
  ];

  try {
    // 插入民事模板
    await insertTemplate(civilTemplate, civilNodes);
    console.log('✓ 民事诉讼模板创建成功');

    // 插入刑事模板
    await insertTemplate(criminalTemplate, criminalNodes);
    console.log('✓ 刑事诉讼模板创建成功');

    // 插入行政模板
    await insertTemplate(adminTemplate, adminNodes);
    console.log('✓ 行政诉讼模板创建成功');

    // 插入劳动仲裁模板
    await insertTemplate(laborTemplate, laborNodes);
    console.log('✓ 劳动仲裁模板创建成功');

    console.log('\n默认流程模板初始化完成！');
  } catch (error) {
    console.error('初始化默认模板失败:', error);
    throw error;
  }
}

/**
 * 插入模板和节点
 */
function insertTemplate(template, nodes) {
  return new Promise((resolve, reject) => {
    // 先检查是否已存在
    db.get(
      'SELECT id FROM process_templates WHERE template_name = ? AND case_type = ?',
      [template.template_name, template.case_type],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          console.log(`  模板 "${template.template_name}" 已存在，跳过`);
          resolve();
          return;
        }

        // 插入模板
        db.run(
          `INSERT INTO process_templates (template_name, case_type, description, is_default) 
           VALUES (?, ?, ?, ?)`,
          [template.template_name, template.case_type, template.description, template.is_default],
          function(err) {
            if (err) {
              reject(err);
              return;
            }

            const templateId = this.lastID;

            // 插入节点
            const stmt = db.prepare(
              `INSERT INTO process_template_nodes 
               (template_id, node_type, node_name, deadline_days, node_order, description) 
               VALUES (?, ?, ?, ?, ?, ?)`
            );

            nodes.forEach(node => {
              stmt.run(
                templateId,
                node.node_type,
                node.node_name,
                node.deadline_days,
                node.node_order,
                node.description
              );
            });

            stmt.finalize((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        );
      }
    );
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  initDefaultTemplates()
    .then(() => {
      console.log('\n✓ 所有操作完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ 操作失败:', error);
      process.exit(1);
    });
}

module.exports = { initDefaultTemplates };
