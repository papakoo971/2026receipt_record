import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { businessApi } from '../services/api';
import type { BudgetItem } from '../types';

interface FormBudgetItem {
  id?: number;
  name: string;
  budgetAmount: string;
}

export default function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [budgetItems, setBudgetItems] = useState<FormBudgetItem[]>([
    { name: '', budgetAmount: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [errors, setErrors] = useState<{ name?: string; items?: string }>({});

  useEffect(() => {
    if (isEdit) {
      loadBusiness();
    }
  }, [id]);

  const loadBusiness = async () => {
    try {
      const { data } = await businessApi.getById(Number(id));
      setName(data.name);
      setBudgetItems(
        data.budgetItems.map((item: BudgetItem) => ({
          id: item.id,
          name: item.name,
          budgetAmount: item.budgetAmount.toString(),
        }))
      );
    } catch (error) {
      console.error('Failed to load business:', error);
      navigate('/businesses');
    } finally {
      setIsFetching(false);
    }
  };

  const addBudgetItem = () => {
    setBudgetItems([...budgetItems, { name: '', budgetAmount: '' }]);
  };

  const removeBudgetItem = (index: number) => {
    if (budgetItems.length > 1) {
      setBudgetItems(budgetItems.filter((_, i) => i !== index));
    }
  };

  const updateBudgetItem = (index: number, field: 'name' | 'budgetAmount', value: string) => {
    const updated = [...budgetItems];
    updated[index][field] = value;
    setBudgetItems(updated);
  };

  const validate = () => {
    const newErrors: { name?: string; items?: string } = {};

    if (!name.trim()) {
      newErrors.name = '사업명을 입력해 주세요.';
    }

    const validItems = budgetItems.filter(
      (item) => item.name.trim() && item.budgetAmount
    );

    if (validItems.length === 0) {
      newErrors.items = '최소 하나의 집행 항목을 입력해 주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const validItems = budgetItems
        .filter((item) => item.name.trim() && item.budgetAmount)
        .map((item) => ({
          name: item.name.trim(),
          budgetAmount: parseFloat(item.budgetAmount),
        }));

      if (isEdit) {
        await businessApi.update(Number(id), { name: name.trim(), budgetItems: validItems });
      } else {
        await businessApi.create({ name: name.trim(), budgetItems: validItems });
      }

      navigate('/businesses');
    } catch (error) {
      console.error('Failed to save business:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '사업 수정' : '새 사업 등록'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div className="card">
          <label className="label">사업명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 2026년 마케팅 프로젝트"
            className={`input ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Budget Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <label className="label mb-0">집행 항목</label>
            <button
              type="button"
              onClick={addBudgetItem}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + 항목 추가
            </button>
          </div>

          <div className="space-y-3">
            {budgetItems.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateBudgetItem(index, 'name', e.target.value)}
                    placeholder="항목명 (예: 인건비)"
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={item.budgetAmount}
                      onChange={(e) => updateBudgetItem(index, 'budgetAmount', e.target.value)}
                      placeholder="예산"
                      min="0"
                      className="input pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      원
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBudgetItem(index)}
                  disabled={budgetItems.length === 1}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-500">{errors.items}</p>
          )}

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">총 예산</span>
              <span className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('ko-KR').format(
                  budgetItems.reduce(
                    (sum, item) => sum + (parseFloat(item.budgetAmount) || 0),
                    0
                  )
                )}
                원
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/businesses')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? '저장 중...' : isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
