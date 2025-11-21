# 数据分析 API 实现总结

## 概述

本文档记录了任务 12 "数据分析 API" 的实现细节，包括驾驶舱数据统计、律师评价统计和类案检索功能。

## 实现的功能

### 12.1 驾驶舱数据统计

**接口**: `GET /api/analytics/dashboard`

**功能**:
- 统计案件总量
- 统计标的额总计
- 计算平均胜诉率
- 统计案件类型分布
- 生成案件数量趋势数据（最近12个月）
- 统计活跃案件数量
- 统计待处理和超期节点数量

**返回数据结构**:
```json
{
  "data": {
    "summary": {
      "totalCases": 25,
      "totalTargetAmount": 3210000,
      "averageWinRate": 0,
      "activeCases": 24,
      "wonCases": 0,
      "closedCases": 0
    },
    "caseTypeDistribution": [
      { "case_type": "民事", "count": 24 },
      { "case_type": "刑事", "count": 1 }
    ],
    "caseTrend": [
      { "month": "2024-11", "count": 25 }
    ],
    "alerts": {
      "pendingNodes": 21,
      "overdueNodes": 3
    }
  }
}
```

### 12.2 律师评价统计

**接口**: `GET /api/analytics/lawyers/:id/evaluation`

**功能**:
- 统计律师负责的案件总数
- 统计律师胜诉率
- 计算律师平均办案周期（天数）
- 统计案件类型分布
- 统计标的额总计
- 生成综合评分（基于胜诉率、办案效率、案件数量）

**评分规则**:
- 胜诉率占 50%
- 办案效率占 30%（周期越短分数越高）
- 案件数量占 20%（每个案件2分，最高20分）

**返回数据结构**:
```json
{
  "data": {
    "lawyerId": "1",
    "statistics": {
      "totalCases": 0,
      "wonCases": 0,
      "closedCases": 0,
      "winRate": 0,
      "avgCycleDays": 0,
      "totalTargetAmount": 0
    },
    "caseTypeDistribution": [],
    "evaluation": {
      "comprehensiveScore": 0,
      "winRateScore": 0,
      "efficiencyScore": 0,
      "volumeScore": 0
    }
  }
}
```

### 12.3 类案检索（模拟实现）

**接口**: `POST /api/analytics/similar-cases`

**功能**:
- 根据案件类型、案由、标的额范围、关键词检索相似案例
- 计算相似案例的胜诉率
- 生成诉讼建议
- 返回相似度评分（模拟）

**请求参数**:
```json
{
  "case_type": "民事",
  "case_cause": "合同纠纷",
  "target_amount_min": 10000,
  "target_amount_max": 1000000,
  "keywords": "违约"
}
```

**返回数据结构**:
```json
{
  "data": {
    "similarCases": [
      {
        "id": 1,
        "case_number": "...",
        "case_type": "民事",
        "case_cause": "合同纠纷",
        "target_amount": 50000,
        "status": "active",
        "similarity_score": 85
      }
    ],
    "analysis": {
      "totalSimilarCases": 15,
      "wonCases": 8,
      "winRate": 53.33,
      "recommendations": [
        "该类案件胜诉率中等，建议充分准备证据材料",
        "找到大量相似案例，可参考历史案件的处理经验"
      ]
    },
    "note": "这是模拟的类案检索功能，实际应用中需要对接专业的案例库和AI分析服务"
  }
}
```

## 技术实现

### 文件结构

```
backend/src/
├── controllers/
│   └── analyticsController.js    # 数据分析控制器
├── routes/
│   └── analytics.js               # 数据分析路由
└── app.js                         # 注册路由
```

### 核心实现要点

1. **数据库查询优化**
   - 使用聚合函数（COUNT, SUM, AVG）进行统计
   - 使用 GROUP BY 进行分组统计
   - 使用日期函数进行时间范围筛选

2. **胜诉率计算**
   - 假设 status='won' 表示胜诉
   - 假设 status IN ('won', 'lost', 'closed') 表示已结案
   - 胜诉率 = 胜诉案件数 / 已结案件数 × 100%

3. **办案周期计算**
   - 使用 SQLite 的 julianday 函数计算日期差
   - 计算从立案日期到更新日期的天数
   - 只统计已结案的案件

4. **类案检索**
   - 支持多条件组合查询
   - 使用 LIKE 进行模糊匹配
   - 使用窗口函数统计分组数据
   - 限制返回结果数量（最多20条）

5. **建议生成逻辑**
   - 胜诉率 > 70%: 建议积极应诉
   - 胜诉率 40%-70%: 建议充分准备
   - 胜诉率 < 40%: 建议评估风险
   - 相似案例 > 10: 建议参考历史经验

## 测试结果

所有测试用例均通过：

✓ 登录成功
✓ 获取驾驶舱数据成功
✓ 获取律师评价成功
✓ 类案检索成功
✓ 不同搜索条件的类案检索成功

## 后续扩展建议

1. **驾驶舱增强**
   - 添加更多维度的统计（按法院、按律师等）
   - 支持自定义时间范围
   - 添加同比、环比分析

2. **律师评价增强**
   - 添加客户满意度评分
   - 添加专业领域分析
   - 生成律师排行榜

3. **类案检索增强**
   - 对接专业法律案例库
   - 使用 AI/NLP 技术进行语义匹配
   - 添加案例详情和判决书全文
   - 实现更精确的相似度算法

4. **性能优化**
   - 添加数据缓存
   - 创建数据库索引
   - 实现异步统计任务

## 相关需求

- 需求 13: 类案检索
- 需求 23: 律师评价
- 需求 24: 可视化驾驶舱

## 测试文件

`test-analytics-api.js` - 完整的 API 测试脚本

运行测试:
```bash
node test-analytics-api.js
```
