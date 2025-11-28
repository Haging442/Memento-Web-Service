// utils/helpers.js

/**
 * 주어진 생년월일(ISO 8601 문자열)을 기준으로 현재 나이를 계산합니다.
 * @param {string} birthDate - YYYY-MM-DD 형식의 생년월일 문자열
 * @returns {number} 현재 나이 (만 나이)
 */
function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    
    // 생일이 지나지 않았으면 나이에서 1을 뺌
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

module.exports = {
    calculateAge
};