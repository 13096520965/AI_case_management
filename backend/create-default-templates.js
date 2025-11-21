const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 先登录获取 token
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 创建模板
async function createTemplate(token, templateData) {
  try {
    const response = await axios.post(`${API_BASE}/templates`, templateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`✓ 模板 "${templateData.template_name}" 创建成功`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('已存在')) {
      console.log(`  模板 "${templateData.template_name}" 已存在，跳过`);
    } else {
      console.error(`✗ 创建模板 "${templateData.template_name}" 失败:`, error.response?.data || error.message);
    }
  }
}

async function main() {
  console.log('开始创建默认流程模板...\n');

  try {
    // 登录
    console.log('正在登录...');
    const token = await login();
    console.log('登录成功\n');

    // 民事案件模板
    await createTemplate(token, {
      template_name: '民事诉讼标准流程',
      case_type: '民事',
      description: '适用于一般民事诉讼案件的标准流程',
      is_default: 1,
      nodes: [
        { node_type: '立案', node_name: '立案受理', deadline_days: 7, node_order: 1 },
        { node_type: '送达', node_name: '送达起诉状副本', deadline_days: 5, node_order: 2 },
        { node_type: '举证', node_name: '举证期限', deadline_days: 30, node_order: 3 },
        { node_type: '开庭', node_name: '庭前准备', deadline_days: 15, node_order: 4 },
        { node_type: '开庭', node_name: '第一次开庭', deadline_days: 7, node_order: 5 },
        { node_type: '调解', node_name: '调解程序', deadline_days: 15, node_order: 6 },
        { node_type: '判决', node_name: '等待判决', deadline_days: 30, node_order: 7 },
        { node_type: '送达', node_name: '判决书送达', deadline_days: 5, node_order: 8 }
      ]
    });

    // 刑事案件模板
    await createTemplate(token, {
      template_name: '刑事诉讼标准流程',
      case_type: '刑事',
      description: '适用于一般刑事诉讼案件的标准流程',
      is_default: 1,
      nodes: [
        { node_type: '立案', node_name: '立案侦查', deadline_days: 3, node_order: 1 },
        { node_type: '其他', node_name: '侦查取证', deadline_days: 60, node_order: 2 },
        { node_type: '其他', node_name: '审查起诉', deadline_days: 30, node_order: 3 },
        { node_type: '开庭', node_name: '法院受理', deadline_days: 7, node_order: 4 },
        { node_type: '开庭', node_name: '庭前会议', deadline_days: 15, node_order: 5 },
        { node_type: '开庭', node_name: '开庭审理', deadline_days: 7, node_order: 6 },
        { node_type: '判决', node_name: '宣判', deadline_days: 30, node_order: 7 }
      ]
    });

    // 行政案件模板
    await createTemplate(token, {
      template_name: '行政诉讼标准流程',
      case_type: '行政',
      description: '适用于行政诉讼案件的标准流程',
      is_default: 1,
      nodes: [
        { node_type: '立案', node_name: '立案审查', deadline_days: 7, node_order: 1 },
        { node_type: '送达', node_name: '送达起诉状', deadline_days: 5, node_order: 2 },
        { node_type: '举证', node_name: '被告举证', deadline_days: 15, node_order: 3 },
        { node_type: '举证', node_name: '原告举证', deadline_days: 15, node_order: 4 },
        { node_type: '开庭', node_name: '开庭审理', deadline_days: 30, node_order: 5 },
        { node_type: '判决', node_name: '作出判决', deadline_days: 45, node_order: 6 }
      ]
    });

    // 劳动仲裁模板
    await createTemplate(token, {
      template_name: '劳动仲裁标准流程',
      case_type: '劳动仲裁',
      description: '适用于劳动争议仲裁案件的标准流程',
      is_default: 1,
      nodes: [
        { node_type: '立案', node_name: '申请仲裁', deadline_days: 3, node_order: 1 },
        { node_type: '送达', node_name: '送达仲裁申请书', deadline_days: 5, node_order: 2 },
        { node_type: '举证', node_name: '举证期', deadline_days: 15, node_order: 3 },
        { node_type: '开庭', node_name: '开庭审理', deadline_days: 15, node_order: 4 },
        { node_type: '调解', node_name: '调解', deadline_days: 10, node_order: 5 },
        { node_type: '判决', node_name: '仲裁裁决', deadline_days: 15, node_order: 6 }
      ]
    });

    console.log('\n✓ 所有默认模板创建完成！');
  } catch (error) {
    console.error('\n✗ 操作失败:', error.message);
    process.exit(1);
  }
}

main();
