# Receipt Record

영수증 OCR 기반 지출 관리 웹 애플리케이션

## 기능

- **영수증 OCR**: Google Vision API를 통한 자동 텍스트 추출
- **사업 관리**: 사업별 예산 항목 생성 및 관리
- **대시보드**: 예산 대비 지출 현황 실시간 확인
- **데이터 내보내기**: Excel, 이미지 ZIP 다운로드

## 기술 스택

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM
- Axios

### Backend
- Node.js + Express
- TypeScript
- SQLite (sql.js)
- Passport.js (Google OAuth 2.0)
- Google Cloud Vision API

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd receit_record
```

### 2. 백엔드 설정

```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install

# 환경 변수 설정 (선택)
cp .env.example .env
```

### 4. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
   - 승인된 리디렉션 URI: `http://localhost:3001/api/auth/google/callback`
3. Cloud Vision API 활성화 및 API 키 생성

### 5. 개발 서버 실행

```bash
# 백엔드 (터미널 1)
cd backend
npm run dev

# 프론트엔드 (터미널 2)
cd frontend
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001

## 배포 가이드

### Frontend 배포 (Vercel)

1. **GitHub에 코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Vercel 설정**
   - [Vercel](https://vercel.com)에 로그인
   - "New Project" 클릭
   - GitHub 저장소 연결
   - 설정:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **환경 변수 설정** (Vercel 대시보드 → Settings → Environment Variables)
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Deploy** 클릭

### Backend 배포 (Render)

1. **Render 설정**
   - [Render](https://render.com)에 로그인
   - "New" → "Web Service" 선택
   - GitHub 저장소 연결

2. **서비스 설정**
   - **Name**: receipt-record-api
   - **Region**: Singapore (또는 가까운 리전)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Persistent Disk 추가** (Render 대시보드 → Disks)
   - **Name**: receipt-data
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1 GB

4. **환경 변수 설정** (Render 대시보드 → Environment)
   ```
   NODE_ENV=production
   PORT=3001
   SESSION_SECRET=<랜덤 문자열 생성>
   
   # Google OAuth (프로덕션 URL로 변경!)
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_CALLBACK_URL=https://your-backend-url.onrender.com/api/auth/google/callback
   
   # Google Vision API
   GOOGLE_VISION_API_KEY=<your-vision-api-key>
   
   # Frontend URL (CORS)
   FRONTEND_URL=https://your-frontend-url.vercel.app
   
   # 데이터 저장 경로 (Persistent Disk)
   DATA_DIR=/opt/render/project/src/data
   ```

5. **Google Cloud Console에서 OAuth 리디렉션 URI 추가**
   - 승인된 리디렉션 URI에 프로덕션 콜백 URL 추가:
     `https://your-backend-url.onrender.com/api/auth/google/callback`

6. **Deploy** 클릭

### 배포 후 확인사항

1. 백엔드 헬스 체크: `https://your-backend-url.onrender.com/api/health`
2. 프론트엔드 접속 및 Google 로그인 테스트
3. 영수증 업로드 및 OCR 기능 테스트
4. Excel/이미지 내보내기 테스트

## 환경 변수

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-session-secret

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Google Cloud Vision API
GOOGLE_VISION_API_KEY=your-vision-api-key

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# 프로덕션 데이터 경로 (선택)
# DATA_DIR=/opt/render/project/src/data
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## 프로젝트 구조

```
receit_record/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── context/        # React Context
│   │   ├── services/       # API 서비스
│   │   └── types/          # TypeScript 타입
│   └── vercel.json         # Vercel 배포 설정
├── backend/                # Express 백엔드
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── middleware/     # 미들웨어
│   │   ├── services/       # 외부 서비스 연동
│   │   └── config/         # 설정
│   ├── uploads/            # 업로드된 이미지
│   ├── data/               # SQLite 데이터베이스
│   └── render.yaml         # Render 배포 설정
└── README.md
```

## API 엔드포인트

### 인증
- `GET /api/auth/google` - Google OAuth 로그인
- `GET /api/auth/google/callback` - OAuth 콜백
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃

### 사업 관리
- `GET /api/businesses` - 사업 목록
- `POST /api/businesses` - 사업 생성
- `PUT /api/businesses/:id` - 사업 수정
- `DELETE /api/businesses/:id` - 사업 삭제

### 영수증
- `POST /api/receipts/extract` - OCR 텍스트 추출
- `POST /api/receipts` - 영수증 저장
- `GET /api/receipts` - 영수증 목록
- `DELETE /api/receipts/:id` - 영수증 삭제

### 대시보드
- `GET /api/dashboard/:businessId` - 대시보드 데이터

### 내보내기
- `GET /api/export/excel/:businessId` - Excel 다운로드
- `GET /api/export/images/:businessId` - 이미지 ZIP 다운로드

### 설정
- `DELETE /api/users/me` - 계정 삭제

## 라이선스

MIT
