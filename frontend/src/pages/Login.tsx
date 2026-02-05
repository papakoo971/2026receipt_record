import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <span className="text-6xl">🧾</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Receipt Record
          </h1>
          <p className="text-gray-600 mb-8">
            영수증 기반 지출 관리 시스템
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              로그인에 실패했습니다. 다시 시도해 주세요.
            </div>
          )}

          {/* Features */}
          <div className="mb-8 text-left space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span className="text-gray-600 text-sm">영수증 촬영으로 자동 데이터 추출</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span className="text-gray-600 text-sm">사업별 예산 대비 지출 현황 관리</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span className="text-gray-600 text-sm">Excel, Google Sheets로 내보내기</span>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <GoogleIcon />
            <span>Google 계정으로 로그인</span>
          </button>

          <p className="mt-6 text-xs text-gray-500">
            로그인 시 서비스 이용약관에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
