/* ════════════════════════════════════════════════════════════════
   전역 상수
════════════════════════════════════════════════════════════════ */
const BOX            = 500;   /* 캔버스 한 변 픽셀 크기 */
const BOX_RADIUS     = 32;    /* 캔버스 둥근 모서리 반지름(px). CSS border-radius와 반드시 일치 */
const BASE_MIN       = 50;    /* eye_x 길이 기본 최솟값(px). count에 따라 배수로 확장됨 */
const BASE_MAX       = 100;   /* eye_x 길이 기본 최댓값(px). count에 따라 배수로 확장됨 */
const THICK          = 1.5;   /* eye_circle 및 eye_x 선 테두리 두께(px) */
const MAUS_SEG       = 80;    /* maus_circle 테두리를 분할하는 세그먼트 수. 클수록 부드럽고 느림 */
const LINE_COLOR     = '#222222'; /* eye_x 선, eye_circle 테두리, eye_hole 색상 */
const MAUS_COLOR     = '#ff0000'; /* maus_circle 테두리 색상(빨강) */
const MAUS_FILL      = '#000000'; /* maus_circle 내부 채움 색상(검정) */
const LINE_CAP       = 'round';   /* 선 끝 모양: 'round'(둥근) | 'square' | 'butt' */
const MIN_GAP        = 20;    /* eye_x 선분 간 최소 간격(px). 이보다 가까우면 배치 거부 */
const EYE_MARGIN     = 10;    /* eye_circle 바운딩박스와 캔버스 경계 사이 최소 여백(px) */
const EYE_PAD        = 8;     /* 바운딩박스 계산 시 타원 실제 크기에 더하는 여유(px) */
const MAUS_MARGIN    = 10;    /* maus_x 끝점과 캔버스 경계 사이 최소 여백(px) */
const MAX_ATTEMPTS   = 12000; /* 배치 루프 최대 시도 횟수. 초과 시 부족하게 배치하고 종료 */
const SAMPLE_COUNT   = 40;    /* lineInBox 내부 샘플링 포인트 수. 클수록 정밀하지만 느림 */
const T              = 500;   /* 모든 애니메이션 단계의 기본 지속/대기 시간(ms) */
const HOLE_RATIO_ALL = [1/3, 1/2, 2/3]; /* eye_hole 반지름 비율 선택지 (eye_x 대비) */
const MAUS_CENTER_RADIUS = 50; /* maus 중심이 캔버스 중심으로부터 벗어날 수 있는 반지름(px) */

/* ════════════════════════════════════════════════════════════════
   전역 상태 변수
════════════════════════════════════════════════════════════════ */
let spawnMode    = 1;       /* eye_x 등장 방법: 1=동시 | 2=무작위 타이밍 | 3=균일 순서 */
let openMode     = 1;       /* eye_circle open 방법: 1=동시 | 2=무작위 | 3=등장 연동 */
let animId       = null;    /* 현재 실행 중인 requestAnimationFrame 핸들. null이면 미실행 */
let forceCount   = 'rand';  /* eye_x 생성 개수 고정값: 'rand'(무작위) 또는 1~9 정수 */
let forceMaus    = true;    /* maus 등장 여부: true=항상 등장 | false=등장 안 함 */
let forceMausType  = 'rand'; /* maus 모양 고정: 'rand' | 'A'(뾰족) | 'B'(둥근 타원) */
let forceMausThick = 'rand'; /* maus 두께 스타일 고정: 'rand' | 0(균일) | 1(역볼록) | 2(sine) | 3(직선) */
let forceEyeType   = 'rand'; /* eye_circle 모양 고정: 'rand' | 'A'(뾰족) | 'B'(둥근 타원) */
let forceHoleRatio = 'rand'; /* eye_hole 크기 비율 고정: 'rand' | 1/3 | 1/2 | 2/3 */
