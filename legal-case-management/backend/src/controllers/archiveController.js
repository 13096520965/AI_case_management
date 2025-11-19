const ClosureReport = require('../models/ClosureReport');
const ArchivePackage = require('../models/ArchivePackage');
const CaseKnowledge = require('../models/CaseKnowledge');
const Case = require('../models/Case');
const LitigationParty = require('../models/LitigationParty');
const ProcessNode = require('../models/ProcessNode');
const Evidence = require('../models/Evidence');
const Document = require('../models/Document');
const CostRecord = require('../models/CostRecord');

/**
 * 创建结案报告
 */
exports.createClosureReport = async (req, res) => {
  try {
    const reportData = req.body;

    // 验证必填字段
    if (!reportData.case_id) {
      return res.status(400).json({
        error: {
          message: '案件ID为必填项',
          status: 400
        }
      });
    }

    // 验证案件是否存在
    const caseData = await Case.findById(reportData.case_id);
    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 检查是否已存在结案报告
    const existingReport = await ClosureReport.findByCaseId(reportData.case_id);
    if (existingReport) {
      return res.status(409).json({
        error: {
          message: '该案件已存在结案报告',
          status: 409
        }
      });
    }

    const reportId = await ClosureReport.create(reportData);
    const newReport = await ClosureReport.findById(reportId);

    res.status(201).json({
      message: '结案报告创建成功',
      data: {
        report: newReport
      }
    });
  } catch (error) {
    console.error('创建结案报告错误:', error);
    res.status(500).json({
      error: {
        message: '创建结案报告失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 根据案件ID获取结案报告
 */
exports.getClosureReportByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    const report = await ClosureReport.findByCaseId(caseId);

    if (!report) {
      return res.status(404).json({
        error: {
          message: '结案报告不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        report
      }
    });
  } catch (error) {
    console.error('获取结案报告错误:', error);
    res.status(500).json({
      error: {
        message: '获取结案报告失败',
        status: 500
      }
    });
  }
};

/**
 * 更新结案报告
 */
exports.updateClosureReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查报告是否存在
    const existingReport = await ClosureReport.findById(id);
    if (!existingReport) {
      return res.status(404).json({
        error: {
          message: '结案报告不存在',
          status: 404
        }
      });
    }

    const changes = await ClosureReport.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedReport = await ClosureReport.findById(id);

    res.json({
      message: '结案报告更新成功',
      data: {
        report: updatedReport
      }
    });
  } catch (error) {
    console.error('更新结案报告错误:', error);
    res.status(500).json({
      error: {
        message: '更新结案报告失败',
        status: 500
      }
    });
  }
};

/**
 * 创建归档包
 */
exports.createArchivePackage = async (req, res) => {
  try {
    const { case_id, archived_by, notes } = req.body;

    // 验证必填字段
    if (!case_id) {
      return res.status(400).json({
        error: {
          message: '案件ID为必填项',
          status: 400
        }
      });
    }

    // 验证案件是否存在
    const caseData = await Case.findById(case_id);
    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 检查是否已存在归档包
    const existingPackage = await ArchivePackage.findByCaseId(case_id);
    if (existingPackage) {
      return res.status(409).json({
        error: {
          message: '该案件已存在归档包',
          status: 409
        }
      });
    }

    // 生成归档编号
    const archive_number = await generateArchiveNumber();

    // 收集案件所有相关数据
    const parties = await LitigationParty.findByCaseId(case_id);
    const nodes = await ProcessNode.findByCaseId(case_id);
    const evidence = await Evidence.findByCaseId(case_id);
    const documents = await Document.findByCaseId(case_id);
    const costs = await CostRecord.findByCaseId(case_id);
    const closureReport = await ClosureReport.findByCaseId(case_id);

    // 计算归档包大小（简化版，实际应计算文件大小）
    const package_size = (evidence.length + documents.length) * 1024; // 假设每个文件1KB

    // 创建归档包数据
    const packageData = {
      case_id,
      archive_number,
      archive_date: new Date().toISOString().split('T')[0],
      archive_location: `archive/${archive_number}`,
      package_size,
      package_path: `/archive/${archive_number}`,
      archived_by,
      notes
    };

    const packageId = await ArchivePackage.create(packageData);
    const newPackage = await ArchivePackage.findById(packageId);

    // 返回归档包信息和打包的数据摘要
    res.status(201).json({
      message: '归档包创建成功',
      data: {
        package: newPackage,
        summary: {
          case: caseData,
          parties_count: parties.length,
          nodes_count: nodes.length,
          evidence_count: evidence.length,
          documents_count: documents.length,
          costs_count: costs.length,
          has_closure_report: !!closureReport
        }
      }
    });
  } catch (error) {
    console.error('创建归档包错误:', error);
    res.status(500).json({
      error: {
        message: '创建归档包失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 检索归档案件
 */
exports.searchArchivePackages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      archive_number,
      case_number,
      case_cause,
      archive_date_from,
      archive_date_to,
      archived_by
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      archive_number,
      case_number,
      case_cause,
      archive_date_from,
      archive_date_to,
      archived_by
    };

    const packages = await ArchivePackage.search(options);
    const total = await ArchivePackage.count({
      archive_number,
      case_number,
      case_cause,
      archive_date_from,
      archive_date_to,
      archived_by
    });

    res.json({
      data: {
        packages,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('检索归档案件错误:', error);
    res.status(500).json({
      error: {
        message: '检索归档案件失败',
        status: 500
      }
    });
  }
};

/**
 * 获取归档包详情
 */
exports.getArchivePackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const archivePackage = await ArchivePackage.findById(id);

    if (!archivePackage) {
      return res.status(404).json({
        error: {
          message: '归档包不存在',
          status: 404
        }
      });
    }

    // 获取关联的案件信息
    const caseData = await Case.findById(archivePackage.case_id);

    res.json({
      data: {
        package: archivePackage,
        case: caseData
      }
    });
  } catch (error) {
    console.error('获取归档包详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取归档包详情失败',
        status: 500
      }
    });
  }
};

/**
 * 创建案例知识
 */
exports.createCaseKnowledge = async (req, res) => {
  try {
    const knowledgeData = req.body;

    // 验证必填字段
    if (!knowledgeData.case_cause) {
      return res.status(400).json({
        error: {
          message: '案由为必填项',
          status: 400
        }
      });
    }

    // 如果提供了案件ID，验证案件是否存在
    if (knowledgeData.case_id) {
      const caseData = await Case.findById(knowledgeData.case_id);
      if (!caseData) {
        return res.status(404).json({
          error: {
            message: '案件不存在',
            status: 404
          }
        });
      }
    }

    // 如果提供了归档包ID，验证归档包是否存在
    if (knowledgeData.archive_package_id) {
      const archivePackage = await ArchivePackage.findById(knowledgeData.archive_package_id);
      if (!archivePackage) {
        return res.status(404).json({
          error: {
            message: '归档包不存在',
            status: 404
          }
        });
      }
    }

    const knowledgeId = await CaseKnowledge.create(knowledgeData);
    const newKnowledge = await CaseKnowledge.findById(knowledgeId);

    res.status(201).json({
      message: '案例知识创建成功',
      data: {
        knowledge: newKnowledge
      }
    });
  } catch (error) {
    console.error('创建案例知识错误:', error);
    res.status(500).json({
      error: {
        message: '创建案例知识失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 检索案例知识库
 */
exports.searchCaseKnowledge = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    };

    const knowledge = await CaseKnowledge.search(options);
    const total = await CaseKnowledge.count({
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    });

    res.json({
      data: {
        knowledge,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('检索案例知识库错误:', error);
    res.status(500).json({
      error: {
        message: '检索案例知识库失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案例知识详情
 */
exports.getCaseKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await CaseKnowledge.findById(id);

    if (!knowledge) {
      return res.status(404).json({
        error: {
          message: '案例知识不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        knowledge
      }
    });
  } catch (error) {
    console.error('获取案例知识详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取案例知识详情失败',
        status: 500
      }
    });
  }
};

/**
 * 更新案例知识
 */
exports.updateCaseKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查知识是否存在
    const existingKnowledge = await CaseKnowledge.findById(id);
    if (!existingKnowledge) {
      return res.status(404).json({
        error: {
          message: '案例知识不存在',
          status: 404
        }
      });
    }

    const changes = await CaseKnowledge.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedKnowledge = await CaseKnowledge.findById(id);

    res.json({
      message: '案例知识更新成功',
      data: {
        knowledge: updatedKnowledge
      }
    });
  } catch (error) {
    console.error('更新案例知识错误:', error);
    res.status(500).json({
      error: {
        message: '更新案例知识失败',
        status: 500
      }
    });
  }
};

/**
 * 删除案例知识
 */
exports.deleteCaseKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查知识是否存在
    const existingKnowledge = await CaseKnowledge.findById(id);
    if (!existingKnowledge) {
      return res.status(404).json({
        error: {
          message: '案例知识不存在',
          status: 404
        }
      });
    }

    await CaseKnowledge.delete(id);

    res.json({
      message: '案例知识删除成功'
    });
  } catch (error) {
    console.error('删除案例知识错误:', error);
    res.status(500).json({
      error: {
        message: '删除案例知识失败',
        status: 500
      }
    });
  }
};

/**
 * 按案由分类统计
 */
exports.getCaseKnowledgeStatistics = async (req, res) => {
  try {
    const statistics = await CaseKnowledge.groupByCaseCause();

    res.json({
      data: {
        statistics
      }
    });
  } catch (error) {
    console.error('获取案例知识统计错误:', error);
    res.status(500).json({
      error: {
        message: '获取案例知识统计失败',
        status: 500
      }
    });
  }
};

/**
 * 生成唯一的归档编号
 * 格式: AR + 年份 + 月份 + 6位序号
 * 例如: AR202411000001
 */
async function generateArchiveNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `AR${year}${month}`;

  // 查询当月最大序号
  const lastPackage = await ArchivePackage.findLastByPrefix(prefix);
  
  let sequence = 1;
  if (lastPackage && lastPackage.archive_number) {
    const lastSequence = parseInt(lastPackage.archive_number.slice(-6));
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(6, '0');
  return `${prefix}${sequenceStr}`;
}
