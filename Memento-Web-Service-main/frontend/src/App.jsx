// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateAssetPage from "./pages/CreateAssetPage.jsx";
import ContactsPage from "./pages/ContactsPage.jsx";
import TimeCapsulesPage from "./pages/timecapsule-test.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import MemorialSpace from './pages/memorial/MemorialSpace';
import MemorialSettings from './pages/memorial/settings.jsx';


// 테스트 페이지들
import DailyQuestionTest from "./pages/daily-question-test.jsx";
import TimeCapsuleTest from "./pages/timecapsule-test.jsx";

// 로그인 안 했으면 /login으로 보내기
function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* 로그인 페이지 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 대시보드 */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* 자산 등록 페이지 */}
      <Route
        path="/assets/create"
        element={
          <RequireAuth>
            <CreateAssetPage />
          </RequireAuth>
        }
      />

      {/* 신뢰 연락처 페이지 */}
      <Route
        path="/contacts"
        element={
          <RequireAuth>
            <ContactsPage />
          </RequireAuth>
        }
      />

      {/* 타임캡슐 페이지 */}
      <Route
        path="/time-capsules"
        element={
          <RequireAuth>
            <TimeCapsulesPage />
          </RequireAuth>
        }
      />

      {/* 관리자 페이지 */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        }
      />

      {/* ✅ 추모공간 설정 페이지 */}
      <Route
        path="/memorial/settings"
        element={
          <RequireAuth>
            <MemorialSettings />
          </RequireAuth>
        }
      />

      <Route path="/memorial/:userId" element={<MemorialSpace />} />

      {/* ========== 테스트 페이지들 (인증 불필요) ========== */}
      <Route path="/test/daily-question" element={<DailyQuestionTest />} />
      <Route path="/test/timecapsule" element={<TimeCapsuleTest />} />

      {/* 나머지 경로는 전부 /login 으로 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}