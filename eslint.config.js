// ESLint 설정 파일 (flat config 형식 - ESLint v9+ 방식)
// 코드 품질 + 보안 취약점을 자동으로 검사해줍니다.

import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import securityPlugin from "eslint-plugin-security";
import globals from "globals";

export default [
  // ESLint 기본 권장 규칙 적용
  js.configs.recommended,

  // 보안 취약점 검사 규칙 적용
  // eval() 사용, 정규식 DoS(ReDoS), 안전하지 않은 randomness 등을 잡아줍니다.
  securityPlugin.configs.recommended,

  {
    // 검사할 파일 범위: src 폴더 안의 JS/JSX 파일만 검사합니다.
    files: ["src/**/*.{js,jsx}"],

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      security: securityPlugin,
    },

    languageOptions: {
      // JSX 문법을 이해할 수 있도록 설정합니다.
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      // 브라우저 전역 변수(window, document, fetch 등)를 허용합니다.
      // 이 설정이 없으면 window, document 등을 "정의되지 않은 변수"로 오류 처리합니다.
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    settings: {
      // React 버전을 자동으로 감지하도록 설정합니다.
      react: {
        version: "detect",
      },
    },

    rules: {
      // ------- React 기본 규칙 -------
      // JSX 안에서 React를 명시적으로 import하지 않아도 됩니다 (React 17+)
      "react/react-in-jsx-scope": "off",
      // 사용하지 않는 변수가 있으면 경고를 줍니다.
      "no-unused-vars": "warn",

      // ------- React Hooks 규칙 -------
      // hooks 규칙을 어기면 에러로 표시합니다 (예: 조건문 안에서 useState 사용 금지)
      "react-hooks/rules-of-hooks": "error",
      // useEffect 의존성 배열이 빠졌으면 경고합니다.
      "react-hooks/exhaustive-deps": "warn",

      // ------- 보안 규칙 (eslint-plugin-security) -------
      // eval()은 악성 코드 실행 위험이 있으므로 에러로 표시합니다.
      "security/detect-eval-with-expression": "error",
      // 정규식이 너무 복잡하면 ReDoS 공격에 취약합니다. 경고로 표시합니다.
      "security/detect-unsafe-regex": "warn",
      // 비밀번호, 토큰 등 민감한 값을 코드에 직접 쓰면 경고합니다.
      "security/detect-possible-timing-attacks": "warn",
      // 객체 키를 외부 입력값으로 직접 접근하면 prototype pollution 위험이 있습니다.
      "security/detect-object-injection": "warn",
      // Buffer 생성 시 안전하지 않은 방법 사용 금지
      "security/detect-new-buffer": "error",
      // 하위 프로세스(child_process) 실행 시 외부 입력 사용 금지
      "security/detect-child-process": "error",
      // fs 모듈에서 외부 입력으로 파일 경로 접근 시 경고 (Path Traversal)
      "security/detect-non-literal-fs-filename": "warn",
      // require()에 외부 입력 사용 금지
      "security/detect-non-literal-require": "error",
    },
  },

  {
    // 빌드 결과물(dist), 설정 파일은 검사에서 제외합니다.
    ignores: ["dist/**", "node_modules/**", "*.config.js", "*.config.cjs"],
  },
];
