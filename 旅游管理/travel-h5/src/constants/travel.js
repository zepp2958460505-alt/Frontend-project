export const travelStyles = [
  { value: 'classic', label: '经典打卡' },
  { value: 'relaxed', label: '轻松慢游' },
  { value: 'food', label: '美食探索' },
  { value: 'culture', label: '人文历史' },
  { value: 'family', label: '亲子友好' },
  { value: 'citywalk', label: 'City Walk' }
]

export const companionTypes = [
  { value: 'solo', label: '独自出行' },
  { value: 'couple', label: '情侣出行' },
  { value: 'friends', label: '朋友结伴' },
  { value: 'family', label: '家庭亲子' },
  { value: 'elders', label: '带长辈出行' }
]

export const allCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '武汉', '苏州', '长沙', '天津', '郑州', '济南', '青岛',
  '大连', '沈阳', '哈尔滨', '长春', '福州', '厦门', '南昌', '合肥',
  '昆明', '贵阳', '南宁', '桂林', '海口', '三亚', '丽江', '大理',
  '兰州', '乌鲁木齐', '拉萨', '呼和浩特', '太原', '石家庄'
]

export const popularCities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆']

export const getTravelStyleLabel = (value) => travelStyles.find((item) => item.value === value)?.label || '经典打卡'
export const getCompanionLabel = (value) => companionTypes.find((item) => item.value === value)?.label || '朋友结伴'
