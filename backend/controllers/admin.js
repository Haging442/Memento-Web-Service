// controllers/admin.js
const db = require('../db');

// ---------------------------------------------------------------------
// 1. 전체 사용자 목록 (관리자용)
//    - 누가 가입했는지 모니터링
// ---------------------------------------------------------------------
exports.getAllUsers = (req, res) => {
  db.all(
    `SELECT id, username, name, role, created_at 
     FROM users 
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 2. 전체 자산 목록 (관리자용)
//    - 누가 어떤 디지털 자산을 등록했는지 모니터링
// ---------------------------------------------------------------------
exports.getAllAssets = (req, res) => {
  db.all(
    `SELECT 
       a.id,
       a.service_name,
       a.category,
       a.login_id,
       a.monthly_fee,
       a.created_at,
       u.username AS owner_username
     FROM digital_assets a
     JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 3. 전체 신뢰 연락처 목록 (관리자용)
//    - 누가 어떤 신뢰 연락처를 등록했는지 모니터링
// ---------------------------------------------------------------------
exports.getAllContacts = (req, res) => {
  db.all(
    `SELECT 
       c.id,
       c.name,
       c.relation,
       c.email,
       c.phone,
       c.created_at,
       u.username AS owner_username
     FROM trusted_contacts c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 4. 관리자 대시보드 요약 통계
//    - 전체 사용자 수, 자산 수, 신뢰 연락처 수
//    - 타임캡슐 수, 사망 신고 상태별 개수 등
//    => 시스템 전반을 한눈에 보는 모니터링용
// ---------------------------------------------------------------------
exports.getDashboardStats = (req, res) => {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM digital_assets) AS total_assets,
      (SELECT COUNT(*) FROM trusted_contacts) AS total_trusted_contacts,
      (SELECT COUNT(*) FROM time_capsules) AS total_time_capsules,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'PENDING') AS death_reports_pending,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'CONFIRMED') AS death_reports_confirmed,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'FINAL_CONFIRMED') AS death_reports_final_confirmed,
      (SELECT COUNT(*) FROM email_logs) AS total_email_logs,
      (SELECT COUNT(*) FROM capsule_release_logs) AS total_capsule_release_logs
  `;

  db.get(query, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
};

// ---------------------------------------------------------------------
// 5. 사망 의심 신고 목록 조회 (관리자용)
//    - 누가 누구에 대해 신고했는지, 현재 상태가 어떤지 확인
//    - PDF: "관리자 계정: 사망 의심 신고 접수"에 대응
// ---------------------------------------------------------------------
exports.getDeathReports = (req, res) => {
  db.all(
    `SELECT 
       dr.id,
       dr.target_user_id,
       u.username AS target_username,
       u.name AS target_name,
       dr.reporter_name,
       dr.reporter_contact,
       dr.relation,
       dr.message,
       dr.status,
       dr.admin_note,
       dr.created_at,
       dr.resolved_at
     FROM death_reports dr
     JOIN users u ON dr.target_user_id = u.id
     ORDER BY dr.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 6. 사망 의심 신고 상태 변경 (관리자 확인용)
//    - 예: PENDING → CONFIRMED
//    - CONFIRMED로 바뀌는 시점에 resolved_at을 현재 시각으로 설정
//    - 이후 72시간 자동 배치(autoFinalizeDeathReports)에서 FINAL_CONFIRMED 처리
// ---------------------------------------------------------------------
exports.updateDeathReportStatus = (req, res) => {
  const { id } = req.params; // death_report_id
  const { status, adminNote } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status 값이 필요합니다.' });
  }

  const nowIso = new Date().toISOString();

  // CONFIRMED일 때만 resolved_at을 채운다.
  const query =
    status === 'CONFIRMED'
      ? `UPDATE death_reports
         SET status = ?, 
             admin_note = COALESCE(admin_note, '') || ?
             , resolved_at = COALESCE(resolved_at, ?)
         WHERE id = ?`
      : `UPDATE death_reports
         SET status = ?, 
             admin_note = COALESCE(admin_note, '') || ?
         WHERE id = ?`;

  const noteToAppend = adminNote ? `\n[admin] ${adminNote}` : '';

  const params =
    status === 'CONFIRMED'
      ? [status, noteToAppend, nowIso, id]
      : [status, noteToAppend, id];

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: '해당 ID의 사망 신고를 찾을 수 없습니다.' });
    }
    res.json({ success: true, id, status });
  });
};

// ---------------------------------------------------------------------
// 7. 이메일 발송 로그 조회 (시스템 모니터링)
//    - 어떤 유형의 이메일이 누구에게, 언제, 성공/실패 여부
// ---------------------------------------------------------------------
exports.getEmailLogs = (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;

  db.all(
    `SELECT 
       id,
       email_type,
       recipient_email,
       user_id,
       subject,
       status,
       error_message,
       sent_at
     FROM email_logs
     ORDER BY sent_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 8. 타임캡슐 공개 로그 조회 (시스템 모니터링)
//    - ON_DEATH / ON_DATE가 실제로 언제 어떤 유저/캡슐에 대해 실행됐는지 확인
// ---------------------------------------------------------------------
exports.getCapsuleReleaseLogs = (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;

  db.all(
    `SELECT 
       crl.id,
       crl.capsule_id,
       crl.user_id,
       u.username AS owner_username,
       tc.title AS capsule_title,
       crl.release_type,
       crl.released_at,
       crl.email_sent
     FROM capsule_release_logs crl
     JOIN users u ON crl.user_id = u.id
     JOIN time_capsules tc ON crl.capsule_id = tc.id
     ORDER BY crl.released_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 이 컨트롤러는 관리자용 시스템 모니터링/사망 신고 처리 기능을 제공한다.
// - getAllUsers / getAllAssets / getAllContacts: 기본 모니터링
// - getDashboardStats: 전체 통계
// - getDeathReports / updateDeathReportStatus: 사망 의심 신고 관리
// - getEmailLogs / getCapsuleReleaseLogs: 로그 기반 시스템 모니터링
// ---------------------------------------------------------------------
// 🔍 관리자 대시보드 상단 요약 (요약 카드용)
exports.getDashboardSummary = (req, res) => {
  // 한 번의 SELECT 안에 서브쿼리들로 필요한 숫자들 모으기
  const sql = `
    SELECT
      -- 전체 사용자 수
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') AS admin_users,
      (SELECT COUNT(*) FROM users WHERE role = 'USER') AS normal_users,

      -- 오늘 가입한 사용자 수 (서버 기준 날짜)
      (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE('now')) AS new_users_today,

      -- 디지털 자산 통계
      (SELECT COUNT(*) FROM digital_assets) AS total_assets,
      (SELECT COUNT(DISTINCT user_id) FROM digital_assets) AS users_with_assets,

      -- 신뢰 연락처 통계
      (SELECT COUNT(*) FROM trusted_contacts) AS total_contacts,
      (SELECT COUNT(DISTINCT user_id) FROM trusted_contacts) AS users_with_contacts,

      -- 타임캡슐 통계
      (SELECT COUNT(*) FROM time_capsules) AS total_time_capsules,
      (SELECT COUNT(*) FROM time_capsules WHERE is_released = 1) AS released_time_capsules,
      (SELECT COUNT(*) FROM time_capsules WHERE release_type = 'ON_DEATH') AS on_death_capsules,
      (SELECT COUNT(*) FROM time_capsules WHERE release_type = 'ON_DATE') AS on_date_capsules,

      -- 사망 의심 신고 통계
      (SELECT COUNT(*) FROM death_reports) AS total_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'PENDING') AS pending_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'CONFIRMED') AS confirmed_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'FINAL_CONFIRMED') AS final_confirmed_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'REJECTED') AS rejected_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'CANCELED') AS canceled_death_reports,
      (SELECT COUNT(*) FROM death_reports WHERE status = 'CANCELED_BY_OWNER') AS canceled_by_owner_death_reports,

      -- 오늘 들어온 사망 의심 신고
      (SELECT COUNT(*) FROM death_reports WHERE DATE(created_at) = DATE('now')) AS new_death_reports_today,

      -- 이메일 발송 로그 통계
      (SELECT COUNT(*) FROM email_logs) AS total_email_logs,
      (SELECT COUNT(*) FROM email_logs WHERE status = 'FAILED') AS failed_email_logs,

      -- AI 제안 / 답변 통계 (옵션용)
      (SELECT COUNT(*) FROM user_daily_answers) AS total_daily_answers,
      (SELECT COUNT(*) FROM ai_suggestions WHERE status = 'PENDING') AS pending_ai_suggestions
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('[ADMIN] getDashboardSummary error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    // 그대로 넘겨도 되고, 프론트에서 쓰기 좋게 그룹을 나눠도 됨
    res.json({
      users: {
        total: row.total_users,
        admins: row.admin_users,
        normals: row.normal_users,
        newToday: row.new_users_today,
      },
      assets: {
        total: row.total_assets,
        usersWithAssets: row.users_with_assets,
      },
      contacts: {
        total: row.total_contacts,
        usersWithContacts: row.users_with_contacts,
      },
      timeCapsules: {
        total: row.total_time_capsules,
        released: row.released_time_capsules,
        onDeath: row.on_death_capsules,
        onDate: row.on_date_capsules,
      },
      deathReports: {
        total: row.total_death_reports,
        pending: row.pending_death_reports,
        confirmed: row.confirmed_death_reports,
        finalConfirmed: row.final_confirmed_death_reports,
        rejected: row.rejected_death_reports,
        canceled: row.canceled_death_reports,
        canceledByOwner: row.canceled_by_owner_death_reports,
        newToday: row.new_death_reports_today,
      },
      emails: {
        total: row.total_email_logs,
        failed: row.failed_email_logs,
      },
      ai: {
        totalDailyAnswers: row.total_daily_answers,
        pendingSuggestions: row.pending_ai_suggestions,
      },
    });
  });
};