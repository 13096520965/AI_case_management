const { query, run, get } = require("../config/database");

/**
 * Case 模型 - 案件管理
 */
class Case {
  /**
   * 创建案件
   * @param {Object} caseData - 案件数据
   * @returns {Promise<number>} 新创建案件的 ID
   */
  static async create(caseData) {
    const {
      case_number,
      internal_number,
      case_type,
      case_cause,
      court,
      target_amount,
      filing_date,
      status = "立案",
      team_id,
      case_result,
      industry_segment,
      handler,
      is_external_agent,
      law_firm_name,
      agent_lawyer,
      agent_contact,
      case_background
    } = caseData;

    const { beijingNow } = require("../utils/time");
    // 更鲁棒的构建列与参数，避免列/值不匹配导致的 SQLITE_ERROR
    const now = beijingNow();
    const columns = [
      'case_number', 'internal_number', 'case_type', 'case_cause',
      'court', 'target_amount', 'filing_date', 'status', 'team_id', 'case_result', 'industry_segment',
      'handler', 'is_external_agent', 'law_firm_name', 'agent_lawyer', 'agent_contact',
      'case_background', 'created_at', 'updated_at'
    ];

    const values = [
      case_number ?? null,
      internal_number ?? null,
      case_type ?? null,
      case_cause ?? null,
      court ?? null,
      target_amount ?? null,
      filing_date ?? null,
      status ?? 'active',
      team_id ?? null,
      case_result ?? null,
      industry_segment ?? null,
      handler ?? null,
      is_external_agent ?? 0,
      law_firm_name ?? null,
      agent_lawyer ?? null,
      agent_contact ?? null,
      case_background ?? null,
      now,
      now
    ];

    if (columns.length !== values.length) {
      throw new Error(`列与值长度不匹配：columns=${columns.length}, values=${values.length}`);
    }

    const placeholders = values.map(() => '?').join(', ');
    const sql = `INSERT INTO cases (${columns.join(', ')}) VALUES (${placeholders})`;

    try {
      const result = await run(sql, values);
      return result.lastID;
    } catch (err) {
      // 带上 SQL 与参数长度以便诊断
      err.message = `执行插入案件失败: ${err.message}`;
      console.error(err);
      throw err;
    }
  }

  /**
   * 根据 ID 获取案件
   * @param {number} id - 案件 ID
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findById(id) {
    const sql = "SELECT * FROM cases WHERE id = ?";
    return await get(sql, [id]);
  }

  /**
   * 根据 ID 获取案件（包含主体信息，按类型分组，包含历史案件数量）
   * @param {number} id - 案件 ID
   * @returns {Promise<Object|null>} 案件对象（包含 plaintiffs, defendants, third_parties）
   */
  static async findByIdWithParties(id) {
    // 获取案件基本信息
    const caseData = await get("SELECT * FROM cases WHERE id = ?", [id]);
    
    if (!caseData) {
      return null;
    }

    // 获取该案件的所有主体信息，按类型分组
    const partiesSql = `
      SELECT 
        lp.*,
        (
          SELECT COUNT(DISTINCT lp2.case_id) 
          FROM litigation_parties lp2 
          WHERE lp2.name = lp.name
        ) as case_count
      FROM litigation_parties lp
      WHERE lp.case_id = ?
      ORDER BY lp.party_type, lp.created_at ASC
    `;
    
    const parties = await query(partiesSql, [id]);

    // 按类型分组
    const plaintiffs = parties.filter(p => p.party_type === '原告');
    const defendants = parties.filter(p => p.party_type === '被告');
    const third_parties = parties.filter(p => p.party_type === '第三人');

    return {
      ...caseData,
      plaintiffs,
      defendants,
      third_parties
    };
  }

  /**
   * 获取所有案件（支持分页和筛选）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 案件列表
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      case_type,
      search,
      party_name,
      partyName,
      handler,
      industry_segment,
    } = options;

    // 支持 party_name 和 partyName 两种参数名
    const partyNameFilter = party_name || partyName;

    let sql = "SELECT DISTINCT c.* FROM cases c";
    const params = [];

    // 如果搜索当事人，需要 JOIN litigation_parties 表
    if (partyNameFilter) {
      sql += " LEFT JOIN litigation_parties lp ON c.id = lp.case_id";
    }

    // 如果搜索承接人，需要 JOIN users 表
    if (handler) {
      sql += " LEFT JOIN users u ON c.team_id = u.id";
    }

    sql += " WHERE 1=1";

    if (status) {
      sql += " AND c.status = ?";
      params.push(status);
    }

    if (case_type) {
      sql += " AND c.case_type = ?";
      params.push(case_type);
    }

    if (industry_segment) {
      sql += " AND c.industry_segment = ?";
      params.push(industry_segment);
    }

    if (search) {
      sql +=
        " AND (c.internal_number LIKE ? OR c.case_number LIKE ? OR c.case_cause LIKE ? OR c.court LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 按当事人姓名/名称搜索
    if (partyNameFilter) {
      sql += " AND lp.name LIKE ?";
      params.push(`%${partyNameFilter}%`);
    }

    // 按承接人姓名搜索
    if (handler) {
      sql += " AND (u.username LIKE ? OR u.real_name LIKE ?)";
      const handlerPattern = `%${handler}%`;
      params.push(handlerPattern, handlerPattern);
    }

    sql += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 获取所有案件（包含主体信息，按类型分组）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 案件列表（包含 plaintiffs, defendants, third_parties）
   */
  static async findAllWithParties(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      case_type,
      search,
      party_name,
      partyName,
      handler,
      industry_segment,
    } = options;

