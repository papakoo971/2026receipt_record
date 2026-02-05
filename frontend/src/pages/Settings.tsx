import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== '계정 삭제') {
      alert('"계정 삭제"를 정확히 입력해 주세요.');
      return;
    }

    setIsDeleting(true);

    try {
      await userApi.deleteAccount();
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('계정 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>

      {/* Account Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h2>
        <div className="flex items-center space-x-4">
          {user?.profileImage && (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">로그아웃</h2>
        <p className="text-gray-600 mb-4">
          현재 세션에서 로그아웃합니다. 데이터는 삭제되지 않습니다.
        </p>
        <button onClick={logout} className="btn-secondary">
          로그아웃
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">위험 구역</h2>
        <p className="text-gray-600 mb-4">
          계정을 삭제하면 모든 사업, 지출 내역, 영수증 이미지가 영구적으로 삭제됩니다.
          <br />
          <span className="font-medium text-red-600">이 작업은 되돌릴 수 없습니다.</span>
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-danger"
        >
          계정 삭제
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              계정 삭제 확인
            </h3>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>주의:</strong> 계정을 삭제하면 다음 데이터가 모두 삭제됩니다:
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                <li>모든 사업 정보</li>
                <li>모든 집행 항목 및 예산</li>
                <li>모든 영수증 데이터</li>
                <li>업로드된 모든 이미지</li>
              </ul>
            </div>
            <p className="text-gray-600 mb-4">
              계정 삭제를 확인하려면 아래에 <strong>"계정 삭제"</strong>를 입력하세요.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="계정 삭제"
              className="input mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText('');
                }}
                className="btn-secondary"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== '계정 삭제' || isDeleting}
                className="btn-danger"
              >
                {isDeleting ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
