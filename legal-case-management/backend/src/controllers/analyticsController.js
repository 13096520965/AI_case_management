const { query, get } = require('../config/database');

/**
 * 获取驾驶舱数据统计
 * GET /api/analytics/dashboard
 */
exports.getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate, caseType, partyName, caseId, costType, paymentStatus } = req.query;
    
    // 构建基础查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    let joinClause = '';
    
    // 如果有主体名称搜索，需要关联诉讼主体表
    if (partyName) {
      joinClause = ' INNER JOIN litigation_parties lp ON cases.id = lp.case_id';
      whereClause += ' AND lp.name LIKE ?';
      params.push(`%${partyName}%`);
    }
    
    if (startDate) {
      whereClause += ' AND cases.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND cases.created_at <= ?';
      params.push(endDate);
    }
    
    if (caseType) {
      whereClause += ' AND cases.case_type = ?';
      params.push(caseType);
    }

    // 1. 统计案件总量
    const totalCasesResult = await get(`SELECT COUNT(DISTINCT cases.id) as total FROM cases ${joinClause} ${whereClause}`, params);
    const totalCases = totalCasesResult.total;

    // 2. 统计标的额总计
    const targetAmountResult = await get(`SELECT SUM(DISTINCT cases.target_amount) as total FROM cases ${joinClause} ${whereClause} AND cases.target_amount IS NOT NULL`, params);
    const totalTargetAmount = targetAmountResult.total || 0;

    // 3. 计算平均胜诉率
    const wonCasesResult = await get(`SELECT COUNT(DISTINCT cases.id) as count FROM cases ${joinClause} ${whereClause} AND cases.status = 'won'`, params);
    const closedCasesResult = await get(`SELECT COUNT(DISTINCT cases.id) as count FROM cases ${joinClause} ${whereClause} AND cases.status IN ('won', 'lost', 'closed')`, params);
    const wonCases = wonCasesResult.count;
    const closedCases = closedCasesResult.count;
    const averageWinRate = closedCases > 0 ? parseFloat(((wonCases / closedCases) * 100).toFixed(2)) : 0;

    // 4. 计算平均办案周期
    const avgDurationResult = await get(`
      SELECT AVG(
        CAST((julianday(cases.updated_at) - julianday(cases.filing_date)) AS INTEGER)
      ) as avgDays
      FROM cases
      ${joinClause}
      ${whereClause}
      AND cases.status IN ('won', 'lost', 'closed')
      AND cases.filing_date IS NOT NULL
    `, params);
    const avgDuration = avgDurationResult.avgDays ? Math.round(avgDurationResult.avgDays) : 0;

    // 5. 统计案件类型分布
    const caseTypeDistribution = await query(`
      SELECT cases.case_type, COUNT(DISTINCT cases.id) as count 
      FROM cases 
      ${joinClause}
      ${whereClause} AND cases.case_type IS NOT NULL
      GROUP BY cases.case_type
      ORDER BY count DESC
    `, params);

    // 6. 统计案件状态分布
    const caseStatusDistribution = await query(`
      SELECT cases.status, COUNT(DISTINCT cases.id) as count
      FROM cases
      ${joinClause}
      ${whereClause}
      GROUP BY cases.status
      ORDER BY count DESC
    `, params);

    // 7. 生成案件数量趋势数据（按月统计最近12个月）
    const caseTrend = await query(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM cases
      WHERE created_at >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month ASC
    `);

    // 8. 标的额分布
    const amountDistribution = [
      { range: '10万以下', count: 0 },
      { range: '10-50万', count: 0 },
      { range: '50-100万', count: 0 },
      { range: '100-500万', count: 0 },
      { range: '500万以上', count: 0 }
    ];
    
    const amountData = await query(`
      SELECT DISTINCT cases.target_amount
      FROM cases
      ${joinClause}
      ${whereClause} AND cases.target_amount IS NOT NULL
    `, params);
    
    amountData.forEach(item => {
      const amount = item.target_amount;
      if (amount < 100000) amountDistribution[0].count++;
      else if (amount < 500000) amountDistribution[1].count++;
      else if (amount < 1000000) amountDistribution[2].count++;
      else if (amount < 5000000) amountDistribution[3].count++;
      else amountDistribution[4].count++;
    });

    // 9. 案由分布 TOP10
    const caseCauseDistribution = await query(`
      SELECT cases.case_cause, COUNT(DISTINCT cases.id) as count
      FROM cases
      ${joinClause}
      ${whereClause} AND cases.case_cause IS NOT NULL
      GROUP BY cases.case_cause
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // 10. 统计活跃案件数量
    const activeCasesResult = await get(`SELECT COUNT(*) as count FROM cases ${whereClause} AND status = 'active'`, params);
    const activeCases = activeCasesResult.count;

    // 11. 统计待处理节点数量
    const pendingNodesResult = await get("SELECT COUNT(*) as count FROM process_nodes WHERE status IN ('pending', 'in_progress')");
    const pendingNodes = pendingNodesResult.count;

    // 12. 统计超期节点数量
    const overdueNodesResult = await get(`
      SELECT COUNT(*) as count 
      FROM process_nodes 
      WHERE status != 'completed' 
      AND deadline < datetime('now', '+8 hours')
      AND deadline IS NOT NULL
    `);
    const overdueNodes = overdueNodesResult.count;
    
    // 13. 计算趋势（与上期对比，模拟数据）
    const casesTrend = Math.round((Math.random() - 0.5) * 20);
    const amountTrend = Math.round((Math.random() - 0.5) * 30);
    const winRateTrend = Math.round((Math.random() - 0.5) * 10);
    const durationTrend = Math.round((Math.random() - 0.5) * 15);

    // 14. 成本统计 - 构建成本查询条件
    let costWhereClause = whereClause.replace(/cases\./g, 'c.');
    const costParams = [...params];
    
    if (caseId) {
      costWhereClause += ' AND c.id = ?';
      costParams.push(caseId);
    }
    
    if (costType) {
      costWhereClause += ' AND cr.cost_type = ?';
      costParams.push(costType);
    }
    
    if (paymentStatus) {
      costWhereClause += ' AND cr.status = ?';
      costParams.push(paymentStatus);
    }

    const totalCostResult = await get(`
      SELECT SUM(amount) as total FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause}
    `, costParams);
    const totalCost = totalCostResult.total || 0;

    const paidCostResult = await get(`
      SELECT SUM(amount) as total FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause} AND cr.status = 'paid'
    `, costParams);
    const paidCost = paidCostResult.total || 0;

    const unpaidCostResult = await get(`
      SELECT SUM(amount) as total FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause} AND cr.status = 'unpaid'
    `, costParams);
    const unpaidCost = unpaidCostResult.total || 0;

    const costCountResult = await get(`
      SELECT COUNT(*) as count FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause}
    `, costParams);
    const costCount = costCountResult.count || 0;

    // 15. 成本类型分布
    const costTypeDistribution = await query(`
      SELECT cr.cost_type, SUM(cr.amount) as amount
      FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause}
      GROUP BY cr.cost_type
      ORDER BY amount DESC
    `, costParams);

    // 16. 成本支付状态分布
    const costStatusDistribution = await query(`
      SELECT cr.status, SUM(cr.amount) as amount
      FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause}
      GROUP BY cr.status
    `, costParams);

    // 17. 成本明细（按类型统计）
    const costBreakdown = await query(`
      SELECT 
        cr.cost_type,
        SUM(cr.amount) as total_amount,
        COUNT(*) as count,
        SUM(CASE WHEN cr.status = 'paid' THEN cr.amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN cr.status = 'unpaid' THEN cr.amount ELSE 0 END) as unpaid_amount
      FROM cost_records cr
      INNER JOIN cases c ON cr.case_id = c.id
      ${joinClause.replace('cases', 'c')}
      ${costWhereClause}
      GROUP BY cr.cost_type
      ORDER BY total_amount DESC
    `, costParams);

    // 计算百分比
    costBreakdown.forEach(item => {
      item.percentage = totalCost > 0 ? (item.total_amount / totalCost * 100) : 0;
    });

    res.json({
      data: {
        summary: {
          totalCases,
          totalTargetAmount: parseFloat(totalTargetAmount.toFixed(2)),
          averageWinRate,
          avgDuration,
          activeCases,
          wonCases,
          closedCases,
          casesTrend,
          amountTrend,
          winRateTrend,
          durationTrend
        },
        costSummary: {
          totalCost: parseFloat(totalCost.toFixed(2)),
          paidCost: parseFloat(paidCost.toFixed(2)),
          unpaidCost: parseFloat(unpaidCost.toFixed(2)),
          costCount
        },
        costBreakdown,
        caseTypeDistribution,
        caseStatusDistribution,
        caseTrend,
        amountDistribution,
        caseCauseDistribution,
        costTypeDistribution,
        costStatusDistribution,
        alerts: {
          pendingNodes,
          overdueNodes
        }
      }
    });
  } catch (error) {
    console.error('获取驾驶舱数据错误:', error);
    res.status(500).json({
      error: {
        message: '获取驾驶舱数据失败',
        status: 500
      }
    });
  }
};

