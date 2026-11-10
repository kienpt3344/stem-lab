export interface PlantThreshold {
  name: string;
  threshold: number; // Độ ẩm dưới mức này thì cần tưới (%)
  waterAmount: number; // Lượng nước mỗi lần (ml)
  emoji: string;
  description?: string;
}

export interface CheckHistoryItem {
  id: string;
  date: string; // ví dụ "29/10" hoặc "29/10/2024 08:30"
  plantName: string;
  moisture: number;
  result: 'Cần tưới' | 'Chưa cần' | 'Đã bơm tự động';
  waterAmount?: number;
  isAutoAction?: boolean;
}

export interface TestScenario {
  id: number;
  title: string;
  description: string;
  plantName: string;
  moisture: number;
  expectedResult: 'Cần tưới' | 'Chưa cần';
  explanation: string;
}

export type PumpStatus = 'IDLE' | 'PUMPING' | 'COMPLETED' | 'STOPPED';

export interface RealtimeAlert {
  id: string;
  timestamp: string;
  plantName: string;
  moisture: number;
  threshold: number;
  type: 'WARNING_LOW' | 'PUMP_ACTIVE' | 'PUMP_SUCCESS' | 'INFO';
  message: string;
}
