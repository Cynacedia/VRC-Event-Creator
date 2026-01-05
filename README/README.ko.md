<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://img.shields.io/github/downloads/Cynacedia/VRC-Event-Creator/total?style=plastic&labelColor=555&color=blue" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a>
</p>
반복적인 설정을 줄여주는 VRChat용 올인원 이벤트 생성 도구입니다.
그룹별 이벤트 템플릿을 만들고 저장하며, 간단한 반복 패턴에서 다가오는 날짜를 생성해 세부 정보를 즉시 자동으로 채워 줍니다 - 주간 모임, 시청 파티, 커뮤니티 이벤트를 빠르게 일정 잡기에 적합합니다.


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>


## 기능
- 그룹별 이벤트 상세를 자동으로 채우는 프로필/템플릿.
- 반복 패턴 생성기(다가오는 날짜 목록 + 수동 날짜/시간 입력).
- 그룹 캘린더 이벤트 생성 마법사.
- 예정 이벤트용 수정 보기(그리드 + 편집 모달).
- 프리셋이 포함된 테마 스튜디오와 전체 UI 색상 제어(#RRGGBBAA 지원).
- 이미지 ID용 갤러리 선택 및 업로드.
- 첫 실행 언어 선택이 있는 현지화(en, fr, es, de, ja, zh, pt, ko, ru).

## 다운로드
- 릴리스: https://github.com/Cynacedia/VRC-Event-Creator/releases
- Windows 포터블 `.exe`는 단독으로 실행됩니다.

## 개인정보 및 데이터 저장
비밀번호는 저장되지 않습니다. 세션 토큰만 캐시됩니다.
앱 파일은 Electron 사용자 데이터 디렉터리에 저장됩니다(설정 > 애플리케이션 정보에서 확인):

- `profiles.json` (프로필 템플릿)
- `cache.json` (세션 토큰)
- `settings.json` (앱 설정)
- `themes.json` (테마 프리셋 및 사용자 색상)

`VRC_EVENT_DATA_DIR` 환경 변수로 데이터 디렉터리를 변경할 수 있습니다.
첫 실행 시 앱은 프로젝트 폴더의 기존 `profiles.json`을 가져오려고 시도합니다.

__**캐시 파일이나 앱 데이터 폴더를 공유하지 마세요.**__

## 사용 참고사항
- 프로필에는 프로필 이름, 이벤트 이름, 설명이 필요합니다.
- 비공개 그룹은 접근 유형을 그룹만 사용할 수 있습니다.
- 기간은 DD:HH:MM 형식이며 최대 31일입니다.
- 태그는 최대 5개, 언어는 최대 3개입니다.
- 갤러리 업로드 제한: PNG/JPG, 64-2048 px, 10MB 미만, 계정당 64장.
- VRChat은 현재 동시에 최대 10개의 예정 이벤트만 허용합니다.

## 문제 해결
- 로그인 문제: `cache.json`을 삭제하고 다시 로그인하세요(애플리케이션 정보에 표시된 데이터 폴더 사용).
- 그룹이 보이지 않음: 대상 그룹에 대한 캘린더 접근 권한이 필요합니다.
- 속도 제한: VRChat이 이벤트 생성에 제한을 둘 수 있습니다. 잠시 기다렸다가 재시도하고, 여러 번 실패하면 중지하세요. 새로고침/이벤트 생성 버튼을 반복 클릭하지 마세요.
- 업데이트: 업데이트가 대기 중일 때 일부 기능이 차단됩니다. 최신 릴리스를 다운로드해 실행하세요.

## 면책 조항
- 이 프로젝트는 VRChat과 관련이 없으며 승인받지 않았습니다. 사용은 본인 책임입니다.
- 언어는 기계 번역이며 부정확할 수 있습니다. 수정 제안에 참여해 주세요.

## 요구 사항(소스에서 빌드)
- Node.js 20+ (22.21.1 권장)
- npm
- 최소 한 개 이상의 그룹에서 이벤트를 만들 수 있는 VRChat 계정




