/**
 * 完整的全国省市区数据
 * 使用 element-china-area-data 数据包
 * 包含全国所有省市区县
 */

const { regionData } = require('element-china-area-data');

// element-china-area-data 的数据格式：
// [
//   {
//     value: '110000',
//     label: '北京市',
//     children: [...]
//   }
// ]

// 数据格式已经符合我们的要求，直接导出
module.exports = regionData;
