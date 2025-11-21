/**
 * 地区数据控制器
 * 提供全国省市区数据
 */

const regionData = require('../data/regionData');

/**
 * 获取全国省市区数据
 */
exports.getRegions = async (req, res) => {
  try {
    res.json({
      data: regionData,
      message: '获取地区数据成功'
    });
  } catch (error) {
    console.error('获取地区数据错误:', error);
    res.status(500).json({
      error: {
        message: '获取地区数据失败',
        status: 500
      }
    });
  }
};

/**
 * 根据父级编码获取下级地区
 */
exports.getRegionsByParent = async (req, res) => {
  try {
    const { parentCode } = req.params;
    
    // 递归查找子级地区
    const findChildren = (data, code) => {
      for (const item of data) {
        if (item.value === code) {
          return item.children || [];
        }
        if (item.children) {
          const result = findChildren(item.children, code);
          if (result.length > 0) return result;
        }
      }
      return [];
    };
    
    const children = parentCode === 'root' 
      ? regionData 
      : findChildren(regionData, parentCode);
    
    res.json({
      data: children,
      message: '获取地区数据成功'
    });
  } catch (error) {
    console.error('获取地区数据错误:', error);
    res.status(500).json({
      error: {
        message: '获取地区数据失败',
        status: 500
      }
    });
  }
};
