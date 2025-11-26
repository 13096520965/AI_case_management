/**
 * 案件日志记录工具
 * 统一的日志记录接口，用于记录所有案件相关操作
 */

const { run } = require('../config/database');

/**
 * 操作类型常量
 */
const ACTION_TYPES = {
  // 案件操作
  CREATE_CASE: 'CREATE_CASE',
  UPDATE_CASE: 'UPDATE_CASE',
  DELETE_CASE: 'DELETE_CASE',
  VIEW_CASE: 'VIEW_CASE',
  
  // 诉讼主体操作
  ADD_PARTY: 'ADD_PARTY',
  UPDATE_PARTY: 'UPDATE_PARTY',
  DELETE_PARTY: 'DELETE_PARTY',
  
  // 证据操作
  ADD_EVIDENCE: 'ADD_EVIDENCE',
  UPDATE_EVIDENCE: 'UPDATE_EVIDENCE',
  DELETE_EVIDENCE: 'DELETE_EVIDENCE',
  DOWNLOAD_EVIDENCE: 'DOWNLOAD_EVIDENCE',
  
  // 文书操作
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',
  GENERATE_DOCUMENT: 'GENERATE_DOCUMENT',
  
  // 流程操作
  ADD_PROCESS_NODE: 'ADD_PROCESS_NODE',
  UPDATE_PROCESS_NODE: 'UPDATE_PROCESS_NODE',
  DELETE_PROCESS_NODE: 'DELETE_PROCESS_NODE',
  COMPLETE_PROCESS_NODE: 'COMPLETE_PROCESS_NODE',
  
  // 成本操作
  ADD_COST: 'ADD_COST',
  UPDATE_COST: 'UPDATE_COST',
  DELETE_COST: 'DELETE_COST',
  
  // 状态变更
  STATUS_CHANGE: 'STATUS_CHANGE',
  
  // 其他操作
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA'
};

/**
 * 记录案件操作日志
 * @param {Object} options - 日志选项
 * @param {number} options.caseId - 案件ID
 * @param {string} options.actionType - 操作类型
 * @param {string} options.actionDescription - 操作描述
 * @param {number} [options.operatorId] - 操作人ID
 * @param {string} [options.operatorName] - 操作人姓名
 * @param {string} [options.ipAddress] - IP地址
 * @param {string} [options.userAgent] - 用户代理
 * @param {Object} [options.relatedData] - 相关数据
 * @returns {Promise<number>} 日志ID
 */
