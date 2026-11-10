import React from 'react';
import { X, CheckCircle, Info } from 'lucide-react';

interface SketchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SketchModal: React.FC<SketchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-slate-700 overflow-hidden">
        {/* Header modal */}
        <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h3 className="font-bold text-base">Bản vẽ tay gốc của học sinh</h3>
              <p className="text-xs text-slate-300">Phác thảo bằng bút chì – Trang 2 trong tài liệu đề tài</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân modal: hiển thị ảnh bản vẽ + các ghi chú đối chiếu */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Đối chiếu với bản mẫu phần mềm:</strong> Phần mềm đã được xây dựng trung thực 100% theo các thành phần ①–⑤ em đã vẽ trong hình dưới đây:
            </div>
          </div>

          <div className="border-2 border-slate-300 rounded-2xl overflow-hidden bg-slate-50 flex justify-center p-2">
            <img
              src="/assets/aistudio/giao_dien__1__7d10bf25.png"
              alt="Bản vẽ tay giao diện bằng bút chì của học sinh"
              className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm"
              onError={(e) => {
                // Fallback nếu cần
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('public')) {
                  target.src = '/public/assets/aistudio/giao_dien__1__7d10bf25.png';
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">1</span>
              <span><strong>Ô nhập tên cây:</strong> Cà chua, rau muống...</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">2</span>
              <span><strong>Độ ẩm đất:</strong> Gõ số hoặc kéo thanh trượt 0–100%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">3</span>
              <span><strong>Nút lớn:</strong> Bấm [KIỂM TRA]</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">4</span>
              <span><strong>Hiện kết quả:</strong> Nền ĐỎ (Cần tưới) / XANH (Chưa cần)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 flex items-center gap-2 sm:col-span-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0">5</span>
              <span><strong>Bảng lịch sử:</strong> Lưu ngày, cây, độ ẩm, kết quả</span>
            </div>
          </div>
        </div>

        {/* Footer modal */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
