/**
 * 测试地区数据 API
 */

const regionData = require('./src/data/regionData');

console.log('='.repeat(60));
console.log('测试地区数据');
console.log('='.repeat(60));

console.log('\n1. 数据结构验证');
console.log(`总省份数: ${regionData.length}`);

let totalCities = 0;
let totalDistricts = 0;

regionData.forEach(province => {
  console.log(`\n省份: ${province.label} (${province.value})`);
  if (province.children) {
    totalCities += province.children.length;
    console.log(`  城市数: ${province.children.length}`);
    
    province.children.forEach(city => {
      if (city.children) {
        totalDistricts += city.children.length;
        console.log(`    ${city.label}: ${city.children.length} 个区县`);
      }
    });
  }
});

console.log('\n' + '='.repeat(60));
console.log('统计信息:');
console.log(`  省级: ${regionData.length}`);
console.log(`  市级: ${totalCities}`);
console.log(`  区县级: ${totalDistricts}`);
console.log(`  总计: ${regionData.length + totalCities + totalDistricts}`);
console.log('='.repeat(60));

console.log('\n2. 数据示例');
console.log('\n广东省 > 广州市:');
const guangdong = regionData.find(p => p.value === '440000');
if (guangdong && guangdong.children) {
  const guangzhou = guangdong.children.find(c => c.value === '440100');
  if (guangzhou && guangzhou.children) {
    console.log('区县列表:');
    guangzhou.children.forEach(district => {
      console.log(`  - ${district.label} (${district.value})`);
    });
  }
}

console.log('\n✓ 地区数据测试完成');
