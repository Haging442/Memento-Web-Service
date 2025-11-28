// backend/services/willExecutionService.js

const db = require('../db');
const { sendAssetExecutionGuide } = require('../routes/email');

// 자산 지시(action) 한글 라벨
const ACTION_LABELS = {
  DELETE: '삭제',
  TRANSFER: '계정 이관',
  KEEP: '유지',
  MEMORIALIZE: '추모 계정 전환',
  OTHER: '기타 처리'
};

/**
 * 카테고리/서비스명에 따라 안내 메일 제목+본문 생성
 * @param {object} asset
 *  - service_name, category, login_id, memo
 *  - action, beneficiary_name, beneficiary_email, note
 */
function buildGuideEmail(asset) {
  const serviceName = asset.service_name || '해당 서비스';
  const category = asset.category || '기타';
  const actionLabel = ACTION_LABELS[asset.action] || '처리';
  const loginHint = asset.login_id ? `\n- 등록된 로그인 ID: ${asset.login_id}` : '';
  const extraNote = asset.note ? `\n\n[고인의 메모]\n${asset.note}` : '';

  let categoryGuide = '';

  const nameLower = serviceName.toLowerCase();

  switch (category) {
    case '구독':
      categoryGuide = `- 해당 서비스에 로그인 후 "구독/멤버십" 메뉴에서 해지 절차를 진행해주세요.
- 신용카드/계좌 자동결제 해지도 함께 확인해주세요.`;
      if (nameLower.includes('netflix')) {
        categoryGuide += `\n- 넷플릭스의 경우 웹 브라우저에서 로그인 후, 프로필 아이콘 → "계정" → "멤버십 해지" 메뉴에서 취소할 수 있습니다.`;
      }
      break;
    case 'SNS':
      categoryGuide = `- 각 SNS 서비스의 "보안/개인정보" 또는 "계정 관리" 메뉴에서 탈퇴/계정 비활성화 절차를 확인해주세요.
- 일부 서비스는 "추모 계정 전환" 기능을 제공하므로 필요시 별도 신청을 권장드립니다.`;
      break;
    case '금융':
      categoryGuide = `- 은행/증권/카드사의 고객센터 또는 영업점을 통해 사망 사실을 알리고,
  상속 절차에 따라 계좌 정리 및 서비스 해지 절차를 진행해야 합니다.
- 이 메일만으로는 법적 효력이 없으므로, 필히 해당 기관의 공식 안내와 법률 자문을 병행해주세요.`;
      break;
    case '클라우드':
      categoryGuide = `- 중요한 데이터가 있는 경우, 먼저 데이터를 백업/다운로드한 뒤 계정 삭제 또는 해지를 진행해주세요.
- 저장 용량 초과로 인한 추가 과금 여부도 함께 확인하는 것을 권장드립니다.`;
      break;
    default:
      categoryGuide = `- 해당 서비스의 고객센터/도움말 페이지에서 계정 삭제 또는 서비스 해지 절차를 확인해주세요.`;
  }

  // 특수 서비스 예시: Gmail
  if (nameLower.includes('gmail') || nameLower.includes('google')) {
    categoryGuide += `

[참고: Gmail/Google 계정 데이터 처리 예시]
- https://takeout.google.com 에서 데이터 내보내기를 통해 메일·사진·문서 등을 백업할 수 있습니다.
- '계정 삭제' 시 복구가 불가능하므로, 필요한 데이터를 먼저 저장한 뒤 삭제를 진행해야 합니다.`;
  }

  const subject = `[Memento] "${serviceName}" 디지털 자산 처리 안내`;

  const text = `안녕하세요.

고인의 디지털 자산 중 "${serviceName}" 서비스에 대한 처리 안내입니다.

요청된 처리 방식: ${actionLabel}${loginHint}

권장 절차:
${categoryGuide}${extraNote}

[중요 안내]
- 이 메일은 Memento가 자동 생성한 "안내용"으로, 법적 효력을 가지는 유언장이 아닙니다.
- 실제 계정 해지/이관/데이터 처리 시에는 각 서비스의 공식 정책과 관련 법령을 반드시 확인해주시기 바랍니다.
- 필요할 경우, 변호사 또는 법률 전문가의 자문을 구하는 것을 권장드립니다.

감사합니다.
Memento 드림`;

  return { subject, text };
}

/**
 * 특정 유저(userId)에 대해
 * - 디지털 자산 + 사후 지시를 조회하고
 * - beneficiary_email이 있는 자산에 안내 메일 발송
 */
async function runForUser(userId) {
  return new Promise((resolve) => {
    db.all(
      `SELECT
         a.id AS asset_id,
         a.service_name,
         a.category,
         a.login_id,
         a.memo,
         ai.action,
         ai.beneficiary_name,
         ai.beneficiary_email,
         ai.note
       FROM digital_assets a
       LEFT JOIN asset_instructions ai ON ai.asset_id = a.id
       WHERE a.user_id = ?`,
      [userId],
      async (err, rows) => {
        if (err) {
          console.error('[WILL EXEC] DB query error:', err.message);
          return resolve({ ok: false, error: err.message, sent: 0 });
        }

        if (!rows || rows.length === 0) {
          console.log('[WILL EXEC] No digital assets for user', userId);
          return resolve({ ok: true, sent: 0 });
        }

        let sentCount = 0;

        for (const asset of rows) {
          // 지시(action)가 없거나, 수혜자 이메일이 없으면 스킵
          if (!asset.action || !asset.beneficiary_email) {
            continue;
          }

          const { subject, text } = buildGuideEmail(asset);

          try {
            await sendAssetExecutionGuide(
              asset.beneficiary_email,
              userId,
              subject,
              text
            );
            sentCount++;
            console.log(
              `[WILL EXEC] Guide sent for asset ${asset.asset_id} → ${asset.beneficiary_email}`
            );
          } catch (e) {
            console.error(
              `[WILL EXEC] Failed to send guide for asset ${asset.asset_id}:`,
              e.message
            );
          }
        }

        console.log(
          `[WILL EXEC] User ${userId}: ${sentCount} execution guide email(s) sent.`
        );
        resolve({ ok: true, sent: sentCount });
      }
    );
  });
}

module.exports = {
  runForUser,
};
