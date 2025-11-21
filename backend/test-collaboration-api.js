const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';
let testUserId = null;
let testCaseId = null;
let testMemberId = null;
let testTaskId = null;

/**
 * 测试协作管理 API
 */
async function testCollaborationAPI() {
  console.log('=== 开始测试协作管理 API ===\n');

  try {
    // 1. 登录获取 token
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = loginResponse.data.data.token;
    testUserId = loginResponse.data.data.user.id;
    console.log('✓ 登录成功');
    console.log(`  Token: ${authToken.substring(0, 20)}...`);
    console.log(`  User ID: ${testUserId}\n`);

    // 2. 创建测试案件
    console.log('2. 创建测试案件...');
    const uniqueCaseNumber = `TEST-COLLAB-${Date.now()}`;
    const caseResponse = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_number: uniqueCaseNumber,
        case_type: '民事案件',
        case_cause: '协作测试案件',
        court: '测试法院',
        target_amount: 100000,
        filing_date: '2024-01-01',
        status: 'active'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = caseResponse.data.data.case.id;
    console.log('✓ 案件创建成功');
    console.log(`  案件 ID: ${testCaseId}\n`);

    // 3. 添加协作成员
    console.log('3. 添加协作成员...');
    const memberResponse = await axios.post(
      `${BASE_URL}/collaboration/cases/${testCaseId}/members`,
      {
        user_id: testUserId,
        role: 'lawyer',
        permissions: {
          canEdit: true,
          canDelete: false,
          canViewEvidence: true
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testMemberId = memberResponse.data.data.id;
    console.log('✓ 协作成员添加成功');
    console.log(`  成员 ID: ${testMemberId}`);
    console.log(`  角色: ${memberResponse.data.data.role}\n`);

    // 4. 获取协作成员列表
    console.log('4. 获取协作成员列表...');
    const membersResponse = await axios.get(
      `${BASE_URL}/collaboration/cases/${testCaseId}/members`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取成员列表成功');
    console.log(`  成员数量: ${membersResponse.data.total}`);
    console.log(`  成员信息:`, JSON.stringify(membersResponse.data.data, null, 2));
    console.log();

    // 5. 更新协作成员
    console.log('5. 更新协作成员...');
    await axios.put(
      `${BASE_URL}/collaboration/members/${testMemberId}`,
      {
        role: 'senior_lawyer',
        permissions: {
          canEdit: true,
          canDelete: true,
          canViewEvidence: true,
          canManageMembers: true
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 协作成员更新成功\n');

    // 6. 创建协作任务
    console.log('6. 创建协作任务...');
    const taskResponse = await axios.post(
      `${BASE_URL}/collaboration/tasks`,
      {
        case_id: testCaseId,
        task_title: '准备起诉状',
        task_description: '根据案件材料准备起诉状初稿',
        assigned_to: testUserId,
        priority: 'high',
        due_date: '2024-12-31'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testTaskId = taskResponse.data.data.id;
    console.log('✓ 协作任务创建成功');
    console.log(`  任务 ID: ${testTaskId}`);
    console.log(`  任务标题: ${taskResponse.data.data.task_title}\n`);

    // 7. 获取案件的协作任务列表
    console.log('7. 获取案件的协作任务列表...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/collaboration/cases/${testCaseId}/tasks`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取任务列表成功');
    console.log(`  任务数量: ${tasksResponse.data.total}`);
    console.log(`  任务信息:`, JSON.stringify(tasksResponse.data.data, null, 2));
    console.log();

    // 8. 获取用户的所有任务
    console.log('8. 获取用户的所有任务...');
    const myTasksResponse = await axios.get(
      `${BASE_URL}/collaboration/tasks/my-tasks`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取用户任务列表成功');
    console.log(`  任务数量: ${myTasksResponse.data.total}\n`);

    // 9. 更新协作任务
    console.log('9. 更新协作任务状态...');
    await axios.put(
      `${BASE_URL}/collaboration/tasks/${testTaskId}`,
      {
        status: 'in_progress',
        priority: 'urgent'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 协作任务更新成功\n');

    // 10. 再次更新任务为已完成
    console.log('10. 更新任务为已完成...');
    await axios.put(
      `${BASE_URL}/collaboration/tasks/${testTaskId}`,
      {
        status: 'completed'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 任务标记为已完成\n');

    // 11. 删除协作任务
    console.log('11. 删除协作任务...');
    await axios.delete(
      `${BASE_URL}/collaboration/tasks/${testTaskId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 协作任务删除成功\n');

    // 12. 移除协作成员
    console.log('12. 移除协作成员...');
    await axios.delete(
      `${BASE_URL}/collaboration/members/${testMemberId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 协作成员移除成功\n');

    // 13. 清理测试数据 - 删除测试案件
    console.log('13. 清理测试数据...');
    await axios.delete(
      `${BASE_URL}/cases/${testCaseId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 测试案件删除成功\n');

    console.log('=== 所有测试通过！ ===');
  } catch (error) {
    console.error('\n✗ 测试失败:');
    if (error.response) {
      console.error(`  状态码: ${error.response.status}`);
      console.error(`  错误信息:`, error.response.data);
    } else {
      console.error(`  错误信息: ${error.message}`);
    }
    process.exit(1);
  }
}

// 运行测试
testCollaborationAPI();
