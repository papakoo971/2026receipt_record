import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          안녕하세요, {user?.name}님!
        </h1>
        <p className="text-gray-600">
          오늘도 효율적인 지출 관리를 시작해 보세요.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Receipt */}
        <Link
          to="/upload"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <UploadIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              영수증 업로드
            </h2>
            <p className="text-sm text-gray-600">
              영수증을 촬영하거나 업로드하여<br />
              지출 내역을 자동으로 기록하세요.
            </p>
          </div>
        </Link>

        {/* Business Management */}
        <Link
          to="/businesses"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <BriefcaseIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              사업 관리
            </h2>
            <p className="text-sm text-gray-600">
              사업과 예산 항목을 생성하고<br />
              관리하세요.
            </p>
          </div>
        </Link>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <ChartIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              대시보드
            </h2>
            <p className="text-sm text-gray-600">
              예산 대비 지출 현황을<br />
              한눈에 확인하세요.
            </p>
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-semibold mb-4">
            효율적인 지출 관리의 시작
          </h3>
          <p className="text-blue-100 mb-6">
            Receipt Record는 영수증 이미지에서 자동으로 정보를 추출하여
            지출 내역을 기록하고, 사업별 예산 대비 지출 현황을 
            실시간으로 파악할 수 있도록 도와드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">1</span>
              <span className="text-sm">사업 등록</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200">→</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">2</span>
              <span className="text-sm">영수증 업로드</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200">→</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">3</span>
              <span className="text-sm">대시보드 확인</span>
            </div>
          </div>
        </div>
      </div>
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

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
