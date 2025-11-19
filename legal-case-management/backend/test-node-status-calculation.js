/**
 * 测试节点状态计算逻辑
 * 
 * 此脚本测试以下功能：
 * 1. 计算节点是否超期
 * 2. 自动更新节点状态（待处理/进行中/已完成/超期）
 */

const ProcessNodeService = require('./src/services/processNodeService');

console.log('=== 测试节点状态计算逻辑 ===\n');

// 测试用例 1: 已完成的节点
console.log('测试用例 1: 已完成的节点');
const completedNode = {
  id: 1,
  case_id: 1,
  node_name: '立案',
  start_time: '2024-01-01 09:00:00',
  deadline: '2024-01-10 17:00:00',
  completion_time: '2024-01-08 15:00:00',
  status: 'in_progress'
};
const status1 = ProcessNodeService.calculateNodeStatus(completedNode);
console.log(`输入: 有完成时间 (${completedNode.completion_time})`);
console.log(`期望状态: completed`);
console.log(`计算状态: ${status1}`);
console.log(`结果: ${status1 === 'completed' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试用例 2: 超期的节点
console.log('测试用例 2: 超期的节点');
const overdueNode = {
  id: 2,
  case_id: 1,
  node_name: '开庭审理',
  start_time: '2024-01-01 09:00:00',
  deadline: '2024-01-05 17:00:00',
  completion_time: null,
  status: 'in_progress'
};
const status2 = ProcessNodeService.calculateNodeStatus(overdueNode);
console.log(`输入: 截止日期 ${overdueNode.deadline} (已过期)`);
console.log(`期望状态: overdue`);
console.log(`计算状态: ${status2}`);
console.log(`结果: ${status2 === 'overdue' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试用例 3: 进行中的节点
console.log('测试用例 3: 进行中的节点');
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 10);
const inProgressNode = {
  id: 3,
  case_id: 1,
  node_name: '证据交换',
  start_time: new Date().toISOString(),
  deadline: futureDate.toISOString(),
  completion_time: null,
  status: 'pending'
};
const status3 = ProcessNodeService.calculateNodeStatus(inProgressNode);
console.log(`输入: 有开始时间，截止日期未到 (${futureDate.toISOString().split('T')[0]})`);
console.log(`期望状态: in_progress`);
console.log(`计算状态: ${status3}`);
console.log(`结果: ${status3 === 'in_progress' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试用例 4: 待处理的节点
console.log('测试用例 4: 待处理的节点');
const pendingNode = {
  id: 4,
  case_id: 1,
  node_name: '判决执行',
  start_time: null,
  deadline: futureDate.toISOString(),
  completion_time: null,
  status: 'pending'
};
const status4 = ProcessNodeService.calculateNodeStatus(pendingNode);
console.log(`输入: 无开始时间，截止日期未到`);
console.log(`期望状态: pending`);
console.log(`计算状态: ${status4}`);
console.log(`结果: ${status4 === 'pending' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试用例 5: 无截止日期但已开始的节点
console.log('测试用例 5: 无截止日期但已开始的节点');
const noDeadlineInProgressNode = {
  id: 5,
  case_id: 1,
  node_name: '调解',
  start_time: new Date().toISOString(),
  deadline: null,
  completion_time: null,
  status: 'pending'
};
const status5 = ProcessNodeService.calculateNodeStatus(noDeadlineInProgressNode);
console.log(`输入: 有开始时间，无截止日期`);
console.log(`期望状态: in_progress`);
console.log(`计算状态: ${status5}`);
console.log(`结果: ${status5 === 'in_progress' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试用例 6: 无截止日期且未开始的节点
console.log('测试用例 6: 无截止日期且未开始的节点');
const noDeadlinePendingNode = {
  id: 6,
  case_id: 1,
  node_name: '归档',
  start_time: null,
  deadline: null,
  completion_time: null,
  status: 'pending'
};
const status6 = ProcessNodeService.calculateNodeStatus(noDeadlinePendingNode);
console.log(`输入: 无开始时间，无截止日期`);
console.log(`期望状态: pending`);
console.log(`计算状态: ${status6}`);
console.log(`结果: ${status6 === 'pending' ? '✓ 通过' : '✗ 失败'}\n`);

// 测试超期检查功能
console.log('=== 测试超期检查功能 ===\n');

console.log('测试用例 7: 检查超期节点');
const overdueInfo = ProcessNodeService.checkNodeOverdue(overdueNode);
console.log(`节点: ${overdueNode.node_name}`);
console.log(`截止日期: ${overdueNode.deadline}`);
console.log(`是否超期: ${overdueInfo.isOverdue}`);
console.log(`超期天数: ${overdueInfo.overdueDays}`);
console.log(`结果: ${overdueInfo.isOverdue && overdueInfo.overdueDays > 0 ? '✓ 通过' : '✗ 失败'}\n`);

console.log('测试用例 8: 检查未超期节点');
const notOverdueInfo = ProcessNodeService.checkNodeOverdue(inProgressNode);
console.log(`节点: ${inProgressNode.node_name}`);
console.log(`截止日期: ${inProgressNode.deadline}`);
console.log(`是否超期: ${notOverdueInfo.isOverdue}`);
console.log(`超期天数: ${notOverdueInfo.overdueDays}`);
console.log(`结果: ${!notOverdueInfo.isOverdue && notOverdueInfo.overdueDays === 0 ? '✓ 通过' : '✗ 失败'}\n`);

console.log('测试用例 9: 检查已完成节点（不应超期）');
const completedOverdueInfo = ProcessNodeService.checkNodeOverdue(completedNode);
console.log(`节点: ${completedNode.node_name}`);
console.log(`完成时间: ${completedNode.completion_time}`);
console.log(`是否超期: ${completedOverdueInfo.isOverdue}`);
console.log(`结果: ${!completedOverdueInfo.isOverdue ? '✓ 通过' : '✗ 失败'}\n`);

console.log('=== 所有测试完成 ===');
