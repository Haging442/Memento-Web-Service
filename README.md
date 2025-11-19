## Branch & PR 규칙 (팀 협업 규칙)

### 기본 브랜치 구조
- **main** : 배포용 브랜치 (팀장만 merge)
- **dev** : 개발 통합 브랜치
- **feat/*** : 기능 개발 브랜치 (팀원 전용)

### 브랜치 생성 규칙
- 모든 팀원은 **dev 브랜치에서 새로운 기능 브랜치를 생성**합니다.
- 브랜치 이름 예시:
  - `feat/frontend-init`
  - `feat/backend-oauth`
  - `feat/email-scan`
  - `feat/ai-classifier`

### 작업 규칙
1. **절대 main/dev 브랜치에 직접 push 금지**
2. 본인 작업은 반드시 `feat/*` 브랜치에서 진행
3. 작업 완료 후 GitHub에서 **PR(Pull Request)** 생성
4. PR 제목 예시:
   - `[feat] 프론트엔드 초기 세팅`
   - `[fix] 이메일 분석 오류 수정`
5. 리뷰어(팀장) 승인 후 → dev로 merge
6. dev → main merge는 승인 후 수행

### PR(Pull Request) 작성 흐름
1. `feat/*` 브랜치에서 작업 완료 후 push
2. GitHub에서 **"Compare & pull request"** 버튼 클릭
3. Base branch를 **dev**로 설정
4. 변경 내용 요약 작성
5. **Create Pull Request** 클릭
6. 팀장이 리뷰 & merge
