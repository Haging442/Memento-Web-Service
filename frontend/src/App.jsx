// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateAssetPage from "./pages/CreateAssetPage";
import ContactsPage from "./pages/ContactsPage.jsx";
import TimeCapsulesPage from "./pages/TimeCapsulesPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";


//로그인 안 했으면 /login으로 보내기
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
    // 로그인 안 돼 있으면 로그인 페이지로
    return <Navigate to="/login" replace />;
  }

  if (role !== "ADMIN") {
    // 로그인은 했는데 관리자가 아니면 대시보드로 돌려보냄
    return <Navigate to="/dashboard" replace />;
  }

  // ADMIN이면 통과
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

      {/* ✅ 신뢰 연락처 페이지 */}
      <Route
        path="/contacts"
        element={
          <RequireAuth>
            <ContactsPage />
          </RequireAuth>
        }
      />
      {/* ✅ 타임캡슐 페이지 */}
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



      {/* 나머지 경로는 전부 /dashboard 로 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}