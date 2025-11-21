/**
 * 全国省市区数据
 * 使用 element-china-area-data 数据包
 * 包含全国所有省市区县（31省/342市/3056区县）
 * 
 * 数据来源：element-china-area-data
 * 数据格式：{ value: 行政区划代码, label: 地区名称, children: 子级地区 }
 * 
 * 备注：
 * - 原手动维护的数据已备份到 regionData-manual-backup.js
 * - 如需恢复手动数据，可以替换此文件
 */

const { regionData } = require('element-china-area-data');

// element-china-area-data 的数据格式已经符合要求
// 数据结构：
// [
//   {
//     value: '11',        // 省级编码（2位）
//     label: '北京市',
//     children: [
//       {
//         value: '1101',  // 市级编码（4位）
//         label: '市辖区',
//         children: [
//           {
//             value: '110101',  // 区县编码（6位）
//             label: '东城区'
//           }
//         ]
//       }
//     ]
//   }
// ]

module.exports = regionData;
