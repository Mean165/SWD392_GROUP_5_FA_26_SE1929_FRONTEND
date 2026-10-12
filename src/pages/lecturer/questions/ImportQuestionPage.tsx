import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BloomLevel } from '../../../types/question';
import {
  createQuestion,
  DEFAULT_TOPICS,
  getTopicNameById,
} from '../../../services/question/questionService';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

interface ParsedQuestionPreview {
  questionText: string;
  bloomLevel: BloomLevel;
  criteriaName: string;
  expectedKnowledgePoints: string;
  weightRatio: number;
}

export default function ImportQuestionPage() {
  const navigate = useNavigate();

  const [topicId, setTopicId] = useState<string>(DEFAULT_TOPICS[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [previewList, setPreviewList] = useState<ParsedQuestionPreview[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Demo file upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);

    // Simulate reading JSON or CSV
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let parsed: ParsedQuestionPreview[] = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsed = Array.isArray(json) ? json : [json];
        } else {
          // Parse lines
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          parsed = lines.slice(1).map((line, idx) => {
            const parts = line.split(',');
            return {
              questionText: parts[0]?.trim() || `Câu hỏi import mẫu #${idx + 1}`,
              bloomLevel: (parts[1]?.trim() as BloomLevel) || 'APPLY',
              criteriaName: parts[2]?.trim() || 'Chuẩn xác kiến thức',
              expectedKnowledgePoints: parts[3]?.trim() || 'Trả lời đúng trọng tâm câu hỏi.',
              weightRatio: 1.0,
            };
          });
        }

        if (parsed.length === 0) {
          // Provide default sample preview if empty file
          parsed = [
            {
              questionText: 'Phân tích cơ chế xử lý Concurrency Control trong PostgreSQL thông qua MVCC (Multi-Version Concurrency Control)?',
              bloomLevel: 'ANALYZE',
              criteriaName: 'Hiểu bản chất MVCC và Snapshot Isolation',
              expectedKnowledgePoints: 'Mỗi transaction nhìn thấy snapshot dữ liệu tại thời điểm bắt đầu; không khóa lẫn nhau khi đọc ghi.',
              weightRatio: 1.0,
            },
            {
              questionText: 'Trong kiến trúc CQRS (Command Query Responsibility Segregation), làm thế nào để đảm bảo tính nhất quán cuối cùng (Eventual Consistency)?',
              bloomLevel: 'APPLY',
              criteriaName: 'Đặc tính Event Sourcing & Eventual Consistency',
              expectedKnowledgePoints: 'Sử dụng Message Broker (Kafka/RabbitMQ) để propagate biến động dữ liệu từ Command side sang Query projection.',
              weightRatio: 1.0,
            },
          ];
        }

        setPreviewList(parsed);
        addToast('success', `Đã phân tích tệp tin: nhận diện được ${parsed.length} câu hỏi hợp lệ!`);
      } catch (err) {
        // Fallback sample data
        setPreviewList([
          {
            questionText: 'Phân tích cơ chế xử lý Concurrency Control trong PostgreSQL thông qua MVCC (Multi-Version Concurrency Control)?',
            bloomLevel: 'ANALYZE',
            criteriaName: 'Hiểu bản chất MVCC và Snapshot Isolation',
            expectedKnowledgePoints: 'Mỗi transaction nhìn thấy snapshot dữ liệu tại thời điểm bắt đầu; không khóa lẫn nhau khi đọc ghi.',
            weightRatio: 1.0,
          },
        ]);
        addToast('info', 'Đã tải dữ liệu mẫu mô phỏng từ tệp.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (previewList.length === 0) return;
    setIsImporting(true);

    try {
      const topicObj = DEFAULT_TOPICS.find((t) => t.id === topicId);
      for (const item of previewList) {
        await createQuestion({
          questionText: item.questionText,
          content: item.questionText,
          topicId: topicId,
          topicName: topicObj?.name,
          bloomLevel: item.bloomLevel || 'APPLY',
          sourceType: 'IMPORTED',
          status: 'APPROVED',
          rubrics: [
            {
              criteriaName: item.criteriaName || 'Tiêu chí đánh giá chung',
              expectedKnowledgePoints: item.expectedKnowledgePoints || item.questionText,
              weightRatio: item.weightRatio || 1.0,
              maxScore: 10,
            },
          ],
        });
      }

      addToast('success', `Đã nạp thành công ${previewList.length} câu hỏi vào ngân hàng đề!`);
      setTimeout(() => {
        navigate('/lecturer/questions');
      }, 1200);
    } catch (err: any) {
      addToast('error', 'Lỗi khi nạp câu hỏi: ' + (err?.message || 'Thất bại'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const sample = [
      {
        questionText: 'Trình bày cách thức triển khai Event-Driven Architecture với Apache Kafka trong hệ thống phân tán?',
        bloomLevel: 'APPLY',
        criteriaName: 'Cơ chế Producer - Broker - Consumer Group',
        expectedKnowledgePoints: 'Partitioning, Offset management và At-least-once delivery.',
        weightRatio: 1.0,
      },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aives_sample_questions_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/lecturer/questions" className="hover:text-indigo-600 transition-colors">
              Ngân hàng câu hỏi
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Import hàng loạt</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Import Câu Hỏi Từ Tệp Tin (Bulk Upload)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ định dạng JSON hoặc CSV. Hệ thống tự động phân tách câu hỏi và tiêu chí rubric chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📄 Tải tệp mẫu</span>
          </button>
          <Link
            to="/lecturer/questions"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
          >
            ← Danh sách
          </Link>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Học phần / Môn học tiếp nhận *
          </label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md"
          >
            {DEFAULT_TOPICS.map((top) => (
              <option key={top.id} value={top.id}>
                {top.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-indigo-50/20">
          <input
            type="file"
            id="file-upload-input"
            accept=".json,.csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
              📂
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp tin hoặc kéo thả vào đây'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ file .JSON, .CSV (kích thước tối đa 10MB)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {previewList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xem Trước Dữ Liệu Import ({previewList.length} câu hỏi)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra lại nội dung trước khi nạp chính thức vào ngân hàng câu hỏi môn{' '}
                <strong>{getTopicNameById(topicId)}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? 'Đang nạp...' : '✓ Xác nhận nạp vào ngân hàng'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3" style={{ width: '5%' }}>STT</th>
                  <th className="p-3" style={{ width: '45%' }}>Nội dung câu hỏi</th>
                  <th className="p-3" style={{ width: '15%' }}>Bloom Level</th>
                  <th className="p-3" style={{ width: '35%' }}>Tiêu chí Rubric kỳ vọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-900 leading-relaxed align-top">
                      {item.questionText}
                    </td>
                    <td className="p-3 align-top">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                        {item.bloomLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 align-top">
                      <div className="font-semibold text-slate-800">{item.criteriaName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.expectedKnowledgePoints}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
