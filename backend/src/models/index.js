/**
 * 数据模型统一导出
 */

const Case = require('./Case');
const LitigationParty = require('./LitigationParty');
const ProcessNode = require('./ProcessNode');
const Evidence = require('./Evidence');
const Document = require('./Document');
const CostRecord = require('./CostRecord');
const NotificationTask = require('./NotificationTask');
const User = require('./User');
const CollaborationMember = require('./CollaborationMember');
const CollaborationTask = require('./CollaborationTask');
const ClosureReport = require('./ClosureReport');
const ArchivePackage = require('./ArchivePackage');
const CaseKnowledge = require('./CaseKnowledge');

module.exports = {
  Case,
  LitigationParty,
  ProcessNode,
  Evidence,
  Document,
  CostRecord,
  NotificationTask,
  User,
  CollaborationMember,
  CollaborationTask,
  ClosureReport,
  ArchivePackage,
  CaseKnowledge
};
