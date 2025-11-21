/**
 * 测试完整地区数据
 */

const { regionData } = require('element-china-area-data');

console.log('='.repeat(60));
console.log('测试 element-china-area-data');
console.log('='.repeat(60));

console.log('\n1. 数据格式检查');
console.log('数据类型:', Array.isArray(regionData) ? '数组' : typeof regionData);
console.log('省份数量:', regionData.length);

if (regionData.length > 0) {
  const firstProvince = regionData[0];
  console.log('\n2. 第一个省份示例:');
  console.log('  编码:', firstProvince.value);
  console.log('  名称:', firstProvince.label);
  console.log('  有子级:', !!firstProvince.children);
  
  if (firstProvince.children && firstProvince.children.length > 0) {
    const firstCity = firstProvince.children[0];
    console.log('\n3. 第一个城市示例:');
    console.log('  编码:', firstCity.value);
    console.log('  名称:', firstCity.label);
    console.log('  有子级:', !!firstCity.children);
    
    if (firstCity.children && firstCity.children.length > 0) {
      const firstDistrict = firstCity.children[0];
      console.log('\n4. 第一个区县示例:');
      console.log('  编码:', firstDistrict.value);
      console.log('  名称:', firstDistrict.label);
    }
  }
}

// 统计数据
let totalCities = 0;
let totalDistricts = 0;

regionData.forEach(province => {
  if (province.children) {
    totalCities += province.children.length;
    province.children.forEach(city => {
      if (city.children) {
        totalDistricts += city.children.length;
      }
    });
  }
});

console.log('\n' + '='.repeat(60));
console.log('统计信息:');
console.log('  省级:', regionData.length);
console.log('  市级:', totalCities);
console.log('  区县级:', totalDistricts);
console.log('  总计:', regionData.length + totalCities + totalDistricts);
console.log('='.repeat(60));

// 查找河北省
console.log('\n5. 河北省数据检查:');
const hebei = regionData.find(p => p.label === '河北省');
if (hebei) {
  console.log('  找到河北省');
  console.log('  城市数量:', hebei.children?.length || 0);
  if (hebei.children) {
    console.log('  城市列表:');
    hebei.children.forEach((city, index) => {
      console.log(`    ${index + 1}. ${city.label} (${city.children?.length || 0}个区县)`);
    });
  }
} else {
  console.log('  未找到河北省');
}

console.log('\n✓ 测试完成');
