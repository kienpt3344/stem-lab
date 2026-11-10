import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Power, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Square, 
  Sun, 
  CloudRain, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  BellRing,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { PlantThreshold, CheckHistoryItem, PumpStatus, RealtimeAlert } from '../types';
import { DEFAULT_PLANTS } from '../data/plantData';
import { soundAlert } from '../utils/audioAlert';
import { PlantScene3D } from './PlantScene3D';

interface SensorRelayDashboardProps {
  history: CheckHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<CheckHistoryItem[]>>;
}

export const SensorRelayDashboard: React.FC<SensorRelayDashboardProps> = ({
  history,
  setHistory,
}) => {
  // 1. CHỌN LOẠI CÂY TRỒNG
  const [selectedPlantName, setSelectedPlantName] = useState<string>('Cà chua');
  const currentPlant: PlantThreshold =
    DEFAULT_PLANTS.find((p) => p.name === selectedPlantName) || DEFAULT_PLANTS[0];

  // 2. GIÁ TRỊ CẢM BIẾN ĐỘ ẨM ĐẤT (%)
  // Ban đầu đặt 28% (dưới ngưỡng 40%) để người dùng thấy ngay phản ứng của cảm biến & chậu 3D
  const [moisture, setMoisture] = useState<number>(28);

  // 3. QUẢN LÝ RƠ-LE MÁY BƠM
  const [isAutoPump, setIsAutoPump] = useState<boolean>(true);
  const [pumpStatus, setPumpStatus] = useState<PumpStatus>('IDLE');
  const [pumpedMl, setPumpedMl] = useState<number>(0);

  // 4. ÂM THANH & THÔNG BÁO TỨC THỜI
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const pumpTimerRef = useRef<number | null>(null);

  // Đồng bộ âm thanh
  useEffect(() => {
    soundAlert.enabled = soundEnabled;
  }, [soundEnabled]);

  // Hàm phát thông báo tức thời
  const triggerAlert = (
    type: 'WARNING_LOW' | 'PUMP_ACTIVE' | 'PUMP_SUCCESS' | 'INFO',
    message: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newAlert: RealtimeAlert = {
      id: 'al-' + Date.now() + Math.random(),
      timestamp: timeStr,
      plantName: currentPlant.name,
      moisture,
      threshold: currentPlant.threshold,
      type,
      message,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]); // Chỉ giữ 5 thông báo mới nhất cho gọn

    if (type === 'WARNING_LOW') {
      soundAlert.playAlertWarning();
    } else if (type === 'PUMP_SUCCESS') {
      soundAlert.playSuccessChime();
    } else if (type === 'PUMP_ACTIVE') {
      soundAlert.playPumpHum();
    }

    // Bắn Web Notification nếu được cấp quyền
    if (browserNotificationAllowed && 'Notification' in window) {
      try {
        new Notification(
          type === 'WARNING_LOW'
            ? `⚠️ CẢNH BÁO ĐẤT KHÔ: ${currentPlant.name}`
            : type === 'PUMP_SUCCESS'
            ? `✅ ĐÃ BƠM ĐỦ NƯỚC: ${currentPlant.name}`
            : `💧 THÔNG BÁO RƠ-LE`,
          { body: message, tag: 'soil-alert' }
        );
      } catch {
        // ignore
      }
    }
  };

  // Kích hoạt rơ-le bơm nước
  const activatePump = (amount: number, isAuto: boolean) => {
    if (pumpStatus === 'PUMPING') return;

    setPumpStatus('PUMPING');
    setPumpedMl(0);

    triggerAlert(
      'PUMP_ACTIVE',
      isAuto
        ? `Rơ-le TỰ ĐỘNG ĐÓNG: Đang bơm ${amount} ml nước cho ${currentPlant.name}...`
        : `Người dùng đóng rơ-le thủ công: Đang bơm ${amount} ml...`
    );

    if (pumpTimerRef.current) clearInterval(pumpTimerRef.current);

    let current = 0;
    pumpTimerRef.current = window.setInterval(() => {
      current += 25;
      soundAlert.playPumpHum();

      if (current >= amount) {
        // Rơ-le tự ngắt khi bơm đủ lượng nước
        if (pumpTimerRef.current) clearInterval(pumpTimerRef.current);
        setPumpedMl(amount);
        setPumpStatus('COMPLETED');

        // Phục hồi độ ẩm đất sau khi tưới
        const recoveredMoisture = Math.min(100, currentPlant.threshold + 30);
        setMoisture(recoveredMoisture);

        // Lưu vào lịch sử
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        setHistory((prev) => [
          {
            id: 'h-' + Date.now(),
            date: dateStr,
            plantName: currentPlant.name,
            moisture: recoveredMoisture,
            result: 'Đã bơm tự động',
            waterAmount: amount,
            isAutoAction: true,
          },
          ...prev,
        ]);

        triggerAlert(
          'PUMP_SUCCESS',
          `Rơ-le TỰ ĐỘNG NGẮT! Đã bơm đủ ${amount} ml. Độ ẩm đất tăng lên ${recoveredMoisture}%.`
        );

        setTimeout(() => {
          setPumpStatus('IDLE');
        }, 2500);
      } else {
        setPumpedMl(current);
      }
    }, 280);
  };

  // Ngắt rơ-le khẩn cấp (E-Stop)
  const emergencyStop = () => {
    if (pumpTimerRef.current) {
      clearInterval(pumpTimerRef.current);
      pumpTimerRef.current = null;
    }
    setPumpStatus('STOPPED');
    triggerAlert('INFO', 'ĐÃ NGẮT RƠ-LE KHẨN CẤP! Máy bơm đã dừng ngay lập tức.');
    setTimeout(() => {
      setPumpStatus('IDLE');
    }, 1800);
  };

  // Xử lý tự động khi cảm biến độ ẩm < ngưỡng
  useEffect(() => {
    if (pumpStatus !== 'IDLE') return;

    if (moisture < currentPlant.threshold) {
      if (isAutoPump) {
        triggerAlert(
          'WARNING_LOW',
          `Cảm biến báo độ ẩm ${moisture}% (< ${currentPlant.threshold}%). Rơ-le chuẩn bị kích hoạt bơm ${currentPlant.waterAmount} ml...`
        );
        activatePump(currentPlant.waterAmount, true);
      } else {
        triggerAlert(
          'WARNING_LOW',
          `Cảm biến báo độ ẩm ${moisture}% (< ${currentPlant.threshold}%). CẦN TƯỚI! (Chế độ tự động đang tắt).`
        );
      }
    }
  }, [moisture, currentPlant.threshold, isAutoPump, pumpStatus]);

  // Xin quyền thông báo trình duyệt
  const requestNotify = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setBrowserNotificationAllowed(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* KHU VỰC CHÍNH: 3D PLANT (TRÁI) & CONTROLLER CẢM BIẾN + RƠ-LE (PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CỘT TRÁI: MÔ HÌNH CHẬU CÂY 3D TƯƠNG TÁC */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪴</span>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-base">
                    Mô Phỏng 3D Quá Trình Khô Héo &amp; Phục Hồi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Đất và lá cây phản ứng vật lý tức thì theo độ ẩm cảm biến
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                moisture < currentPlant.threshold
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {moisture < currentPlant.threshold ? '🥀 Khô héo rủ' : '🌿 Đủ ẩm tươi tốt'}
              </span>
            </div>

            {/* Canvas 3D */}
            <PlantScene3D
              moisture={moisture}
              threshold={currentPlant.threshold}
              isPumping={pumpStatus === 'PUMPING'}
              plantName={currentPlant.name}
            />
          </div>

          {/* Thanh gạt thử nghiệm độ ẩm trực tiếp cho chậu cây 3D */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Kéo thanh trượt để thử nghiệm độ ẩm đất tức thời:</span>
              </span>
              <span className="text-sm font-black text-indigo-600">{moisture}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={moisture}
              onChange={(e) => setMoisture(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <button
                onClick={() => setMoisture(20)}
                className="hover:text-red-600 transition flex items-center gap-0.5"
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Khô cằn (20%)</span>
              </button>
              <span className="text-slate-400">Ngưỡng cây: {currentPlant.threshold}%</span>
              <button
                onClick={() => setMoisture(80)}
                className="hover:text-blue-600 transition flex items-center gap-0.5"
              >
                <CloudRain className="w-3 h-3 text-blue-500" />
                <span>Ẩm ướt (80%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TẬP TRUNG 100% VÀO XỬ LÝ CẢM BIẾN & QUẢN LÝ RƠ-LE BƠM */}
        <div className="lg:col-span-6 space-y-5">
          {/* PHẦN 1: XỬ LÝ CỦA CẢM BIẾN ĐỘ ẨM ĐẤT */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200 space-y-4">
            {/* Header cảm biến */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    1. Xử Lý Tín Hiệu Cảm Biến Độ Ẩm
                  </h3>
                  <p className="text-xs text-slate-500">Tiếp nhận và so sánh với ngưỡng sinh học</p>
                </div>
              </div>

              {/* Lựa chọn loại cây */}
              <div className="flex gap-1">
                {DEFAULT_PLANTS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedPlantName(p.name);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      selectedPlantName === p.name
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span className="hidden sm:inline">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Màn hình hiển thị số liệu cảm biến */}
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
              moisture < currentPlant.threshold
                ? 'bg-red-50 border-red-400 text-red-900'
                : 'bg-emerald-50 border-emerald-400 text-emerald-900'
            }`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block opacity-80">
                  Số đo cảm biến tức thời
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-mono tracking-tight">
                    {moisture}
                  </span>
                  <span className="text-xl font-bold">%</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                  moisture < currentPlant.threshold
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {moisture < currentPlant.threshold ? '🚨 DƯỚI NGƯỠNG (THIẾU NƯỚC)' : '✅ ĐỦ ĐỘ ẨM (AN TOÀN)'}
                </span>
                <p className="text-xs mt-1 font-medium opacity-85">
                  Cây {currentPlant.name} • Ngưỡng cần tưới: <strong>&lt; {currentPlant.threshold}%</strong>
                </p>
              </div>
            </div>

            {/* Thanh tiến trình độ ẩm và mốc ngưỡng */}
            <div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    moisture < currentPlant.threshold ? 'bg-red-600' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${moisture}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-1">
                <span>0% (Khô kiệt)</span>
                <span className="text-red-600 font-extrabold">Mốc kích hoạt rơ-le: {currentPlant.threshold}%</span>
                <span>100% (Ướt đẫm)</span>
              </div>
            </div>
          </div>

          {/* PHẦN 2: QUẢN LÝ RƠ-LE MÁY BƠM NƯỚC */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border-2 border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    2. Quản Lý Rơ-Le Máy Bơm Nước
                  </h3>
                  <p className="text-xs text-slate-400">Điều khiển đóng/ngắt mạch máy bơm mini 5V</p>
                </div>
              </div>

              {/* Công tắc BẬT/TẮT TỰ ĐỘNG BƠM */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Tự động:</span>
                <button
                  onClick={() => setIsAutoPump(!isAutoPump)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutoPump ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title="Bật/Tắt chế độ tự động đóng rơ-le khi đất khô"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAutoPump ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Trạng thái Rơ-le hiện tại */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-mono block">
                  Trạng thái rơ-le máy bơm
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    pumpStatus === 'PUMPING'
                      ? 'bg-blue-400 animate-ping'
                      : pumpStatus === 'COMPLETED'
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
                  }`}></span>
                  <span className="text-lg font-black font-mono">
                    {pumpStatus === 'PUMPING'
                      ? 'RƠ-LE ĐANG ĐÓNG (BƠM BẬT)'
                      : pumpStatus === 'COMPLETED'
                      ? 'RƠ-LE NGẮT (ĐÃ ĐỦ NƯỚC)'
                      : 'RƠ-LE HỞ (BƠM TẮT)'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {pumpedMl} / {currentPlant.waterAmount} <span className="text-sm text-slate-400">ml</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {pumpStatus === 'PUMPING' ? '⚡ Đang cấp nước...' : 'Định mức ngắt tự động'}
                </span>
              </div>
            </div>

            {/* Tiến trình bơm */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${(pumpedMl / currentPlant.waterAmount) * 100}%` }}
              ></div>
            </div>

            {/* Nút điều khiển rơ-le */}
            <div className="flex gap-2.5 pt-1">
              {pumpStatus === 'PUMPING' ? (
                <button
                  onClick={emergencyStop}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>NGẮT RƠ-LE KHẨN CẤP (E-STOP)</span>
                </button>
              ) : (
                <button
                  onClick={() => activatePump(currentPlant.waterAmount, false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                >
                  <Droplet className="w-4 h-4 fill-white" />
                  <span>Kích hoạt rơ-le bơm thủ công ({currentPlant.waterAmount} ml)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI NHẬT KÝ THÔNG BÁO TỨC THỜI CỦA RƠ-LE (GỌN GÀNG, 3-4 DÒNG) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔔</span>
          <span className="text-xs font-bold text-slate-700">
            Thông báo tức thời gần nhất của cảm biến &amp; rơ-le:
          </span>
          <div className="text-xs text-slate-600 truncate max-w-xl font-medium">
            {alerts.length > 0 ? (
              <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                <strong className="font-mono text-slate-500">[{alerts[0].timestamp}]</strong> {alerts[0].message}
              </span>
            ) : (
              <span className="italic text-slate-400">Chưa có sự kiện nào. Hãy kéo độ ẩm xuống dưới ngưỡng để thử nghiệm!</span>
            )}
          </div>
        </div>

        {/* Nút bật âm thanh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="Bật/Tắt còi báo âm thanh khi đất khô hoặc khi bơm"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Còi: Bật' : 'Còi: Tắt'}</span>
          </button>

          {!browserNotificationAllowed && (
            <button
              onClick={requestNotify}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              title="Bật thông báo đẩy ra màn hình máy tính"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-300" />
              <span>Bật thông báo đẩy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
