// src/api/adminApi.js
import api from "./client";

// 전체 사용자
export const getAllUsers = () => api.get("/admin/users");

// 전체 자산
export const getAllAssets = () => api.get("/admin/assets");

// 전체 신뢰 연락처
export const getAllContacts = () => api.get("/admin/contacts");

// 사망 의심 신고 목록
export const getDeathReports = () => api.get("/admin/death-reports");

// 사망 의심 신고 상태 변경
export const updateDeathReportStatus = (id, status) =>
  api.patch(`/admin/death-reports/${id}`, { status });

// 이메일 발송 로그
export const getEmailLogs = () => api.get("/admin/email-logs");

// 타임캡슐 공개 로그
export const getCapsuleReleases = () => api.get("/admin/capsule-releases");

// 사망 신고 상세(경과시간 포함)
export const getDeathReportsDetailed = () =>
  api.get("/admin/death-reports-detailed");
