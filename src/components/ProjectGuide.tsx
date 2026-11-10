import React from 'react';
import { BookOpen, CheckCircle, Lightbulb, Play, Sliders, ShieldCheck, Cpu, Droplets, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_PLANTS, TEST_SCENARIOS } from '../data/plantData';
import { TestScenario } from '../types';

interface ProjectGuideProps {
  onApplyScenario: (scenario: TestScenario) => void;
  onOpenSketchModal: () => void;
}

export const ProjectGuide: React.FC<ProjectGuideProps> = ({
  onApplyScenario,
  onOpenSketchModal,
}) => {
  return (
    <div className="space-y-8">
      {/* KHỐI 1: GIẢI THÍCH NGUYÊN LÝ HOẠT ĐỘNG THEO TỪNG BƯỚC (NHIỆM VỤ 2) */}
      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-4 border-b pb-3 border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              1. Sản phẩm hoạt động như thế nào? (Theo từng bước)
            </h2>
            <p className="text-sm text-slate-500">
              Lời giải thích ngắn gọn, súc tích dành cho em thuyết trình trước Ban giám khảo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-2">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Thu thập thông tin</h3>
            <p className="text-sm text-slate-600">
              Người dùng nhập <strong>Tên cây</strong> (ví dụ Cà chua) và <strong>Độ ẩm đất</strong> đo được (gõ số hoặc kéo thanh trượt từ 0 đến 100%).
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm mb-2">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Tra cứu & So sánh</h3>
            <p className="text-sm text-slate-600">
              Khi bấm <strong>KIỂM TRA</strong>, máy sẽ tìm <em>ngưỡng chịu hạn</em> của cây trong bảng dữ liệu và so sánh với độ ẩm vừa nhập.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-2">
              3
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Phát tín hiệu trực quan</h3>
            <p className="text-sm text-slate-600">
              Nếu <strong>độ ẩm &lt; ngưỡng</strong>: báo <strong>ĐỎ “CẦN TƯỚI!”</strong> kèm lượng nước. Nếu <strong>độ ẩm ≥ ngưỡng</strong>: báo <strong>XANH “Chưa cần tưới”</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-2">
              4
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Ghi nhớ lịch sử</h3>
            <p className="text-sm text-slate-600">
              Tự động lưu lại ngày giờ, tên cây, độ ẩm và kết quả vào bảng lịch sử để cả gia đình theo dõi chu kỳ tưới.
            </p>
          </div>
        </div>

        {/* Công thức logic đơn giản */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-mono">
          <strong>💡 Thuật toán cốt lõi:</strong> Nếu (Độ ẩm nhập vào &lt; Ngưỡng của cây) ➔ KẾT QUẢ = ĐỎ: "CẦN TƯỚI!" (Lượng nước ml); Ngược lại ➔ KẾT QUẢ = XANH: "Chưa cần tưới".
        </div>
      </section>

      {/* KHỐI 2: BẢNG NGƯỠNG TƯỚI NƯỚC (MỤC 4 TRONG TÀI LIỆU) */}
      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                2. Bảng ngưỡng tưới nước chuẩn của đề tài
              </h2>
              <p className="text-sm text-slate-500">
                Số liệu quy chuẩn dùng để thuật toán tự động ra quyết định
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSketchModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>Xem bản vẽ tay gốc</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-extrabold border-b-2 border-slate-300">
                <th className="py-3 px-4">Loại cây</th>
                <th className="py-3 px-4 text-center">Cần tưới khi độ ẩm dưới</th>
                <th className="py-3 px-4 text-center">Lượng nước mỗi lần</th>
                <th className="py-3 px-4">Đặc điểm sinh học</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {DEFAULT_PLANTS.map((plant) => (
                <tr key={plant.name} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-xl">{plant.emoji}</span>
                    <span>{plant.name}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-full font-black text-sm bg-amber-100 text-amber-900 border border-amber-300">
                      &lt; {plant.threshold}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-700">
                    {plant.waterAmount} ml
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {plant.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* KHỐI 3: 3 TÌNH HUỐNG THỬ NGHIỆM THỰC TẾ (NHIỆM VỤ 3) */}
      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-4 border-b pb-3 border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              3. Gợi ý 3 tình huống để em thử nghiệm sản phẩm
            </h2>
            <p className="text-sm text-slate-500">
              Em có thể bấm nút "Thử ngay" ở mỗi tình huống để nạp dữ liệu vào ứng dụng kiểm tra!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {TEST_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 hover:border-slate-300 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-white mb-1">
                    Tình huống {sc.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {sc.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onApplyScenario(sc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Nạp vào máy & Thử ngay</span>
                </button>
              </div>

              <p className="text-sm text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                <strong>Mô tả:</strong> {sc.description} (Cây: <em>{sc.plantName}</em>, Độ ẩm đo được: <em>{sc.moisture}%</em>).
              </p>

              <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Kết quả mong đợi:</strong> {sc.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KHỐI 4: 2 ĐIỂM GỢI Ý CẢI TIẾN THÊM CHO ĐỀ TÀI (NHIỆM VỤ 3) */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 shadow-md border-2 border-indigo-200">
        <div className="flex items-center gap-3 mb-4 border-b pb-3 border-indigo-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              4. Gợi ý 2 điểm em có thể cải tiến thêm cho đề tài
            </h2>
            <p className="text-sm text-slate-600">
              Định hướng nâng cấp giúp bài thi Công nghệ kỹ thuật đạt điểm tối đa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-black">
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">A</span>
              <h3>Cải tiến 1: Nhận thông báo tức thời &amp; Cảm biến IoT</h3>
            </div>
            <p className="text-sm text-slate-600">
              Thay vì người dùng phải tự nhớ để kiểm tra thủ công, cảm biến độ ẩm đo liên tục và <strong>bắn thông báo tức thời (Notification &amp; Còi báo)</strong> ngay khi đất vừa chạm ngưỡng khô.
            </p>
            <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã tích hợp trong Tab "🤖 Bơm Tự Động (IoT)"!</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-black">
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">B</span>
              <h3>Cải tiến 2: Tự động điều khiển rơ-le máy bơm nước</h3>
            </div>
            <p className="text-sm text-slate-600">
              Khi nhận được tín hiệu đất khô, hệ thống tự động kích hoạt <strong>rơ-le bật máy bơm mini</strong>, bơm đúng lượng nước sinh học quy định rồi tự động ngắt (Auto-Cutoff) để chống úng rễ.
            </p>
            <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã tích hợp mô phỏng rơ-le và van bơm tự ngắt!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
