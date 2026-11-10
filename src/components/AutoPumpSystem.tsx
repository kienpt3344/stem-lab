import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  Play, 
  Square, 
  Power, 
  Sparkles, 
  Droplet, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Sun, 
  CloudRain, 
  RefreshCw 
} from 'lucide-react';
import { PlantThreshold, CheckHistoryItem, PumpStatus, RealtimeAlert } from '../types';
import { DEFAULT_PLANTS } from '../data/plantData';
import { soundAlert } from '../utils/audioAlert';

interface AutoPumpSystemProps {
  onAddHistory: (item: CheckHistoryItem) => void;
  isGrandparentMode: boolean;
}

export const AutoPumpSystem: React.FC<AutoPumpSystemProps> = ({
  onAddHistory,
  isGrandparentMode,
}) => {
  // Chọn loại cây đang giám sát
  const [selectedPlantName, setSelectedPlantName] = useState<string>('Cà chua');
  
  // Trạng thái cảm biến độ ẩm hiện tại (%)
  const [moisture, setMoisture] = useState<number>(32); // Khởi tạo mức hơi thấp để thấy rõ cảnh báo
  
  // Chế độ tự động bơm nước (Auto-Pump Mode)
  const [isAutoPumpEnabled, setIsAutoPumpEnabled] = useState<boolean>(true);
  
  // Trạng thái máy bơm
  const [pumpStatus, setPumpStatus] = useState<PumpStatus>('IDLE');
  
  // Lượng nước đã bơm được trong chu kỳ hiện tại (ml)
  const [pumpedAmount, setPumpedAmount] = useState<number>(0);
  
  // Quyền thông báo trình duyệt Web Notification
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Âm thanh còi báo
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Danh sách thông báo tức thời gần nhất (Alerts log)
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);

  // Tốc độ giả lập bốc hơi đất (đo liên tục sau mỗi 3s)
  const [isSensorActive, setIsSensorActive] = useState<boolean>(true);

  // Tham chiếu timer của máy bơm
  const pumpIntervalRef = useRef<number | null>(null);

  // Tìm thông số loại cây hiện tại
  const currentPlant: PlantThreshold = 
    DEFAULT_PLANTS.find((p) => p.name === selectedPlantName) || DEFAULT_PLANTS[0];

  // Đồng bộ cài đặt âm thanh
  useEffect(() => {
    soundAlert.enabled = soundEnabled;
  }, [soundEnabled]);

  // Yêu cầu quyền thông báo trình duyệt
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('Hệ thống tưới cây tự động', {
            body: 'Đã kết nối! Bạn sẽ nhận thông báo tức thời khi độ ẩm đất xuống thấp.',
            icon: '🌱',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  // Hàm phát thông báo tức thời (vừa lưu vào danh sách, vừa bắn Web Notification, vừa kêu bíp)
  const pushInstantAlert = (
    type: 'WARNING_LOW' | 'PUMP_ACTIVE' | 'PUMP_SUCCESS' | 'INFO',
    message: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newAlert: RealtimeAlert = {
      id: 'alert-' + Date.now() + Math.random(),
      timestamp: timeStr,
      plantName: currentPlant.name,
      moisture,
      threshold: currentPlant.threshold,
      type,
      message,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 15)]);

    // Âm thanh
    if (type === 'WARNING_LOW') {
      soundAlert.playAlertWarning();
    } else if (type === 'PUMP_SUCCESS') {
      soundAlert.playSuccessChime();
    } else if (type === 'PUMP_ACTIVE') {
      soundAlert.playPumpHum();
    }

    // Bắn Web Notification nếu được cấp quyền
    if (notificationPermission === 'granted' && 'Notification' in window) {
      try {
        new Notification(
          type === 'WARNING_LOW'
            ? `⚠️ CẢNH BÁO TỨC THỜI: ${currentPlant.name} thiếu nước!`
            : type === 'PUMP_SUCCESS'
            ? `✅ ĐÃ BƠM NƯỚC XONG: ${currentPlant.name}`
            : `💧 THÔNG BÁO TƯỚI CÂY`,
          {
            body: message,
            tag: 'irrigation-alert',
          }
        );
      } catch {
        // ignore
      }
    }
  };

  // Khởi động chu trình bơm nước
  const startPumping = (targetAmount: number, source: 'AUTO' | 'MANUAL') => {
    if (pumpStatus === 'PUMPING') return;

    setPumpStatus('PUMPING');
    setPumpedAmount(0);

    pushInstantAlert(
      'PUMP_ACTIVE',
      source === 'AUTO'
        ? `Rơ-le tự động BẬT: Đang bơm ${targetAmount} ml nước cho chậu ${currentPlant.name}...`
        : `Người dùng bật bơm thủ công: Đang bơm ${targetAmount} ml nước...`
    );

    // Mô phỏng bơm nước tăng dần 25ml mỗi 300ms
    if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);

    let currentWater = 0;
    pumpIntervalRef.current = window.setInterval(() => {
      currentWater += 25;
      soundAlert.playPumpHum();

      if (currentWater >= targetAmount) {
        // Đã bơm đủ lượng nước quy định -> TỰ ĐỘNG NGẮT BƠM
        if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
        setPumpedAmount(targetAmount);
        setPumpStatus('COMPLETED');

        // Độ ẩm đất tăng lên sau khi nước ngấm
        const newMoisture = Math.min(100, Math.max(70, currentPlant.threshold + 25));
        setMoisture(newMoisture);

        // Lưu vào lịch sử chung
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        onAddHistory({
          id: 'hist-auto-' + Date.now(),
          date: `${day}/${month} ${hours}:${minutes}`,
          plantName: currentPlant.name,
          moisture: newMoisture,
          result: 'Đã bơm tự động',
          waterAmount: targetAmount,
          isAutoAction: true,
        });

        pushInstantAlert(
          'PUMP_SUCCESS',
          `Bơm đã TỰ ĐỘNG NGẮT sau khi bơm đủ ${targetAmount} ml! Độ ẩm đất đã tăng lên ${newMoisture}% (An toàn).`
        );

        // Chuyển lại trạng thái IDLE sau 3 giây
        setTimeout(() => {
          setPumpStatus('IDLE');
        }, 3000);
      } else {
        setPumpedAmount(currentWater);
      }
    }, 300);
  };

  // Dừng bơm khẩn cấp (Emergency Stop)
  const stopPumpEmergency = () => {
    if (pumpIntervalRef.current) {
      clearInterval(pumpIntervalRef.current);
      pumpIntervalRef.current = null;
    }
    setPumpStatus('STOPPED');
    pushInstantAlert('INFO', 'ĐÃ DỪNG BƠM KHẨN CẤP! Rơ-le máy bơm đã ngắt ngay lập tức.');
    setTimeout(() => {
      setPumpStatus('IDLE');
    }, 2000);
  };

  // Vòng lặp mô phỏng cảm biến IoT đo liên tục (đất khô dần theo thời gian)
  useEffect(() => {
    if (!isSensorActive) return;

    const sensorInterval = setInterval(() => {
      // Khi không bơm, đất có thể giảm nhẹ 1-2% do bốc hơi nước
      if (pumpStatus === 'IDLE') {
        setMoisture((prev) => {
          const next = Math.max(5, prev - 1);
          return next;
        });
      }
    }, 4000);

    return () => clearInterval(sensorInterval);
  }, [isSensorActive, pumpStatus]);

  // Kiểm tra độ ẩm theo thời gian thực: Nếu < ngưỡng và bật Auto-Pump -> Kích hoạt bơm tức thì
  useEffect(() => {
    if (pumpStatus !== 'IDLE') return;

    if (moisture < currentPlant.threshold) {
      if (isAutoPumpEnabled) {
        // Phát thông báo khẩn và tự động kích hoạt máy bơm
        pushInstantAlert(
          'WARNING_LOW',
          `Độ ẩm đất đo được là ${moisture}% (thấp hơn ngưỡng ${currentPlant.threshold}%). Đang tự động kích hoạt máy bơm ${currentPlant.waterAmount} ml...`
        );
        startPumping(currentPlant.waterAmount, 'AUTO');
      } else {
        // Chỉ phát thông báo nhắc nhở chứ không tự bơm
        pushInstantAlert(
          'WARNING_LOW',
          `Độ ẩm đất chỉ còn ${moisture}% (ngưỡng: ${currentPlant.threshold}%). CẦN TƯỚI! (Chế độ tự bơm đang tắt, vui lòng bật bơm bằng tay).`
        );
      }
    }
  }, [moisture, currentPlant.threshold, isAutoPumpEnabled, pumpStatus]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* THANH ĐIỀU KHIỂN TRUNG TÂM IOT & BƠM TỰ ĐỘNG */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-slate-700 space-y-4">
        {/* Header hệ thống */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span className="text-xs font-mono font-bold text-emerald-600 uppercase">
                  Cảm biến IoT đang trực tiếp gửi dữ liệu
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800">
                Hệ Thống Bơm Tự Động &amp; Nhận Thông Báo Tức Thời
              </h2>
            </div>
          </div>

          {/* Nút bật thông báo & âm thanh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Bật/Tắt còi báo âm thanh"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Còi: Bật' : 'Còi: Tắt'}</span>
            </button>

            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Bật thông báo đẩy của trình duyệt lên màn hình"
              >
                <BellRing className="w-4 h-4 text-amber-300" />
                <span>Cho phép thông báo màn hình</span>
              </button>
            )}
          </div>
        </div>

        {/* Khu vực chọn cây và trạng thái ngưỡng */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-600">Chọn chậu cây đang theo dõi:</label>
            <div className="flex gap-1.5 flex-wrap">
              {DEFAULT_PLANTS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setSelectedPlantName(p.name);
                    // Đặt lại một mức ẩm tiêu chuẩn
                    setMoisture(35);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                    selectedPlantName === p.name
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-7 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-800">Quy chuẩn cây {currentPlant.name}:</span>
              <div className="text-slate-600">
                Ngưỡng tưới: <strong className="text-red-600">&lt; {currentPlant.threshold}%</strong> • Lượng nước tưới: <strong className="text-blue-600">{currentPlant.waterAmount} ml</strong>
              </div>
            </div>

            {/* Công tắc BẬT/TẮT TỰ ĐỘNG BƠM */}
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Tự động bơm:</span>
              <button
                onClick={() => setIsAutoPumpEnabled(!isAutoPumpEnabled)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoPumpEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAutoPumpEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* KHỐI ĐO ĐỘ ẨM TỨC THỜI & ĐỒ HỌA MÁY BƠM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Cột 1: Đồng hồ cảm biến thời gian thực */}
          <div className={`p-5 rounded-2xl border-3 transition-all ${
            moisture < currentPlant.threshold
              ? 'bg-red-50 border-red-500 ring-4 ring-red-200'
              : 'bg-emerald-50 border-emerald-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Độ ẩm cảm biến đo được tức thì</span>
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                moisture < currentPlant.threshold
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}>
                {moisture < currentPlant.threshold ? '🚨 DƯỚI NGƯỠNG' : '✅ ĐỦ ẨM'}
              </span>
            </div>

            {/* Số đo độ ẩm to đùng */}
            <div className="flex items-baseline gap-2 justify-center py-2">
              <span className={`font-black tracking-tight ${
                isGrandparentMode ? 'text-6xl' : 'text-5xl'
              } ${
                moisture < currentPlant.threshold ? 'text-red-600' : 'text-emerald-700'
              }`}>
                {moisture}
              </span>
              <span className="text-2xl font-bold text-slate-500">%</span>
            </div>

            {/* Thanh tiến trình độ ẩm */}
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-300">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  moisture < currentPlant.threshold
                    ? 'bg-red-600'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${moisture}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
              <span>0% (Khô hạn)</span>
              <span className="text-red-600 font-extrabold">Ngưỡng: {currentPlant.threshold}%</span>
              <span>100% (Ẩm ướt)</span>
            </div>
          </div>

          {/* Cột 2: Trạng thái và mô phỏng Rơ-le Máy bơm nước */}
          <div className="p-5 rounded-2xl border-3 border-slate-700 bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <Power className="w-4 h-4 text-emerald-400" />
                  <span>RƠ-LE MÁY BƠM NƯỚC MINI</span>
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  pumpStatus === 'PUMPING'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : pumpStatus === 'COMPLETED'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {pumpStatus === 'PUMPING' ? 'ĐANG BƠM NƯỚC 💧' : pumpStatus === 'COMPLETED' ? 'ĐÃ NGẮT BƠM ✅' : 'CHỜ (IDLE)'}
                </span>
              </div>

              {/* Tiến trình bơm nước */}
              <div className="py-2 text-center">
                <div className="text-3xl font-black text-blue-400 font-mono">
                  {pumpedAmount} / {currentPlant.waterAmount} <span className="text-lg">ml</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {pumpStatus === 'PUMPING'
                    ? '⚡ Đang điều chỉnh bơm đúng liều lượng sinh học...'
                    : 'Van nước đang đóng kín để bảo vệ rễ cây'}
                </p>
              </div>

              {/* Thanh nước bơm */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-2">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${(pumpedAmount / currentPlant.waterAmount) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Các nút bấm điều khiển bơm bằng tay hoặc dừng khẩn cấp */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
              {pumpStatus === 'PUMPING' ? (
                <button
                  onClick={stopPumpEmergency}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>DỪNG BƠM KHẨN CẤP (E-STOP)</span>
                </button>
              ) : (
                <button
                  onClick={() => startPumping(currentPlant.waterAmount, 'MANUAL')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <Droplet className="w-4 h-4 fill-white" />
                  <span>Kích hoạt bơm thủ công ({currentPlant.waterAmount} ml)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CÁC NÚT TẠO TÌNH HUỐNG THỬ NGHIỆM TỨC THÌ (CHO HỌC SINH THUYẾT TRÌNH) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>🎯</span>
              <span>Bộ tạo tình huống thử nghiệm phản ứng tức thời:</span>
            </span>
            <span className="text-[11px] text-slate-500">Bấm nút để thay đổi tức thì giá trị cảm biến</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                // Tình huống đất khô kiệt
                setMoisture(currentPlant.threshold - 12);
              }}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Nắng gắt (Làm đất khô {currentPlant.threshold - 12}%)</span>
            </button>

            <button
              onClick={() => {
                // Tình huống sau mưa hoặc sau tưới
                setMoisture(75);
                pushInstantAlert('INFO', `Đất được cấp ẩm lên 75%. Hệ thống tự động giữ trạng thái an toàn.`);
              }}
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <CloudRain className="w-4 h-4 text-blue-600" />
              <span>Trời mưa (Đất ẩm 75%)</span>
            </button>

            <button
              onClick={() => {
                setMoisture(50);
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Đặt lại độ ẩm vừa phải (50%)</span>
            </button>
          </div>
        </div>

        {/* NHẬT KÝ THÔNG BÁO TỨC THỜI (REALTIME ALERT LOG) */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Dòng thông báo tức thời của hệ thống</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {alerts.length} thông báo gần nhất
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 animate-in fade-in duration-200 ${
                    al.type === 'WARNING_LOW'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : al.type === 'PUMP_ACTIVE'
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : al.type === 'PUMP_SUCCESS'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">
                      {al.type === 'WARNING_LOW' && '🚨'}
                      {al.type === 'PUMP_ACTIVE' && '💧'}
                      {al.type === 'PUMP_SUCCESS' && '✅'}
                      {al.type === 'INFO' && 'ℹ️'}
                    </span>
                    <span>{al.message}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] opacity-70">
                    {al.timestamp}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                Hệ thống đang hoạt động ổn định. Khi phát hiện thay đổi độ ẩm, thông báo tức thời sẽ hiện tại đây.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
