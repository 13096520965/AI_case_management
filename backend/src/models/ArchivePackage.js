const { query, run, get } = require('../config/database');

/**
 * ArchivePackage 模型 - 归档包管理
 */
class ArchivePackage {
  /**
   * 创建归档包
   * @param {Object} packageData - 归档包数据
   * @returns {Promise<number>} 新创建归档包的 ID
   */
  static async create(packageData) {
    const {
      case_id,
      archive_number,
      archive_date,
      archive_location,
      package_size,
      package_path,
      archived_by,
      notes
    } = packageData;

    const sql = `
      INSERT INTO archive_packages (
        case_id, archive_number, archive_date, archive_location,
        package_size, package_path, archived_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      case_id,
      archive_number,
      archive_date,
      archive_location,
      package_size,
      package_path,
      archived_by,
      notes
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取归档包
   * @param {number} id - 归档包 ID
   * @returns {Promise<Object|null>} 归档包对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM archive_packages WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取归档包
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Object|null>} 归档包对象
   */
  static async findByCaseId(caseId) {
    const sql = 'SELECT * FROM archive_packages WHERE case_id = ?';
    return await get(sql, [caseId]);
  }

  /**
   * 根据归档编号获取归档包
   * @param {string} archiveNumber - 归档编号
   * @returns {Promise<Object|null>} 归档包对象
   */
  static async findByArchiveNumber(archiveNumber) {
    const sql = 'SELECT * FROM archive_packages WHERE archive_number = ?';
    return await get(sql, [archiveNumber]);
  }

  /**
   * 搜索归档案件（支持多维度检索）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 归档包列表
   */
  static async search(options = {}) {
    const {
      page = 1,
      limit = 10,
      archive_number,
      case_number,
      case_cause,
      archive_date_from,
      archive_date_to,
      archived_by
    } = options;

    let sql = `
      SELECT ap.*, c.case_number, c.internal_number, c.case_type, 
             c.case_cause, c.court, c.target_amount
      FROM archive_packages ap
      LEFT JOIN cases c ON ap.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (archive_number) {
      sql += ' AND ap.archive_number LIKE ?';
      params.push(`%${archive_number}%`);
    }

    if (case_number) {
      sql += ' AND (c.case_number LIKE ? OR c.internal_number LIKE ?)';
      params.push(`%${case_number}%`, `%${case_number}%`);
    }

    if (case_cause) {
      sql += ' AND c.case_cause LIKE ?';
      params.push(`%${case_cause}%`);
    }

    if (archive_date_from) {
      sql += ' AND ap.archive_date >= ?';
      params.push(archive_date_from);
    }

    if (archive_date_to) {
      sql += ' AND ap.archive_date <= ?';
      params.push(archive_date_to);
    }

    if (archived_by) {
      sql += ' AND ap.archived_by = ?';
      params.push(archived_by);
    }

    sql += ' ORDER BY ap.archive_date DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 统计归档包数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 归档包数量
   */
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as count 
      FROM archive_packages ap
      LEFT JOIN cases c ON ap.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.archive_number) {
      sql += ' AND ap.archive_number LIKE ?';
      params.push(`%${filters.archive_number}%`);
    }

    if (filters.case_number) {
      sql += ' AND (c.case_number LIKE ? OR c.internal_number LIKE ?)';
      params.push(`%${filters.case_number}%`, `%${filters.case_number}%`);
    }

    if (filters.case_cause) {
      sql += ' AND c.case_cause LIKE ?';
      params.push(`%${filters.case_cause}%`);
    }

    if (filters.archive_date_from) {
      sql += ' AND ap.archive_date >= ?';
      params.push(filters.archive_date_from);
    }

    if (filters.archive_date_to) {
      sql += ' AND ap.archive_date <= ?';
      params.push(filters.archive_date_to);
    }

    if (filters.archived_by) {
      sql += ' AND ap.archived_by = ?';
      params.push(filters.archived_by);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * 更新归档包
   * @param {number} id - 归档包 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    params.push(id);

    const sql = `UPDATE archive_packages SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除归档包
   * @param {number} id - 归档包 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM archive_packages WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 查找指定前缀的最后一个归档包（用于生成编号）
   * @param {string} prefix - 编号前缀
   * @returns {Promise<Object|null>} 归档包对象
   */
  static async findLastByPrefix(prefix) {
    const sql = `
      SELECT * FROM archive_packages 
      WHERE archive_number LIKE ? 
      ORDER BY archive_number DESC 
      LIMIT 1
    `;
    return await get(sql, [`${prefix}%`]);
  }
}

module.exports = ArchivePackage;
