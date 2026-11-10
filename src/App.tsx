import React, { useState, useEffect } from 'react';
import { SensorRelayDashboard } from './components/SensorRelayDashboard';
import { WateringApp } from './components/WateringApp';
import { ProjectGuide } from './components/ProjectGuide';
import { SketchModal } from './components/SketchModal';
import { CheckHistoryItem, TestScenario } from './types';
import { INITIAL_HISTORY } from './data/plantData';
import { 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon, 
  BookOpen, 
  Smartphone,
  Zap,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [isSketchOpen, setIsSketchOpen] = useState<boolean>(false);
  const [showSecondaryInfo, setShowSecondaryInfo] = useState<boolean>(false);
  const [isGrandparentMode, setIsGrandparentMode] = useState<boolean>(false);

  // Lịch sử kiểm tra và bơm nước
  const [history, setHistory] = useState<CheckHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('plant_watering_history');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return INITIAL_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plant_watering_history', JSON.stringify(history));
    } catch {
      //
    }
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* HEADER TINH GỌN, CHUYÊN NGHIỆP */}
      <header className="bg-slate-900 text-white shadow-md border-b-4 border-indigo-500 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-inner shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/30">
                  Hệ Thống IoT
                </span>
                <span className="text-slate-400 text-xs">
                  Nhóm Cây Xanh – Lớp 7A
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Xử Lý Cảm Biến Độ Ẩm &amp; Quản Lý Rơ-Le Bơm Nước
              </h1>
            </div>
          </div>

          {/* Nút xem bản vẽ tay hoặc mở rộng */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSketchOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              title="Xem bản vẽ tay bút chì gốc của học sinh"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Bản vẽ bút chì</span>
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH: TẬP TRUNG 100% VÀO CẢM BIẾN, RƠ-LE VÀ CHẬU CÂY 3D */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        <SensorRelayDashboard
          history={history}
          setHistory={setHistory}
        />

        {/* KHU VỰC THU GỌN: TÀI LIỆU VÀ BẢN MẪU ĐIỆN THOẠI BAN ĐẦU (MẶC ĐỊNH ẨN) */}
        <div className="pt-4 border-t border-slate-300">
          <div className="flex justify-center">
            <button
              onClick={() => setShowSecondaryInfo(!showSecondaryInfo)}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              {showSecondaryInfo ? (
                <>
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                  <span>Thu gọn tài liệu tham khảo &amp; bản mẫu điện thoại thủ công</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                  <span>Mở rộng: Xem tài liệu đề tài chi tiết &amp; bản mẫu điện thoại thủ công</span>
                </>
              )}
            </button>
          </div>

          {/* Nội dung tham khảo khi mở rộng */}
          {showSecondaryInfo && (
            <div className="mt-6 space-y-8 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 flex justify-center">
                  <WateringApp
                    isGrandparentMode={isGrandparentMode}
                    setIsGrandparentMode={setIsGrandparentMode}
                    history={history}
                    setHistory={setHistory}
                  />
                </div>
                <div className="lg:col-span-6">
                  <ProjectGuide
                    onApplyScenario={() => {}}
                    onOpenSketchModal={() => setIsSketchOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER TINH GỌN */}
      <footer className="bg-slate-900 text-slate-400 py-4 text-center text-xs border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2 text-slate-500">
          <span>Đề tài Công nghệ kỹ thuật – Nhóm Cây Xanh, Lớp 7A</span>
          <span>Mô phỏng 3D WebGL • Cảm biến độ ẩm đất • Quản lý rơ-le bơm mini 5V</span>
        </div>
      </footer>

      {/* MODAL BẢN VẼ TAY BÚT CHÌ */}
      <SketchModal
        isOpen={isSketchOpen}
        onClose={() => setIsSketchOpen(false)}
      />
    </div>
  );
}
