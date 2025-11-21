/**
 * 中国省市区数据（简化版）
 * 实际项目中可以使用完整的省市区数据或从后端API获取
 */

export interface RegionItem {
  value: string
  label: string
  children?: RegionItem[]
}

export const regionData: RegionItem[] = [
  {
    value: '110000',
    label: '北京市',
    children: [
      {
        value: '110100',
        label: '北京市',
        children: [
          { value: '110101', label: '东城区' },
          { value: '110102', label: '西城区' },
          { value: '110105', label: '朝阳区' },
          { value: '110106', label: '丰台区' },
          { value: '110107', label: '石景山区' },
          { value: '110108', label: '海淀区' },
          { value: '110109', label: '门头沟区' },
          { value: '110111', label: '房山区' },
          { value: '110112', label: '通州区' },
          { value: '110113', label: '顺义区' },
          { value: '110114', label: '昌平区' },
          { value: '110115', label: '大兴区' },
          { value: '110116', label: '怀柔区' },
          { value: '110117', label: '平谷区' },
          { value: '110118', label: '密云区' },
          { value: '110119', label: '延庆区' }
        ]
      }
    ]
  },
  {
    value: '310000',
    label: '上海市',
    children: [
      {
        value: '310100',
        label: '上海市',
        children: [
          { value: '310101', label: '黄浦区' },
          { value: '310104', label: '徐汇区' },
          { value: '310105', label: '长宁区' },
          { value: '310106', label: '静安区' },
          { value: '310107', label: '普陀区' },
          { value: '310109', label: '虹口区' },
          { value: '310110', label: '杨浦区' },
          { value: '310112', label: '闵行区' },
          { value: '310113', label: '宝山区' },
          { value: '310114', label: '嘉定区' },
          { value: '310115', label: '浦东新区' },
          { value: '310116', label: '金山区' },
          { value: '310117', label: '松江区' },
          { value: '310118', label: '青浦区' },
          { value: '310120', label: '奉贤区' },
          { value: '310151', label: '崇明区' }
        ]
      }
    ]
  },
  {
    value: '440000',
    label: '广东省',
    children: [
      {
        value: '440100',
        label: '广州市',
        children: [
          { value: '440103', label: '荔湾区' },
          { value: '440104', label: '越秀区' },
          { value: '440105', label: '海珠区' },
          { value: '440106', label: '天河区' },
          { value: '440111', label: '白云区' },
          { value: '440112', label: '黄埔区' },
          { value: '440113', label: '番禺区' },
          { value: '440114', label: '花都区' },
          { value: '440115', label: '南沙区' },
          { value: '440117', label: '从化区' },
          { value: '440118', label: '增城区' }
        ]
      },
      {
        value: '440300',
        label: '深圳市',
        children: [
          { value: '440303', label: '罗湖区' },
          { value: '440304', label: '福田区' },
          { value: '440305', label: '南山区' },
          { value: '440306', label: '宝安区' },
          { value: '440307', label: '龙岗区' },
          { value: '440308', label: '盐田区' },
          { value: '440309', label: '龙华区' },
          { value: '440310', label: '坪山区' },
          { value: '440311', label: '光明区' }
        ]
      },
      {
        value: '440600',
        label: '佛山市',
        children: [
          { value: '440604', label: '禅城区' },
          { value: '440605', label: '南海区' },
          { value: '440606', label: '顺德区' },
          { value: '440607', label: '三水区' },
          { value: '440608', label: '高明区' }
        ]
      }
    ]
  },
  {
    value: '320000',
    label: '江苏省',
    children: [
      {
        value: '320100',
        label: '南京市',
        children: [
          { value: '320102', label: '玄武区' },
          { value: '320104', label: '秦淮区' },
          { value: '320105', label: '建邺区' },
          { value: '320106', label: '鼓楼区' },
          { value: '320111', label: '浦口区' },
          { value: '320113', label: '栖霞区' },
          { value: '320114', label: '雨花台区' },
          { value: '320115', label: '江宁区' },
          { value: '320116', label: '六合区' },
          { value: '320117', label: '溧水区' },
          { value: '320118', label: '高淳区' }
        ]
      },
      {
        value: '320500',
        label: '苏州市',
        children: [
          { value: '320505', label: '虎丘区' },
          { value: '320506', label: '吴中区' },
          { value: '320507', label: '相城区' },
          { value: '320508', label: '姑苏区' },
          { value: '320509', label: '吴江区' },
          { value: '320581', label: '常熟市' },
          { value: '320582', label: '张家港市' },
          { value: '320583', label: '昆山市' },
          { value: '320585', label: '太仓市' }
        ]
      }
    ]
  },
  {
    value: '330000',
    label: '浙江省',
    children: [
      {
        value: '330100',
        label: '杭州市',
        children: [
          { value: '330102', label: '上城区' },
          { value: '330105', label: '拱墅区' },
          { value: '330106', label: '西湖区' },
          { value: '330108', label: '滨江区' },
          { value: '330109', label: '萧山区' },
          { value: '330110', label: '余杭区' },
          { value: '330111', label: '富阳区' },
          { value: '330112', label: '临安区' },
          { value: '330113', label: '临平区' },
          { value: '330114', label: '钱塘区' },
          { value: '330122', label: '桐庐县' },
          { value: '330127', label: '淳安县' },
          { value: '330182', label: '建德市' }
        ]
      }
    ]
  }
]
