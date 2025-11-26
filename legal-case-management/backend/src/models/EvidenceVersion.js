const { query, run, get } = require('../config/database');

/**
 * EvidenceVersion 模型 - 证据版本历史管理
 */
class EvidenceVersion {
  /**
   * 创建证据版本记录
   * @param {Object} versionData - 版本数据
   * @returns {Promise<number>} 新创建版本的 ID
   */
  static async create(versionData) {
    const {
      evidence_id,
      version,
      file_name,
      file_type,
      file_size,
      storage_path,
      category,
      tags,
      uploaded_by
    } = versionData;

    // 支持自定义 uploaded_at 字段（如传入北京时间）
    const sql = `
      INSERT INTO evidence_versions (
        evidence_id, version, file_name, file_type, file_size,
        storage_path, category, tags, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [
      evidence_id,
      version,
      file_name,
      file_type,
      file_size,
      storage_path,
      category,
      tags,
      uploaded_by,
      versionData.uploaded_at ?? null
    ]);
    return result.lastID;
  }

  /**
   * 获取证据的所有版本历史
   * @param {number} evidenceId - 证据 ID
   * @returns {Promise<Array>} 版本历史列表
   */
  static async findByEvidenceId(evidenceId) {
    const sql = `
      SELECT * FROM evidence_versions 
      WHERE evidence_id = ? 
      ORDER BY version DESC
    `;
    return await query(sql, [evidenceId]);
  }

  /**
   * 获取特定版本
   * @param {number} evidenceId - 证据 ID
   * @param {number} version - 版本号
   * @returns {Promise<Object|null>} 版本对象
   */
  static async findByVersion(evidenceId, version) {
    const sql = `
      SELECT * FROM evidence_versions 
      WHERE evidence_id = ? AND version = ?
    `;
    return await get(sql, [evidenceId, version]);
  }

  /**
   * 获取最新版本号
   * @param {number} evidenceId - 证据 ID
   * @returns {Promise<number>} 最新版本号
   */
  static async getLatestVersion(evidenceId) {
    const sql = `
      SELECT MAX(version) as max_version 
      FROM evidence_versions 
      WHERE evidence_id = ?
    `;
    const result = await get(sql, [evidenceId]);
    return result?.max_version || 0;
  }
}

module.exports = EvidenceVersion;
