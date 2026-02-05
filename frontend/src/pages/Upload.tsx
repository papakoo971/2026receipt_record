import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { businessApi, receiptApi, getUploadUrl } from '../services/api';
import type { Business, ExtractedReceiptData } from '../types';

type Step = 'select' | 'review';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted data
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data } = await businessApi.getAll();
      setBusinesses(data);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedBusinessId || !selectedItemId) {
      alert('사업과 집행 항목을 먼저 선택해 주세요.');
      return;
    }

    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await receiptApi.extract(formData);
      setExtractedData(data);
      setDate(data.date || '');
      setDescription(data.description || '');
      setAmount(data.amount?.toString() || '');
      setStep('review');
    } catch (error) {
      console.error('Failed to extract text:', error);
      alert('영수증 인식에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = async () => {
    if (extractedData?.imagePath) {
      try {
        await receiptApi.cancelUpload(extractedData.imagePath);
      } catch (error) {
        console.error('Failed to cancel upload:', error);
      }
    }
    setStep('select');
    setExtractedData(null);
    setDate('');
    setDescription('');
    setAmount('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!extractedData || !selectedItemId) return;

    if (!date || !description || !amount) {
      alert('날짜, 상점명, 금액은 필수 입력 항목입니다.');
      return;
    }

    setIsSaving(true);

    try {
      await receiptApi.create({
        budgetItemId: selectedItemId,
        date,
        description,
        amount: parseFloat(amount),
        notes: notes || null,
        imagePath: extractedData.imagePath,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save receipt:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          등록된 사업이 없습니다
        </h2>
        <p className="text-gray-600 mb-6">
          영수증을 업로드하려면 먼저 사업을 등록해 주세요.
        </p>
        <Link to="/businesses/new" className="btn-primary">
          사업 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">영수증 업로드</h1>

      {step === 'select' && (
        <div className="space-y-6">
          {/* Business Selection */}
          <div className="card">
            <label className="label">사업 선택</label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                setSelectedBusinessId(Number(e.target.value));
                setSelectedItemId(null);
              }}
              className="input"
            >
              <option value="">사업을 선택하세요</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Item Selection */}
          {selectedBusiness && (
            <div className="card">
              <label className="label">집행 항목 선택</label>
              <select
                value={selectedItemId || ''}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="input"
              >
                <option value="">항목을 선택하세요</option>
                {selectedBusiness.budgetItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (예산: {new Intl.NumberFormat('ko-KR').format(item.budgetAmount)}원)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload */}
          <div className="card">
            <label className="label">영수증 이미지</label>
            <div
              onClick={() => selectedItemId && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedItemId
                  ? 'border-gray-300 hover:border-blue-400 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!selectedItemId || isExtracting}
              />
              {isExtracting ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600">영수증을 분석하고 있습니다...</p>
                </div>
              ) : (
                <>
                  <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    클릭하여 영수증 이미지를 업로드하세요
                  </p>
                  <p className="text-sm text-gray-400">
                    JPG, PNG, GIF, WebP (최대 10MB)
                  </p>
                </>
              )}
            </div>
            {!selectedItemId && (
              <p className="mt-2 text-sm text-gray-500">
                사업과 집행 항목을 먼저 선택해 주세요.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 'review' && extractedData && (
        <div className="space-y-6">
          {/* Preview */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="md:w-1/3">
                <img
                  src={getUploadUrl(extractedData.imagePath)}
                  alt="영수증"
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>

              {/* Form */}
              <div className="md:w-2/3 space-y-4">
                <div>
                  <label className="label">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">상점명 / 거래내용</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="예: 스타벅스 강남점"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">금액</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="input pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      원
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label">비고 (선택)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="추가 메모를 입력하세요"
                    rows={2}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OCR Raw Text (Collapsible) */}
          <details className="card">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              OCR 추출 원본 텍스트 보기
            </summary>
            <pre className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
              {extractedData.rawText || '추출된 텍스트가 없습니다.'}
            </pre>
          </details>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? '저장 중...' : '확인 및 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