async function logCaseAction(options) {
  const {
    caseId,
    actionType,
    actionDescription,
    operatorId = null,
    operatorName = null,
    ipAddress = null,
    userAgent = null,
    relatedData = null
  } = options;

  // 验证必填参数
  if (!caseId || !actionType || !actionDescription) {
    throw new Error('caseId, actionType 和 actionDescription 为必填参数');
  }

  try {
    const sql = `
      INSERT INTO case_logs (
        case_id, action_type, action_description, operator_id, 
        operator_name, ip_address, user_agent, related_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const { beijingNow } = require('../utils/time');
    const result = await run(sql, [
      parseInt(caseId),
      actionType,
      actionDescription,
      operatorId,
      operatorName,
      ipAddress,
      userAgent,
      relatedData ? JSON.stringify(relatedData) : null,
      beijingNow()
    ]);

    return result.lastID;
  } catch (error) {
    console.error('记录案件日志失败:', error);
    throw error;
  }
}

/**
 * 从请求对象中提取日志信息
 * @param {Object} req - Express 请求对象
 * @returns {Object} 日志信息
 */
function extractLogInfo(req) {
  return {
    operatorId: req.user?.id || null,
    operatorName: req.user?.username || req.user?.real_name || '系统',
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.get('user-agent') || null
  };
}

/**
 * 构建操作描述
 * @param {string} action - 操作动作
 * @param {string} target - 操作目标
 * @param {Object} [details] - 详细信息
 * @returns {string} 操作描述
 */
function buildActionDescription(action, target, details = {}) {
  let description = `${action}${target}`;
  
  if (details && Object.keys(details).length > 0) {
    const detailStr = Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    description += ` (${detailStr})`;
  }
  
  return description;
}

/**
 * 记录案件创建
 */
async function logCaseCreate(caseId, caseInfo, req) {
  const logInfo = extractLogInfo(req);
  const description = buildActionDescription(
    '创建案件',
    '',
    {
      案号: caseInfo.case_number || caseInfo.internal_number,
      案件类型: caseInfo.case_type
    }
  );

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.CREATE_CASE,
    actionDescription: description,
    ...logInfo,
    relatedData: {
      case_number: caseInfo.case_number,
      case_type: caseInfo.case_type,
      case_cause: caseInfo.case_cause
    }
  });
}

/**
 * 记录案件更新
 */
async function logCaseUpdate(caseId, changes, req) {
  const logInfo = extractLogInfo(req);
  const changedFields = Object.keys(changes).join('、');
  const description = buildActionDescription('更新案件信息', '', { 修改字段: changedFields });

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.UPDATE_CASE,
    actionDescription: description,
    ...logInfo,
    relatedData: { changes }
  });
}

/**
 * 记录诉讼主体添加
 */
async function logPartyAdd(caseId, partyInfo, req) {
  const logInfo = extractLogInfo(req);
  const description = buildActionDescription(
    '添加诉讼主体',
    '',
    {
      主体身份: partyInfo.party_type,
      名称: partyInfo.name
    }
  );

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.ADD_PARTY,
    actionDescription: description,
    ...logInfo,
    relatedData: {
      party_type: partyInfo.party_type,
      name: partyInfo.name,
      entity_type: partyInfo.entity_type
    }
  });
}

/**
 * 记录诉讼主体更新
 */
async function logPartyUpdate(caseId, partyInfo, changes, req) {
  const logInfo = extractLogInfo(req);
  const changedFields = Object.keys(changes).join('、');
  const description = buildActionDescription(
    '更新诉讼主体',
    partyInfo.name,
    { 修改字段: changedFields }
  );

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.UPDATE_PARTY,
    actionDescription: description,
    ...logInfo,
    relatedData: { party_name: partyInfo.name, changes }
  });
}

/**
 * 记录诉讼主体删除
 */
async function logPartyDelete(caseId, partyInfo, req) {
  const logInfo = extractLogInfo(req);
  const description = buildActionDescription(
    '删除诉讼主体',
    '',
    {
      主体身份: partyInfo.party_type,
      名称: partyInfo.name
    }
  );

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.DELETE_PARTY,
    actionDescription: description,
    ...logInfo,
    relatedData: {
      party_type: partyInfo.party_type,
      name: partyInfo.name
    }
  });
}

/**
 * 记录证据操作
 */
async function logEvidenceAction(caseId, actionType, evidenceInfo, req) {
  const logInfo = extractLogInfo(req);
  const actionMap = {
    [ACTION_TYPES.ADD_EVIDENCE]: '添加证据',
    [ACTION_TYPES.UPDATE_EVIDENCE]: '更新证据',
    [ACTION_TYPES.DELETE_EVIDENCE]: '删除证据',
    [ACTION_TYPES.DOWNLOAD_EVIDENCE]: '下载证据'
  };

  const description = buildActionDescription(
    actionMap[actionType] || '操作证据',
    '',
    {
      证据名称: evidenceInfo.evidence_name,
      证据类型: evidenceInfo.evidence_type
    }
  );

  return logCaseAction({
    caseId,
    actionType,
    actionDescription: description,
    ...logInfo,
    relatedData: {
      evidence_name: evidenceInfo.evidence_name,
      evidence_type: evidenceInfo.evidence_type
    }
  });
}

/**
 * 记录状态变更
 */
async function logStatusChange(caseId, oldStatus, newStatus, req) {
  const logInfo = extractLogInfo(req);
  const description = `案件状态变更: ${oldStatus} → ${newStatus}`;

  return logCaseAction({
    caseId,
    actionType: ACTION_TYPES.STATUS_CHANGE,
    actionDescription: description,
    ...logInfo,
    relatedData: {
      old_status: oldStatus,
      new_status: newStatus
    }
  });
}

module.exports = {
  ACTION_TYPES,
  logCaseAction,
  extractLogInfo,
  buildActionDescription,
  logCaseCreate,
  logCaseUpdate,
  logPartyAdd,
  logPartyUpdate,
  logPartyDelete,
  logEvidenceAction,
  logStatusChange
};
