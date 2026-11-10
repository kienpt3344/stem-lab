import React, { useState, useEffect } from 'react';
import { Droplet, Leaf, RotateCcw, Volume2, Sparkles, CheckCircle2, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { PlantThreshold, CheckHistoryItem, TestScenario } from '../types';
import { DEFAULT_PLANTS, INITIAL_HISTORY } from '../data/plantData';

interface WateringAppProps {
  onSelectTestScenario?: (scenario: TestScenario) => void;
  presetScenario?: TestScenario | null;
  onClearPresetScenario?: () => void;
  isGrandparentMode: boolean;
  setIsGrandparentMode: (val: boolean) => void;
  history: CheckHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<CheckHistoryItem[]>>;
  onOpenAutoPumpTab?: () => void;
}

export const WateringApp: React.FC<WateringAppProps> = ({
  presetScenario,
  onClearPresetScenario,
  isGrandparentMode,
  setIsGrandparentMode,
  history,
  setHistory,
  onOpenAutoPumpTab,
}) => {
  // Trạng thái nhập liệu theo đúng mục 3 của tài liệu
  const [plantName, setPlantName] = useState<string>('Cà chua');
  const [moisture, setMoisture] = useState<number>(35);
  
  // Trạng thái kết quả hiện tại
  const [currentResult, setCurrentResult] = useState<{
    plantName: string;
    moisture: number;
    threshold: number;
    waterAmount: number;
    needsWater: boolean;
    checkedAt: string;
  } | null>(null);

  // Tùy chọn danh sách cây có sẵn hoặc tự định nghĩa
  const [plantList] = useState<PlantThreshold[]>(DEFAULT_PLANTS);

  // Nhận tình huống thử nghiệm từ bên ngoài nếu học sinh bấm "Thử ngay tình huống này"
  useEffect(() => {
    if (presetScenario) {
      setPlantName(presetScenario.plantName);
      setMoisture(presetScenario.moisture);
      if (onClearPresetScenario) {
        onClearPresetScenario();
      }
    }
  }, [presetScenario, onClearPresetScenario]);

  // Tìm ngưỡng của cây hiện tại
  const getPlantInfo = (name: string): { threshold: number; waterAmount: number; emoji: string } => {
    const trimmed = name.trim().toLowerCase();
    const found = plantList.find(
      (p) => p.name.toLowerCase() === trimmed
    );
    if (found) {
      return {
        threshold: found.threshold,
        waterAmount: found.waterAmount,
        emoji: found.emoji,
      };
    }
    // Ngưỡng mặc định cho cây tự gõ khác
    return {
      threshold: 40,
      waterAmount: 200,
      emoji: '🌿',
    };
  };

  // Hàm xử lý khi bấm nút lớn "KIỂM TRA"
  const handleCheck = () => {
    const trimmedName = plantName.trim() || 'Cây trồng';
    const info = getPlantInfo(trimmedName);
    
    // Quy tắc mục 3 trong tài liệu:
    // Thấp hơn ngưỡng: CẦN TƯỚI!
    // Còn lại: Chưa cần tưới
    const needsWater = moisture < info.threshold;

    const now = new Date();
    // Định dạng ngày ngắn gọn giống bản vẽ (ví dụ: "29/10" hoặc "29/10 08:30")
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateFormatted = `${day}/${month} ${hours}:${minutes}`;

    const newResult = {
      plantName: trimmedName,
      moisture,
      threshold: info.threshold,
      waterAmount: info.waterAmount,
      needsWater,
      checkedAt: dateFormatted,
    };

    setCurrentResult(newResult);

    // Thêm vào lịch sử (đưa lên đầu danh sách)
    const newHistoryItem: CheckHistoryItem = {
      id: 'hist-' + Date.now(),
      date: dateFormatted,
      plantName: trimmedName,
      moisture,
      result: needsWater ? 'Cần tưới' : 'Chưa cần',
      waterAmount: needsWater ? info.waterAmount : 0,
    };

    setHistory((prev) => [newHistoryItem, ...prev]);

    // Phát âm thanh giọng nói hỗ trợ ông bà nếu có SpeechSynthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = needsWater
          ? `Cây ${trimmedName}, độ ẩm ${moisture} phần trăm. Cần tưới! Hãy tưới khoảng ${info.waterAmount} mililít nước.`
          : `Cây ${trimmedName}, độ ẩm ${moisture} phần trăm. Chưa cần tưới, đất còn đủ ẩm.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Trình duyệt không hỗ trợ vi-VN
      }
    }
  };

  // Đọc lại kết quả bằng giọng nói
  const handleSpeakResult = () => {
    if (!currentResult || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = currentResult.needsWater
        ? `Cây ${currentResult.plantName}, độ ẩm ${currentResult.moisture} phần trăm. Cần tưới! Hãy tưới khoảng ${currentResult.waterAmount} mililít nước.`
        : `Cây ${currentResult.plantName}, độ ẩm ${currentResult.moisture} phần trăm. Chưa cần tưới, đất còn đủ ẩm.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      //
    }
  };

  // Khôi phục lịch sử mẫu từ bản vẽ tay
  const handleResetHistory = () => {
    setHistory(INITIAL_HISTORY);
  };

  // Xóa trắng lịch sử
  const handleClearHistory = () => {
    setHistory([]);
  };

  const currentPlantInfo = getPlantInfo(plantName);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Khung máy điện thoại mô phỏng bản vẽ bút chì trang 2 */}
      <div className={`bg-white rounded-3xl shadow-2xl border-4 border-slate-700 overflow-hidden transition-all duration-200 ${
        isGrandparentMode ? 'text-lg ring-4 ring-amber-400' : 'text-base'
      }`}>
        {/* Loa thoại & camera mô phỏng đỉnh điện thoại */}
        <div className="bg-slate-800 text-slate-300 py-2 px-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Mô phỏng điện thoại học sinh</span>
          </div>
          <div className="w-16 h-1.5 bg-slate-600 rounded-full mx-auto"></div>
          <span>Pin 100% 🔋</span>
        </div>

        {/* Thanh công cụ hỗ trợ người dùng */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setIsGrandparentMode(!isGrandparentMode)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isGrandparentMode
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
            title="Bật chữ to và độ tương phản cao cho người lớn tuổi"
          >
            <span>👴👵</span>
            <span>{isGrandparentMode ? 'Đang bật Chế độ Ông Bà (Chữ to)' : 'Chế độ Ông Bà (Chữ to)'}</span>
          </button>
          
          <button
            onClick={handleResetHistory}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded hover:bg-amber-100"
            title="Tải lại 3 dòng mẫu trong bản vẽ tay"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dữ liệu mẫu</span>
          </button>
        </div>

        {/* Thanh chuyển nhanh sang Hệ thống Bơm tự động IoT */}
        {onOpenAutoPumpTab && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>Nâng cấp: Bơm tự động &amp; Báo tức thời</span>
            </div>
            <button
              onClick={onOpenAutoPumpTab}
              className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-sm"
            >
              Mở chế độ IoT ⚡
            </button>
          </div>
        )}

        {/* Nội dung ứng dụng chính theo đúng bản vẽ bút chì */}
        <div className="p-5 space-y-5">
          {/* TIÊU ĐỀ: Icon chậu cây + "NHẮC TƯỚI CÂY" */}
          <div className="text-center pb-2 border-b-2 border-slate-200">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mb-1 shadow-inner">
              <span className="text-3xl">🪴</span>
            </div>
            <h1 className={`font-black text-slate-800 tracking-wide uppercase ${
              isGrandparentMode ? 'text-2xl' : 'text-xl'
            }`}>
              NHẮC TƯỚI CÂY
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Đề tài sáng tạo: Nhóm Cây Xanh – Lớp 7A
            </p>
          </div>

          {/* CHỨC NĂNG 1: Nhập tên cây */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="plant-name-input" className={`font-bold text-slate-800 flex items-center gap-1.5 ${
                isGrandparentMode ? 'text-xl' : 'text-base'
              }`}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">1</span>
                <span>Tên cây:</span>
              </label>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                Ngưỡng: &lt;{currentPlantInfo.threshold}%
              </span>
            </div>

            {/* Ô nhập tên cây theo bản vẽ */}
            <div className="relative">
              <input
                id="plant-name-input"
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="Gõ tên cây (ví dụ: Cà chua, Rau muống)"
                className={`w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white shadow-inner transition ${
                  isGrandparentMode ? 'text-xl py-3' : 'text-base'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl">
                {currentPlantInfo.emoji}
              </span>
            </div>

            {/* Các nút chọn nhanh 4 cây trong bảng mục 4 của tài liệu để không cần gõ */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-slate-500 font-medium">Cây mẫu:</span>
              {plantList.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPlantName(p.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    plantName.trim().toLowerCase() === p.name.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CHỨC NĂNG 2: Nhập độ ẩm đất (%) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label htmlFor="moisture-number-input" className={`font-bold text-slate-800 flex items-center gap-1.5 ${
                isGrandparentMode ? 'text-xl' : 'text-base'
              }`}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">2</span>
                <span>Độ ẩm đất (%):</span>
              </label>

              {/* Ô gõ số từ 0 đến 100 */}
              <div className="flex items-center gap-1">
                <input
                  id="moisture-number-input"
                  type="number"
                  min="0"
                  max="100"
                  value={moisture}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 100) {
                      setMoisture(val);
                    } else if (val < 0) {
                      setMoisture(0);
                    } else if (val > 100) {
                      setMoisture(100);
                    }
                  }}
                  className={`w-20 text-center font-black bg-white border-2 border-slate-300 rounded-lg py-1 text-slate-900 focus:outline-none focus:border-emerald-600 shadow-sm ${
                    isGrandparentMode ? 'text-2xl py-1.5' : 'text-lg'
                  }`}
                />
                <span className="font-bold text-slate-600">%</span>
              </div>
            </div>

            {/* Thanh trượt kéo từ 0 đến 100 theo bản vẽ */}
            <div className="pt-2 px-1">
              <input
                type="range"
                min="0"
                max="100"
                value={moisture}
                onChange={(e) => setMoisture(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs font-bold text-slate-600 pt-1">
                <span>0 (Khô kiệt)</span>
                <span className="text-slate-700">50%</span>
                <span>100 (Ướt đẫm)</span>
              </div>
            </div>

            {/* Thước đo gợi ý nhanh */}
            <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <span>Trạng thái hiện tại:</span>
              <span className={`font-bold ${
                moisture < currentPlantInfo.threshold ? 'text-red-600' : 'text-emerald-700'
              }`}>
                {moisture < currentPlantInfo.threshold
                  ? `Dưới ngưỡng (${moisture}% < ${currentPlantInfo.threshold}%)`
                  : `Đủ ẩm (${moisture}% ≥ ${currentPlantInfo.threshold}%)`}
              </span>
            </div>
          </div>

          {/* CHỨC NĂNG 3: Nút lớn để KIỂM TRA */}
          <div>
            <button
              type="button"
              onClick={handleCheck}
              className={`w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-b-4 border-slate-950 ${
                isGrandparentMode ? 'py-4 text-2xl' : 'py-3.5 text-xl'
              }`}
            >
              <ArrowRight className="w-6 h-6 text-amber-300 stroke-[3]" />
              <span>KIỂM TRA</span>
            </button>
            <p className="text-center text-xs text-slate-600 mt-1.5">
              (Bấm nút để so độ ẩm {moisture}% với ngưỡng {currentPlantInfo.threshold}% của {plantName})
            </p>
          </div>

          {/* CHỨC NĂNG 4: Hiện kết quả ngay */}
          {/* Quy tắc: Thấp hơn ngưỡng: nền ĐỎ, chữ "CẦN TƯỚI!" và lượng nước; Còn lại: nền XANH, chữ "Chưa cần tưới" */}
          {currentResult ? (
            <div
              className={`rounded-2xl p-5 text-center transition-all shadow-md border-3 animate-in fade-in zoom-in-95 duration-200 ${
                currentResult.needsWater
                  ? 'bg-red-600 text-white border-red-800 shadow-red-200'
                  : 'bg-emerald-600 text-white border-emerald-800 shadow-emerald-200'
              }`}
            >
              {/* Biểu tượng theo đúng bản vẽ */}
              <div className="flex items-center justify-center mb-2">
                {currentResult.needsWater ? (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                    <Droplet className="w-10 h-10 text-white fill-white" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Leaf className="w-10 h-10 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Dòng chữ to đùng */}
              <div className={`font-black tracking-tight ${
                isGrandparentMode ? 'text-4xl' : 'text-3xl'
              }`}>
                {currentResult.needsWater ? 'CẦN TƯỚI!' : 'Chưa cần tưới'}
              </div>

              {/* Chi tiết lượng nước */}
              <div className={`mt-2 font-bold ${
                isGrandparentMode ? 'text-2xl' : 'text-xl'
              }`}>
                {currentResult.needsWater ? (
                  <span>Tưới khoảng {currentResult.waterAmount} ml</span>
                ) : (
                  <span className="text-emerald-100 font-semibold text-base">
                    Đất còn đủ độ ẩm ({currentResult.moisture}% ≥ {currentResult.threshold}%)
                  </span>
                )}
              </div>

              {/* Nút bấm đọc to cho ông bà nghe */}
              <button
                type="button"
                onClick={handleSpeakResult}
                className="mt-3 inline-flex items-center gap-1.5 bg-black/25 hover:bg-black/40 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Bấm để nghe đọc lại</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-slate-100 border-2 border-dashed border-slate-300 text-center text-slate-500 text-sm">
              <span className="block text-2xl mb-1">🔍</span>
              <p className="font-semibold">Chưa có kết quả</p>
              <p className="text-xs text-slate-600">Bấm nút "KIỂM TRA" ở trên để máy phân tích nhé!</p>
            </div>
          )}

          {/* CHỨC NĂNG 5: Lịch sử kiểm tra */}
          {/* Lưu lại mỗi lần kiểm tra gồm: ngày, tên cây, độ ẩm, kết quả */}
          <div className="space-y-2 pt-2 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className={`font-bold text-slate-800 flex items-center gap-1.5 ${
                isGrandparentMode ? 'text-xl' : 'text-base'
              }`}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">5</span>
                <span>Lịch sử kiểm tra</span>
              </h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1"
                  title="Xóa tất cả lịch sử"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>

            {/* Bảng lịch sử như bản vẽ bút chì */}
            <div className="border-2 border-slate-400 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-extrabold text-xs uppercase border-b-2 border-slate-400">
                    <th className="py-2 px-2 border-r border-slate-300">Ngày</th>
                    <th className="py-2 px-2 border-r border-slate-300">Cây</th>
                    <th className="py-2 px-2 border-r border-slate-300">Độ ẩm</th>
                    <th className="py-2 px-2">Kết quả</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-200 font-medium ${
                  isGrandparentMode ? 'text-base' : 'text-xs'
                }`}>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-2 text-slate-600 font-mono border-r border-slate-200">
                          {item.date}
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-800 border-r border-slate-200">
                          {item.plantName}
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-700 border-r border-slate-200">
                          {item.moisture}%
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                              item.result === 'Đã bơm tự động'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : item.result === 'Cần tưới'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {item.result === 'Đã bơm tự động' ? '🤖 Tự bơm' : item.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600 italic">
                        Chưa có lần kiểm tra nào được lưu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-600 text-center italic">
              Máy tự động lưu lại các lần kiểm tra vào bộ nhớ của điện thoại/máy tính.
            </p>
          </div>
        </div>

        {/* Thanh điều hướng chân điện thoại */}
        <div className="bg-slate-100 py-3 text-center border-t border-slate-200">
          <div className="w-32 h-1 bg-slate-400 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