/**
 * 获取律师评价统计
 * GET /api/analytics/lawyers/:id/evaluation
 */
exports.getLawyerEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 统计律师负责的案件总数
    const totalCasesResult = await get(`
      SELECT COUNT(*) as count 
      FROM cases 
      WHERE team_id = ?
    `, [id]);
    const totalCases = totalCasesResult.count;

    // 2. 统计律师胜诉率
    const wonCasesResult = await get(`
      SELECT COUNT(*) as count 
      FROM cases 
      WHERE team_id = ? AND status = 'won'
    `, [id]);
    const wonCases = wonCasesResult.count;

    const closedCasesResult = await get(`
      SELECT COUNT(*) as count 
      FROM cases 
      WHERE team_id = ? AND status IN ('won', 'lost', 'closed')
    `, [id]);
    const closedCases = closedCasesResult.count;

    const winRate = closedCases > 0 ? ((wonCases / closedCases) * 100).toFixed(2) : 0;

    // 3. 计算律师平均办案周期（从立案到结案的天数）
    const avgCycleDaysResult = await get(`
      SELECT AVG(
        CAST((julianday(updated_at) - julianday(filing_date)) AS INTEGER)
      ) as avgDays
      FROM cases
      WHERE team_id = ? 
      AND status IN ('won', 'lost', 'closed')
      AND filing_date IS NOT NULL
    `, [id]);
    const avgCycleDays = avgCycleDaysResult.avgDays ? Math.round(avgCycleDaysResult.avgDays) : 0;

    // 4. 统计案件类型分布
    const caseTypeDistribution = await query(`
      SELECT case_type, COUNT(*) as count
      FROM cases
      WHERE team_id = ?
      GROUP BY case_type
      ORDER BY count DESC
    `, [id]);

    // 5. 统计标的额总计
    const targetAmountResult = await get(`
      SELECT SUM(target_amount) as total
      FROM cases
      WHERE team_id = ? AND target_amount IS NOT NULL
    `, [id]);
    const totalTargetAmount = targetAmountResult.total || 0;

    // 6. 生成综合评分（基于胜诉率、办案周期、案件数量）
    // 评分规则：胜诉率占50%，办案效率占30%（周期越短分数越高），案件数量占20%
    const winRateScore = parseFloat(winRate) * 0.5;
    const efficiencyScore = avgCycleDays > 0 ? Math.max(0, (365 - avgCycleDays) / 365 * 100) * 0.3 : 0;
    const volumeScore = Math.min(totalCases * 2, 100) * 0.2; // 每个案件2分，最高20分
    const comprehensiveScore = (winRateScore + efficiencyScore + volumeScore).toFixed(2);

    res.json({
      data: {
        lawyerId: id,
        statistics: {
          totalCases,
          wonCases,
          closedCases,
          winRate: parseFloat(winRate),
          avgCycleDays,
          totalTargetAmount: parseFloat(totalTargetAmount.toFixed(2))
        },
        caseTypeDistribution,
        evaluation: {
          comprehensiveScore: parseFloat(comprehensiveScore),
          winRateScore: parseFloat(winRateScore.toFixed(2)),
          efficiencyScore: parseFloat(efficiencyScore.toFixed(2)),
          volumeScore: parseFloat(volumeScore.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('获取律师评价错误:', error);
    res.status(500).json({
      error: {
        message: '获取律师评价失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案件类型分布
 * GET /api/analytics/cases/type-distribution
 */
exports.getCaseTypeDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let sql = `
      SELECT case_type, COUNT(*) as count 
      FROM cases 
      WHERE case_type IS NOT NULL
    `;
    const params = [];
    
    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    sql += ' GROUP BY case_type ORDER BY count DESC';
    
    const distribution = await query(sql, params);
    
    res.json({ data: distribution });
  } catch (error) {
    console.error('获取案件类型分布错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件类型分布失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案件趋势
 * GET /api/analytics/cases/trend
 */
exports.getCaseTrend = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    
    let dateFormat = '%Y-%m';
    if (interval === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (interval === 'year') {
      dateFormat = '%Y';
    }
    
    let sql = `
      SELECT 
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as count,
        SUM(target_amount) as totalAmount
      FROM cases
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    sql += ' GROUP BY period ORDER BY period ASC';
    
    const trend = await query(sql, params);
    
    res.json({ data: trend });
  } catch (error) {
    console.error('获取案件趋势错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件趋势失败',
        status: 500
      }
    });
  }
};

/**
 * 获取所有律师评价
 * GET /api/analytics/lawyers/evaluation
 */
exports.getAllLawyersEvaluation = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 获取所有用户（律师）
    const users = await query('SELECT id, real_name, username FROM users WHERE role = "lawyer" OR role = "admin"');
    
    const evaluations = [];
    
    for (const user of users) {
      // 统计每个律师的数据
      let caseSql = 'SELECT COUNT(*) as count FROM cases WHERE team_id = ?';
      const caseParams = [user.id];
      
      if (startDate) {
        caseSql += ' AND created_at >= ?';
        caseParams.push(startDate);
      }
      
      if (endDate) {
        caseSql += ' AND created_at <= ?';
        caseParams.push(endDate);
      }
      
      const totalCasesResult = await get(caseSql, caseParams);
      const totalCases = totalCasesResult.count;
      
      // 胜诉案件
      const wonCasesResult = await get(
        caseSql + " AND status = 'won'",
        caseParams
      );
      const wonCases = wonCasesResult.count;
      
      // 已结案件
      const closedCasesResult = await get(
        caseSql + " AND status IN ('won', 'lost', 'closed')",
        caseParams
      );
      const closedCases = closedCasesResult.count;
      
      const winRate = closedCases > 0 ? parseFloat(((wonCases / closedCases) * 100).toFixed(2)) : 0;
      
      // 平均办案周期
      const avgDurationResult = await get(`
        SELECT AVG(
          CAST((julianday(updated_at) - julianday(filing_date)) AS INTEGER)
        ) as avgDays
        FROM cases
        WHERE team_id = ? 
        AND status IN ('won', 'lost', 'closed')
        AND filing_date IS NOT NULL
      `, [user.id]);
      const avgDuration = avgDurationResult.avgDays ? Math.round(avgDurationResult.avgDays) : 0;
      
      // 标的额总计
      const amountResult = await get(`
        SELECT SUM(target_amount) as total
        FROM cases
        WHERE team_id = ? AND target_amount IS NOT NULL
      `, [user.id]);
      const totalAmount = amountResult.total || 0;
      
      // 计算综合评分（1-5分制）
      const winRateScore = (winRate / 100) * 2; // 最高2分
      const efficiencyScore = avgDuration > 0 ? Math.max(0, (365 - avgDuration) / 365 * 1.5) : 0; // 最高1.5分
      const volumeScore = Math.min(totalCases * 0.05, 1.5); // 最高1.5分
      const score = parseFloat((winRateScore + efficiencyScore + volumeScore).toFixed(1));
      
      // 生成评价维度（模拟数据）
      const dimensions = {
        professional: Math.min(winRate + 10, 100),
        efficiency: avgDuration > 0 ? Math.max(0, Math.min((365 - avgDuration) / 365 * 100, 100)) : 50,
        quality: winRate,
        satisfaction: Math.min(winRate + 5, 100),
        teamwork: 75 + Math.random() * 20,
        innovation: 70 + Math.random() * 25
      };
      
      // 案件类型分布
      const caseTypeDistribution = await query(`
        SELECT case_type as name, COUNT(*) as value
        FROM cases
        WHERE team_id = ?
        GROUP BY case_type
      `, [user.id]);
      
      // 办案趋势（最近6个月）
      const performanceTrend = await query(`
        SELECT 
          strftime('%Y-%m', created_at) as period,
          COUNT(*) as caseCount,
          CAST(
            (COUNT(CASE WHEN status = 'won' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN status IN ('won', 'lost', 'closed') THEN 1 END), 0))
            AS INTEGER
          ) as winRate
        FROM cases
        WHERE team_id = ?
        AND created_at >= date('now', '-6 months')
        GROUP BY period
        ORDER BY period ASC
      `, [user.id]);
      
      evaluations.push({
        id: user.id,
        name: user.real_name || user.username,
        totalCases,
        winRate,
        avgDuration,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        score,
        dimensions,
        caseTypeDistribution,
        performanceTrend
      });
    }
    
    // 按评分排序
    evaluations.sort((a, b) => b.score - a.score);
    
    res.json({ data: evaluations });
  } catch (error) {
    console.error('获取律师评价列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取律师评价列表失败',
        status: 500
      }
    });
  }
};

/**
 * 类案检索（模拟实现）
 * POST /api/analytics/similar-cases
 */
exports.searchSimilarCases = async (req, res) => {
  try {
    const {
      caseType,
      caseCause,
      targetAmount,
      keywords
    } = req.body;

    // 构建查询条件
    let sql = `
      SELECT c.*
      FROM cases c
      WHERE 1=1
    `;
    const params = [];

    if (caseType) {
      sql += ' AND c.case_type = ?';
      params.push(caseType);
    }

    if (caseCause) {
      sql += ' AND c.case_cause LIKE ?';
      params.push(`%${caseCause}%`);
    }

    if (targetAmount) {
      // 查找标的额在±50%范围内的案件
      const minAmount = targetAmount * 0.5;
      const maxAmount = targetAmount * 1.5;
      sql += ' AND c.target_amount BETWEEN ? AND ?';
      params.push(minAmount, maxAmount);
    }

    if (keywords && keywords.length > 0) {
      const keywordConditions = keywords.map(() => '(c.case_cause LIKE ? OR c.court LIKE ?)').join(' OR ');
      sql += ` AND (${keywordConditions})`;
      keywords.forEach(keyword => {
        const pattern = `%${keyword}%`;
        params.push(pattern, pattern);
      });
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 20';

    const cases = await query(sql, params);

    // 生成模拟的相似案例数据
    const similarCases = cases.map((c, index) => {
      // 计算相似度（模拟）
      let similarity = 60 + Math.random() * 35;
      if (c.case_type === caseType) similarity += 5;
      if (c.case_cause && caseCause && c.case_cause.includes(caseCause)) similarity += 10;
      similarity = Math.min(Math.round(similarity), 99);
      
      // 生成模拟的判决结果
      const results = ['原告胜诉', '被告胜诉', '部分胜诉', '调解结案'];
      const result = c.status === 'won' ? '原告胜诉' : 
                     c.status === 'lost' ? '被告胜诉' :
                     c.status === 'closed' ? results[Math.floor(Math.random() * results.length)] :
                     '审理中';
      
      return {
        caseNumber: c.case_number || c.internal_number,
        caseType: c.case_type,
        caseCause: c.case_cause,
        targetAmount: c.target_amount || 0,
        result,
        court: c.court || '某某人民法院',
        closureDate: c.updated_at ? c.updated_at.split(' ')[0] : '2024-01-01',
        summary: `本案系${c.case_cause || '纠纷'}案件，原告诉称被告存在违约行为，要求被告承担相应责任。经审理查明，${result === '原告胜诉' ? '原告主张成立' : result === '被告胜诉' ? '被告抗辩成立' : '双方各有责任'}。`,
        disputeFocus: `争议焦点主要集中在：1. 合同效力问题；2. 违约责任认定；3. 损失赔偿范围。`,
        judgmentSummary: `法院认为，${result === '原告胜诉' ? '原告提供的证据充分，被告应承担违约责任' : result === '被告胜诉' ? '原告证据不足，其诉讼请求不能成立' : '双方均存在一定过错，应各自承担相应责任'}。`,
        referenceValue: `本案对于类似${c.case_cause || '纠纷'}案件具有较高参考价值，特别是在证据认定和责任划分方面。`,
        similarity,
        tags: [c.case_type, c.case_cause, result].filter(Boolean)
      };
    });

    res.json({ data: similarCases });
  } catch (error) {
    console.error('类案检索错误:', error);
    res.status(500).json({
      error: {
        message: '类案检索失败',
        status: 500
      }
    });
  }
};
