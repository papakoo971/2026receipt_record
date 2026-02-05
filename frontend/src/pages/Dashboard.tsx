import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { businessApi, dashboardApi, exportApi, getUploadUrl } from '../services/api';
import type { Business, DashboardData } from '../types';

export default function Dashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      loadDashboard(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  const loadBusinesses = async () => {
    try {
      const { data } = await businessApi.getAll();
      setBusinesses(data);
      if (data.length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboard = async (businessId: number) => {
    setIsLoading(true);
    try {
      const { data } = await dashboardApi.getData(businessId);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (selectedBusinessId) {
      window.open(exportApi.getExcelUrl(selectedBusinessId), '_blank');
    }
  };

  const handleExportImages = () => {
    if (selectedBusinessId) {
      window.open(exportApi.getImagesUrl(selectedBusinessId), '_blank');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          등록된 사업이 없습니다
        </h2>
        <p className="text-gray-600 mb-6">
          대시보드를 확인하려면 먼저 사업을 등록해 주세요.
        </p>
        <Link to="/businesses/new" className="btn-primary">
          사업 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        
        <select
          value={selectedBusinessId || ''}
          onChange={(e) => setSelectedBusinessId(Number(e.target.value))}
          className="input max-w-xs"
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      {dashboardData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">총 예산</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.summary.totalBudget)}
                <span className="text-sm font-normal text-gray-500 ml-1">원</span>
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">총 지출</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(dashboardData.summary.totalSpent)}
                <span className="text-sm font-normal text-gray-500 ml-1">원</span>
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">잔액</p>
              <p className={`text-2xl font-bold ${dashboardData.summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashboardData.summary.remaining)}
                <span className="text-sm font-normal text-gray-500 ml-1">원</span>
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">집행률</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.summary.executionRate}
                <span className="text-sm font-normal text-gray-500 ml-1">%</span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">전체 집행률</span>
              <span className={`text-lg font-bold ${
                dashboardData.summary.executionRate > 100 
                  ? 'text-red-600' 
                  : dashboardData.summary.executionRate > 80 
                    ? 'text-yellow-600' 
                    : 'text-blue-600'
              }`}>{dashboardData.summary.executionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
              <div
                className={`h-5 rounded-full transition-all duration-500 ease-out ${
                  dashboardData.summary.executionRate > 100 
                    ? 'bg-gradient-to-r from-red-500 to-red-400' 
                    : dashboardData.summary.executionRate > 80 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-400'
                }`}
                style={{ width: `${Math.min(dashboardData.summary.executionRate, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Budget Items Table */}
          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">항목별 예산/지출</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">집행 항목</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">예산</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">지출</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">잔액</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">집행률</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatCurrency(item.budget)}</td>
                      <td className="py-3 px-4 text-sm text-blue-600 text-right">{formatCurrency(item.spent)}</td>
                      <td className={`py-3 px-4 text-sm text-right ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.remaining)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.executionRate > 100 
                            ? 'bg-red-100 text-red-700'
                            : item.executionRate > 80 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {item.executionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td className="py-3 px-4 text-sm text-gray-900">합계</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(dashboardData.summary.totalBudget)}</td>
                    <td className="py-3 px-4 text-sm text-blue-600 text-right">{formatCurrency(dashboardData.summary.totalSpent)}</td>
                    <td className={`py-3 px-4 text-sm text-right ${dashboardData.summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dashboardData.summary.remaining)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{dashboardData.summary.executionRate}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">영수증 내역</h2>
            {dashboardData.receipts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">등록된 영수증이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">날짜</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">집행항목</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">상점명</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">금액</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">비고</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">영수증</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.receipts.map((receipt) => (
                      <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{receipt.date}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{receipt.itemName}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{receipt.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(receipt.amount)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{receipt.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedImage(receipt.imagePath)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">데이터 내보내기</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExportExcel} className="btn-primary">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Excel 다운로드
              </button>
              <button onClick={handleExportImages} className="btn-secondary">
                <ImageIcon className="w-4 h-4 mr-2" />
                이미지 ZIP
              </button>
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">영수증 이미지</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <img 
                src={getUploadUrl(selectedImage)} 
                alt="영수증" 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}


function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
