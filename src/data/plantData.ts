import { PlantThreshold, CheckHistoryItem, TestScenario } from '../types';

// Bảng ngưỡng tưới nước chuẩn từ mục 4 trong tài liệu của học sinh
export const DEFAULT_PLANTS: PlantThreshold[] = [
  {
    name: 'Cà chua',
    threshold: 40,
    waterAmount: 200,
    emoji: '🍅',
    description: 'Cần ẩm vừa phải, đất dưới 40% sẽ bị rủ lá',
  },
  {
    name: 'Rau muống',
    threshold: 50,
    waterAmount: 250,
    emoji: '🌱',
    description: 'Cây ưa ẩm cao, dưới 50% cần bổ sung nước ngay',
  },
  {
    name: 'Xương rồng',
    threshold: 15,
    waterAmount: 50,
    emoji: '🌵',
    description: 'Cây mọng nước chịu hạn tốt, chỉ tưới ít khi đất thật khô',
  },
  {
    name: 'Hoa hồng',
    threshold: 35,
    waterAmount: 300,
    emoji: '🌹',
    description: 'Cây hoa cần lượng nước vừa đủ và ráo nước tốt',
  },
];

// Lịch sử kiểm tra mẫu lấy chính xác từ bản vẽ phác thảo tay trang 2
export const INITIAL_HISTORY: CheckHistoryItem[] = [
  {
    id: 'hist-1',
    date: '29/10',
    plantName: 'Cà chua',
    moisture: 35,
    result: 'Cần tưới',
    waterAmount: 200,
  },
  {
    id: 'hist-2',
    date: '28/10',
    plantName: 'Cà chua',
    moisture: 62,
    result: 'Chưa cần',
    waterAmount: 0,
  },
  {
    id: 'hist-3',
    date: '27/10',
    plantName: 'Rau muống',
    moisture: 45,
    result: 'Cần tưới',
    waterAmount: 250,
  },
];

// 3 Tình huống thử nghiệm dành cho học sinh kiểm tra và báo cáo đề tài
export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 1,
    title: 'Tình huống 1: Cây Cà chua bị thiếu nước (Đất khô)',
    description: 'Chậu cà chua phơi nắng 2 ngày, đo được độ ẩm đất là 30%.',
    plantName: 'Cà chua',
    moisture: 30,
    expectedResult: 'Cần tưới',
    explanation:
      'Ngưỡng của Cà chua là 40%. Vì 30% < 40%, ứng dụng phải hiện nền ĐỎ, chữ "CẦN TƯỚI!" và nhắc tưới 200 ml.',
  },
  {
    id: 2,
    title: 'Tình huống 2: Cây Rau muống vừa được tưới hoặc trời mưa',
    description: 'Chậu rau muống vừa được tưới lúc sáng, đo độ ẩm đất được 65%.',
    plantName: 'Rau muống',
    moisture: 65,
    expectedResult: 'Chưa cần',
    explanation:
      'Ngưỡng của Rau muống là 50%. Vì 65% ≥ 50%, đất còn đủ ẩm, ứng dụng phải hiện nền XANH, chữ "Chưa cần tưới" để tránh tưới thêm làm úng rễ.',
  },
  {
    id: 3,
    title: 'Tình huống 3: Cây Xương rồng chịu hạn đặc biệt',
    description: 'Chậu xương rồng đo được độ ẩm 20% (mức này cà chua sẽ héo nhưng xương rồng thì sao?).',
    plantName: 'Xương rồng',
    moisture: 20,
    expectedResult: 'Chưa cần',
    explanation:
      'Ngưỡng của Xương rồng chỉ là 15%. Dù 20% là khá khô so với cây khác, nhưng 20% > 15% nên ứng dụng vẫn báo nền XANH "Chưa cần tưới", giúp người dùng không tưới nhầm làm chết xương rồng!',
  },
];
