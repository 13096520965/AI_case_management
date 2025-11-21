const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTemplateUpdate() {
  try {
    console.log('=== 测试流程模板更新 ===\n');
    
    // 1. 登录
    console.log('1. 登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功\n');
    
    // 2. 获取模板列表
    console.log('2. 获取模板列表...');
    const templatesResponse = await axios.get(`${BASE_URL}/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const templates = templatesResponse.data.data?.templates || templatesResponse.data.data || [];
    if (templates.length === 0) {
      console.log('没有找到模板，先创建一个测试模板');
      
      // 创建测试模板
      const createResponse = await axios.post(`${BASE_URL}/templates`, {
        template_name: '测试模板',
        case_type: '民事',
        description: '这是一个测试模板',
        nodes: [
          {
            node_name: '立案',
            node_type: '立案',
            deadline_days: 7,
            node_order: 1
          },
          {
            node_name: '送达',
            node_type: '送达',
            deadline_days: 15,
            node_order: 2
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✓ 创建测试模板成功\n');
      
      // 重新获取模板列表
      const newTemplatesResponse = await axios.get(`${BASE_URL}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      templates.push(...(newTemplatesResponse.data.data?.templates || newTemplatesResponse.data.data || []));
    }
    
    const firstTemplate = templates[0];
    console.log(`✓ 找到模板 ID: ${firstTemplate.id}, 名称: ${firstTemplate.template_name}\n`);
    
    // 3. 获取模板详情
    console.log('3. 获取模板详情...');
    const detailResponse = await axios.get(`${BASE_URL}/templates/${firstTemplate.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const templateDetail = detailResponse.data.data?.template || detailResponse.data.data;
    console.log('模板详情:');
    console.log(`  名称: ${templateDetail.template_name}`);
    console.log(`  类型: ${templateDetail.case_type}`);
    console.log(`  节点数: ${templateDetail.nodes?.length || 0}\n`);
    
    // 4. 更新模板
    console.log('4. 更新模板...');
    const updateData = {
      template_name: templateDetail.template_name + ' (已更新)',
      case_type: templateDetail.case_type,
      description: '这是更新后的描述',
      nodes: [
        {
          node_name: '立案',
          node_type: '立案',
          deadline_days: 7,
          node_order: 1
        },
        {
          node_name: '送达',
          node_type: '送达',
          deadline_days: 15,
          node_order: 2
        },
        {
          node_name: '开庭',
          node_type: '开庭',
          deadline_days: 30,
          node_order: 3
        }
      ]
    };
    
    const updateResponse = await axios.put(
      `${BASE_URL}/templates/${firstTemplate.id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ 更新成功\n');
    
    // 5. 验证更新结果
    console.log('5. 验证更新结果...');
    const verifyResponse = await axios.get(`${BASE_URL}/templates/${firstTemplate.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedTemplate = verifyResponse.data.data?.template || verifyResponse.data.data;
    console.log('更新后的模板:');
    console.log(`  名称: ${updatedTemplate.template_name}`);
    console.log(`  描述: ${updatedTemplate.description}`);
    console.log(`  节点数: ${updatedTemplate.nodes?.length || 0}`);
    if (updatedTemplate.nodes) {
      updatedTemplate.nodes.forEach((node, index) => {
        console.log(`    节点${index + 1}: ${node.node_name} (${node.node_type})`);
      });
    }
    
    console.log('\n✓ 测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTemplateUpdate();
