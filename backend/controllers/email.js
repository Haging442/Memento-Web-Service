// controllers/email.js
// 실제 이메일 발송은 nodemailer 또는 외부 서비스로 교체 가능
// 지금은 개발 단계 DEV 모드로 콘솔 출력만 함

/**
 * 📌 사망 확정 후 – 유언장 보관 위치 자동 발송
 * @param {string} toEmail        - 수혜자 이메일
 * @param {string} storageLocation - 유언장 보관 장소 (예: "방 서랍 두 번째 칸")
 * @param {string} fileUrl         - 유언장 사진(URL)
 * @param {string} deceasedName    - 고인 이름
 * @param {number} userId          - 고인 userId
 */
async function sendWillNotification(toEmail, storageLocation, fileUrl, deceasedName, userId) {
  console.log("\n=================== [EMAIL: WILL NOTIFICATION] ===================");
  console.log(`📩 대상: ${toEmail}`);
  console.log(`🧑 고인: ${deceasedName} (userId: ${userId})`);
  console.log(`📍 유언장 보관 위치: ${storageLocation}`);
  console.log(`🖼 유언장 파일 URL: ${fileUrl}`);
  console.log("=================================================================\n");

  // 실제 이메일 발송 로직 예시 (비활성)
  /*
  await mailer.sendMail({
    to: toEmail,
    subject: `[메멘토] ${deceasedName}님의 유언장 보관 위치 안내`,
    html: `
      <h3>${deceasedName}님의 유언장 보관 장소 안내</h3>
      <p>고인께서 생전에 저장해두신 유언장의 보관 위치는 다음과 같습니다.</p>
      <p><b>보관 장소:</b> ${storageLocation}</p>
      <p><b>유언장 사진:</b> <a href="${fileUrl}">보기</a></p>
    `
  });
  */
}

/**
 * 📌 타임캡슐 공개 시 – 수혜자에게 알림 발송
 * @param {string} toEmail   - 받는 사람 이메일
 * @param {number} userId    - 고인 userId
 * @param {string} title     - 타임캡슐 제목
 */
async function sendTimeCapsuleNotification(toEmail, userId, title) {
  console.log("\n=================== [EMAIL: TIME CAPSULE] ===================");
  console.log(`📩 대상: ${toEmail}`);
  console.log(`🧑 고인 userId: ${userId}`);
  console.log(`📦 공개된 타임캡슐 제목: ${title}`);
  console.log("=================================================================\n");

  // 실제 이메일 발송 로직 예시
  /*
  await mailer.sendMail({
    to: toEmail,
    subject: `[메멘토] 새로운 타임캡슐이 공개되었습니다`,
    html: `
      <h3>새로운 타임캡슐이 공개되었습니다</h3>
      <p><b>${title}</b> 타임캡슐이 공개되었습니다.</p>
    `
  });
  */
}

module.exports = {
  sendWillNotification,
  sendTimeCapsuleNotification
};