    // 支持 party_name 和 partyName 两种参数名
    const partyNameFilter = party_name || partyName;

    // 首先获取符合条件的案件ID列表
    let caseSql = "SELECT DISTINCT c.id FROM cases c";
    const caseParams = [];

    // 如果搜索当事人，需要 JOIN litigation_parties 表
    if (partyNameFilter) {
      caseSql += " LEFT JOIN litigation_parties lp ON c.id = lp.case_id";
    }

    // 如果搜索承接人，需要 JOIN users 表
    if (handler) {
      caseSql += " LEFT JOIN users u ON c.team_id = u.id";
    }

    caseSql += " WHERE 1=1";

    if (status) {
      caseSql += " AND c.status = ?";
      caseParams.push(status);
    }

    if (case_type) {
      caseSql += " AND c.case_type = ?";
      caseParams.push(case_type);
    }

    if (industry_segment) {
      caseSql += " AND c.industry_segment = ?";
      caseParams.push(industry_segment);
    }

    if (search) {
      caseSql +=
        " AND (c.internal_number LIKE ? OR c.case_number LIKE ? OR c.case_cause LIKE ? OR c.court LIKE ?)";
      const searchPattern = `%${search}%`;
      caseParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 按当事人姓名/名称搜索
    if (partyNameFilter) {
      caseSql += " AND lp.name LIKE ?";
      caseParams.push(`%${partyNameFilter}%`);
    }

    // 按承接人姓名搜索
    if (handler) {
      caseSql += " AND (u.username LIKE ? OR u.real_name LIKE ?)";
      const handlerPattern = `%${handler}%`;
      caseParams.push(handlerPattern, handlerPattern);
    }

    caseSql += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
    caseParams.push(limit, (page - 1) * limit);

    const caseIds = await query(caseSql, caseParams);
    
    if (caseIds.length === 0) {
      return [];
    }

    // 获取这些案件的完整信息和主体信息
    const ids = caseIds.map(c => c.id);
    const placeholders = ids.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        c.*,
        GROUP_CONCAT(
          CASE WHEN lp.party_type = '原告' 
          THEN json_object(
            'id', lp.id, 
            'name', lp.name, 
            'entity_type', lp.entity_type,
              'contact_phone', lp.contact_phone,
              'unified_credit_code', lp.unified_credit_code,
              'id_number', lp.id_number,
              'address', lp.address,
              'is_primary', COALESCE(lp.is_primary, 0)
          )
          END
        ) as plaintiffs_json,
        GROUP_CONCAT(
          CASE WHEN lp.party_type = '被告' 
          THEN json_object(
            'id', lp.id, 
            'name', lp.name, 
            'entity_type', lp.entity_type,
              'contact_phone', lp.contact_phone,
              'unified_credit_code', lp.unified_credit_code,
              'id_number', lp.id_number,
              'address', lp.address,
              'is_primary', COALESCE(lp.is_primary, 0)
          )
          END
        ) as defendants_json,
        GROUP_CONCAT(
          CASE WHEN lp.party_type = '第三人' 
          THEN json_object(
            'id', lp.id, 
            'name', lp.name, 
            'entity_type', lp.entity_type,
              'contact_phone', lp.contact_phone,
              'unified_credit_code', lp.unified_credit_code,
              'id_number', lp.id_number,
              'address', lp.address,
              'is_primary', COALESCE(lp.is_primary, 0)
          )
          END
        ) as third_parties_json
      FROM cases c
      LEFT JOIN litigation_parties lp ON c.id = lp.case_id
      WHERE c.id IN (${placeholders})
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const cases = await query(sql, ids);

    // 解析JSON字符串为对象数组
    // GROUP_CONCAT 使用逗号分隔多个JSON对象，但JSON对象内部也有逗号
    // 所以我们需要更智能的解析方式
    return cases.map(c => {
      const parseGroupConcatJson = (jsonStr) => {
        if (!jsonStr || jsonStr.trim() === '') {
          return [];
        }
        
        // 尝试解析为单个JSON对象
        try {
          const single = JSON.parse(jsonStr);
          return [single];
        } catch (e) {
          // 如果失败，说明是多个JSON对象用逗号连接
          // 我们需要找到JSON对象的边界
          const objects = [];
          let depth = 0;
          let start = 0;
          
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') {
              if (depth === 0) start = i;
              depth++;
            } else if (jsonStr[i] === '}') {
              depth--;
              if (depth === 0) {
                try {
                  const obj = JSON.parse(jsonStr.substring(start, i + 1));
                  objects.push(obj);
                } catch (parseError) {
                  // 忽略解析错误
                }
              }
            }
          }
          
          return objects;
        }
      };

      const plaintiffs = parseGroupConcatJson(c.plaintiffs_json);
      const defendants = parseGroupConcatJson(c.defendants_json);
      const third_parties = parseGroupConcatJson(c.third_parties_json);

      // 移除临时的JSON字段
      delete c.plaintiffs_json;
      delete c.defendants_json;
      delete c.third_parties_json;

      return {
        ...c,
        plaintiffs,
        defendants,
        third_parties
      };
    });
  }

  /**
   * 更新案件
   * @param {number} id - 案件 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    const { beijingNow } = require("../utils/time");
    fields.push("updated_at = ?");
    params.push(beijingNow());
    params.push(id);

    const sql = `UPDATE cases SET ${fields.join(", ")} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除案件
   * @param {number} id - 案件 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = "DELETE FROM cases WHERE id = ?";
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 统计案件数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 案件数量
   */
  static async count(filters = {}) {
    // 支持 party_name 和 partyName 两种参数名
    const partyNameFilter = filters.party_name || filters.partyName;

    let sql = "SELECT COUNT(DISTINCT c.id) as count FROM cases c";
    const params = [];

    // 如果搜索当事人，需要 JOIN litigation_parties 表
    if (partyNameFilter) {
      sql += " LEFT JOIN litigation_parties lp ON c.id = lp.case_id";
    }

    // 如果搜索承接人，需要 JOIN users 表
    if (filters.handler) {
      sql += " LEFT JOIN users u ON c.team_id = u.id";
    }

    sql += " WHERE 1=1";

    if (filters.status) {
      sql += " AND c.status = ?";
      params.push(filters.status);
    }

    if (filters.case_type) {
      sql += " AND c.case_type = ?";
      params.push(filters.case_type);
    }

    if (filters.industry_segment) {
      sql += " AND c.industry_segment = ?";
      params.push(filters.industry_segment);
    }

    if (filters.search) {
      sql +=
        " AND (c.internal_number LIKE ? OR c.case_number LIKE ? OR c.case_cause LIKE ? OR c.court LIKE ?)";
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 按当事人姓名/名称搜索
    if (partyNameFilter) {
      sql += " AND lp.name LIKE ?";
      params.push(`%${partyNameFilter}%`);
    }

    // 按承接人姓名搜索
    if (filters.handler) {
      sql += " AND (u.username LIKE ? OR u.real_name LIKE ?)";
      const handlerPattern = `%${filters.handler}%`;
      params.push(handlerPattern, handlerPattern);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * 根据案号查找案件
   * @param {string} caseNumber - 案号
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findByCaseNumber(caseNumber) {
    const sql = "SELECT * FROM cases WHERE case_number = ?";
    return await get(sql, [caseNumber]);
  }

  /**
   * 根据内部编号查找案件
   * @param {string} internalNumber - 内部编号
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findByInternalNumber(internalNumber) {
    const sql = "SELECT * FROM cases WHERE internal_number = ?";
    return await get(sql, [internalNumber]);
  }

  /**
   * 查找指定前缀的最后一个案件（用于生成编号）
   * @param {string} prefix - 编号前缀
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findLastByPrefix(prefix) {
    const sql = `
      SELECT * FROM cases 
      WHERE internal_number LIKE ? 
      ORDER BY internal_number DESC 
      LIMIT 1
    `;
    return await get(sql, [`${prefix}%`]);
  }

  /**
   * 添加操作日志
   * @param {number} caseId - 案件 ID
   * @param {string} operator - 操作人
   * @param {string} action - 操作内容
   * @param {string} actionType - 操作类型（可选，默认为 'MANUAL_ACTION'）
   * @returns {Promise<number>} 日志 ID
   */
  static async addLog(caseId, operator, action, actionType = "MANUAL_ACTION") {
    const { beijingNow } = require("../utils/time");
    const timestamp = beijingNow();
    const sql = `
      INSERT INTO case_logs (case_id, action_type, action_description, operator_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [
      caseId,
      actionType,
      action,
      operator,
      timestamp,
    ]);
    return result.lastID;
  }

  /**
   * 获取案件操作日志
   * @param {number} caseId - 案件 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 日志列表
   */
  static async getLogs(caseId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        id,
        operator_name as operator,
        action_description as action,
        created_at
      FROM case_logs
      WHERE case_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [caseId, limit, offset]);
  }

  /**
   * 统计案件日志数量
   * @param {number} caseId - 案件 ID
   * @returns {Promise<number>} 日志数量
   */
  static async countLogs(caseId) {
    const sql = "SELECT COUNT(*) as count FROM case_logs WHERE case_id = ?";
    const result = await get(sql, [caseId]);
    return result ? result.count : 0;
  }
}

module.exports = Case;
