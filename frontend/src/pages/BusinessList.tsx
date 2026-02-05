import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { businessApi } from '../services/api';
import type { Business } from '../types';

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    try {
      await businessApi.delete(id);
      setBusinesses(businesses.filter(b => b.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('사업 삭제에 실패했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">사업 관리</h1>
        <Link to="/businesses/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-1" />
          새 사업 등록
        </Link>
      </div>

      {/* Business List */}
      {businesses.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            등록된 사업이 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            새 사업을 등록하여 예산 관리를 시작하세요.
          </p>
          <Link to="/businesses/new" className="btn-primary inline-flex">
            사업 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {businesses.map((business) => {
            const totalBudget = business.budgetItems.reduce(
              (sum, item) => sum + item.budgetAmount,
              0
            );

            return (
              <div key={business.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {business.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      등록일: {new Date(business.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {business.budgetItems.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          {item.name}: {formatCurrency(item.budgetAmount)}원
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      총 예산: {formatCurrency(totalBudget)}원
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/businesses/${business.id}/edit`}
                      className="btn-secondary text-sm"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(business.id)}
                      className="btn-danger text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              사업 삭제 확인
            </h3>
            <p className="text-gray-600 mb-4">
              이 사업을 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                해당 사업에 속한 모든 집행 항목, 영수증 데이터, 이미지가 영구적으로 삭제됩니다.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
