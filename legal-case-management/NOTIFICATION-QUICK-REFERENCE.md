# 通知提醒问题 - 快速参考

## 问题
案件 AN202511000007 没有收到每日提醒

## 根本原因
调度器中存在三个问题：
1. SQL 查询引用了不存在的列 `c.case_name`
2. 单位转换不支持中文 `'天'`（只支持英文 `'days'`）
3. 状态值检查不支持英文 `'in_progress'`（只支持中文 `'进行中'`）

## 修复内容
修改 `backend/src/services/notificationSchedulerEnhanced.js`：

### 修复1：字段引用
```javascript
// 原：c.case_name ❌
// 新：c.internal_number as case_number ✓
```

### 修复2：单位转换
```javascript
// 原：if (threshold_unit === 'days')
// 新：if (threshold_unit === 'days' || threshold_unit === '天')
```

### 修复3：状态值
```javascript
// 原：WHERE pn.status IN ('待处理', '进行中')
// 新：WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
```

## 验证
修复后，案件 AN202511000007 的立案受理节点成功创建了提醒：
```
✓ 创建截止提醒: AN202511000007 - 立案受理 (1天后到期)
```

## 下一步
1. 部署修改
2. 重启后端服务
3. 在通知中心查看提醒

## 文件
- 修改：`backend/src/services/notificationSchedulerEnhanced.js`
- 详细：`NOTIFICATION-FIX-COMPLETE.md`
