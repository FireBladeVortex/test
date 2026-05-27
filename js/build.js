/* ════════════════════════════════════════════════════════════════
   데이터 빌드
════════════════════════════════════════════════════════════════ */

/*
 * 목적: eye_x 생성 개수(n)에 따라 eye_x 길이(eye_x) 의 최소·최대값을 반환한다.
 * 로직: n이 클수록 eye_x 크기가 작아지도록 BASE_MIN/MAX에 배수를 곱해 범위를 결정한다.
 *       1~2개: ×4(200~400), 3~5개: ×3(150~300), 6~7개: ×2(100~200), 8~9개: ×1(50~100)
 */
function eyeXRange(n) {
  /* n: number — 이번 회차에 생성할 eye_x 개수 */
  /* 반환값: {min: number, max: number} — eye_x 길이 범위(px) */
  if (n <= 2) return { min: BASE_MIN * 4, max: BASE_MAX * 4 };
  if (n <= 5) return { min: BASE_MIN * 3, max: BASE_MAX * 3 };
  if (n <= 7) return { min: BASE_MIN * 2, max: BASE_MAX * 2 };
  return { min: BASE_MIN, max: BASE_MAX };
}

/*
 * 목적: n개의 eye_circle 타입('A' 또는 'B')으로 이루어진 배열을 생성한다.
 * 로직: forceEyeType이 고정 값이면 전부 그 값으로 채운다.
 *       n<=2이면 각각 50% 독립 선택.
 *       n>=3이면 'A'와 'B'를 최소 1개씩 보장하고 나머지를 50%로 채운 뒤 Fisher-Yates 셔플.
 */
function buildTypeArray(n) {
  /* n: number — 타입 배열의 길이(eye_x 개수) */
  /* arr: string[] — 생성 중인 타입 목록. 'A' 또는 'B' 값 */
  /* i,j: number — 셔플용 인덱스 */
  if (forceEyeType !== 'rand') return Array.from({ length: n }, () => forceEyeType);
  if (n <= 2) return Array.from({ length: n }, () => Math.random() < 0.5 ? 'A' : 'B');
  const arr = ['A', 'B'];
  for (let i = 2; i < n; i++) arr.push(Math.random() < 0.5 ? 'A' : 'B');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/*
 * 목적: 점 (ox, oy)에서 각도 a 방향으로 캔버스 경계까지의 최대 도달 거리를 계산한다.
 * 로직: 이진 탐색(64회 반복)으로 경계 안쪽 마지막 거리를 정밀하게 구하고
 *       MAUS_MARGIN 만큼 안쪽으로 수축해 반환한다.
 */
function reachFrom(ox, oy, a) {
  /* ox,oy: number — 탐색 시작 좌표(maus 중심) */
  /* a: number — 탐색 방향 각도(라디안) */
  /* lo,hi: number — 이진 탐색 하한/상한(px) */
  /* m: number — 매 이진 탐색 회차의 중간값 */
  let lo = 0, hi = BOX * 2;
  for (let i = 0; i < 64; i++) {
    const m = (lo + hi) / 2;
    insideBox(ox + Math.cos(a) * m, oy + Math.sin(a) * m) ? lo = m : hi = m;
  }
  return lo - MAUS_MARGIN;
}

/*
 * 목적: maus 선(maus_x)과 타원(maus_circle)에 필요한 모든 데이터를 생성해 객체로 반환한다.
 * 로직: 캔버스 중심 주변 MAUS_CENTER_RADIUS 범위에서 무작위 중심을 선택하고,
 *       무작위 각도로 reachFrom을 양 방향 호출해 선 양 끝점을 결정한다.
 *       eye_y(세로)를 maus_x의 1/2~4/5 범위에서 무작위 결정하고,
 *       forceMausType/forceMausThick 에 따라 타입과 두께 스타일을 할당한다.
 */
function buildMaus() {
  /* cx,cy: number — maus 중심 좌표. 캔버스 중심 ±MAUS_CENTER_RADIUS 범위 */
  /* a: number — maus_x 선분의 방향 각도(라디안, 0~2π) */
  /* r1: number — 중심에서 a 방향 끝점까지 거리(px) */
  /* r2: number — 중심에서 a+π 방향(반대쪽) 끝점까지 거리(px) */
  /* mx: number — maus_x 전체 길이 = r1+r2 (px) */
  /* rx: number — maus_circle 가로 반축 = mx/2 (px) */
  /* ey: number — maus eye_y 값(세로 방향 총 길이, mx/2~mx*4/5 사이 무작위) */
  /* ry: number — maus_circle 세로 반축 = ey/2 (px) */
  /* type: 'A'|'B' — maus_circle 모양 타입 */
  /* thickStyle: 0~3 — maus_circle 테두리 두께 스타일 번호 */
  const cx = BOX / 2 + rand(-MAUS_CENTER_RADIUS, MAUS_CENTER_RADIUS);
  const cy = BOX / 2 + rand(-MAUS_CENTER_RADIUS, MAUS_CENTER_RADIUS);
  const a  = rand(0, Math.PI * 2);
  const r1 = reachFrom(cx, cy, a);
  const r2 = reachFrom(cx, cy, a + Math.PI);
  const mx = r1 + r2, rx = mx / 2;
  const ey = rand(mx / 2, mx * 4 / 5), ry = ey / 2;
  const type       = forceMausType  === 'rand' ? (Math.random() < 0.5 ? 'A' : 'B') : forceMausType;
  const thickStyle = forceMausThick === 'rand' ? Math.floor(Math.random() * 4) : Number(forceMausThick);
  return {
    sx: cx - Math.cos(a) * r2, /* maus_x 시작점 x */
    sy: cy - Math.sin(a) * r2, /* maus_x 시작점 y */
    ex: cx + Math.cos(a) * r1, /* maus_x 끝점 x */
    ey: cy + Math.sin(a) * r1, /* maus_x 끝점 y */
    cx, cy,                    /* maus_circle 중심 */
    angle: a,                  /* 선분 및 타원 회전 각도 */
    rx, ry,                    /* 타원 가로/세로 반축 */
    type, thickStyle
  };
}

/*
 * 목적: eye_x 선분 배치 및 eye_circle, eye_hole, 타이밍 딜레이 데이터를
 *       모두 계산해 items 배열로 반환한다.
 * 로직:
 *   1) forceCount 또는 무작위로 생성 개수 n을 결정한다.
 *   2) eyeXRange(n)으로 eye_x 길이 범위를 결정한다.
 *   3) buildTypeArray(n)으로 각 eye의 타입을 미리 정한다.
 *   4) MAX_ATTEMPTS 이내에서 무작위 시작점·각도·길이로 선분을 시도하고
 *      insideBox, lineInBox, 선분 간 간격(MIN_GAP), 타원 바운딩박스 충돌 조건을 통과한 것만 추가한다.
 *   5) eye_hole 초기 위치를 타원 내 무작위 로컬 좌표에서 월드 좌표로 변환한다.
 *   6) spawnMode/openMode에 따라 각 item에 spawnDelay/openDelay를 할당한다.
 */
function buildLayout() {
  /* n: number — 이번 회차에 생성할 eye_x 총 개수 */
  /* minX,maxX: number — eyeXRange(n) 결과, eye_x 길이 범위(px) */
  /* ta: string[] — buildTypeArray(n) 결과, 각 eye의 타입 목록 */
  /* items: object[] — 배치에 성공한 eye 데이터 객체 배열 */
  /* att: number — 배치 시도 횟수 카운터 */
  /* idx: number — ta 배열에서 타입을 가져오는 인덱스 */
  /* sx,sy: number — eye_x 시작점 후보 좌표 */
  /* ex_len: number — eye_x 길이 후보값(px) */
  /* a: number — eye_x 방향 각도 후보(라디안) */
  /* ex,ey: number — eye_x 끝점 좌표 */
  /* cx,cy: number — eye_circle 중심 (선분 중점) */
  /* rx: number — eye_circle 가로 반축 = ex_len/2 */
  /* eye_y: number — eye_circle 세로 방향 전체 길이 (ex_len/2~ex_len 무작위) */
  /* ry: number — eye_circle 세로 반축 = eye_y/2 */
  /* type: 'A'|'B' — eye_circle 모양 */
  /* bb: {left,right,top,bottom} — eye_circle AABB */
  /* ratio: number — eye_hole 크기 비율 (HOLE_RATIO_ALL 중 선택) */
  /* hole_r: number — eye_hole 반지름(px) = ex_len*ratio/2 */
  /* hxr,hyr: number — eye_hole 초기 위치 가능 범위(로컬 좌표계) */
  /* lx,ly: number — eye_hole 초기 위치(로컬 좌표계, 무작위) */
  /* ca,sa: number — 각도 a의 cos/sin 값 */
  /* init_hx,init_hy: number — eye_hole 초기 위치(월드 좌표계) */
  /* cnt: number — 실제로 배치에 성공한 eye_x 수 */
  /* d: number[] — spawnMode/openMode 2(무작위)에서 사용할 딜레이 목록 */
  /* spawnDelay: number(ms) — 이 eye_x가 페이드인을 시작하기까지 대기 시간 */
  /* openDelay: number(ms) — 이 eye_x가 눈 뜨기를 시작하기까지 추가 대기 시간 */
  const n = forceCount === 'rand' ? Math.round(rand(0.5, 9.5)) : Number(forceCount);
  const { min: minX, max: maxX } = eyeXRange(n);
  const ta = buildTypeArray(n);
  const items = []; let att = 0, idx = 0;
  while (items.length < n && att < MAX_ATTEMPTS) {
    att++;
    const sx = rand(0, BOX), sy = rand(0, BOX);
    if (!insideBox(sx, sy)) continue;
    const ex_len = rand(minX, maxX), a = rand(0, Math.PI * 2);
    const ex = sx + Math.cos(a) * ex_len, ey = sy + Math.sin(a) * ex_len;
    if (!insideBox(ex, ey) || !lineInBox(sx, sy, ex, ey)) continue;
    let tc = false;
    for (const it of items) {
      if (segSegDist(sx, sy, ex, ey, it.sx, it.sy, it.ex, it.ey) < MIN_GAP) { tc = true; break; }
    }
    if (tc) continue;
    const cx = (sx + ex) / 2, cy = (sy + ey) / 2, rx = ex_len / 2;
    const eye_y = rand(ex_len / 2, ex_len), ry = eye_y / 2, type = ta[idx];
    const bb = eyeBBox(cx, cy, a, rx, ry);
    if (!bboxInsideBox(bb)) continue;
    let eo = false;
    for (const it of items) {
      if (bboxOverlap(bb, eyeBBox(it.cx, it.cy, it.angle, it.rx, it.ry))) { eo = true; break; }
    }
    if (eo) continue;
    const ratio  = forceHoleRatio === 'rand' ? HOLE_RATIO_ALL[Math.floor(Math.random() * 3)] : forceHoleRatio;
    const hole_r = ex_len * ratio / 2;
    const hxr = Math.max(0, rx - hole_r), hyr = Math.max(0, ry - hole_r);
    const lx  = hxr ? rand(-hxr, hxr) : 0, ly = hyr ? rand(-hyr, hyr) : 0;
    const ca  = Math.cos(a), sa = Math.sin(a);
    idx++;
    items.push({
      sx, sy, ex, ey,                            /* eye_x 선분 양 끝점 */
      cx, cy,                                    /* eye_circle 중심 */
      angle: a,                                  /* 선분 및 타원 회전 각도 */
      rx, ry,                                    /* 타원 가로/세로 반축 */
      type,                                      /* 타원 모양 */
      hole_r,                                    /* eye_hole 반지름 */
      init_hx: cx + lx * ca - ly * sa,           /* eye_hole 초기 위치 x (월드) */
      init_hy: cy + lx * sa + ly * ca,           /* eye_hole 초기 위치 y (월드) */
      spawnDelay: 0, openDelay: 0                /* 타이밍 딜레이(buildLayout 하단에서 할당) */
    });
  }
  const cnt = items.length;
  /* spawnDelay 할당 */
  if (spawnMode === 1) {
    items.forEach(it => it.spawnDelay = 0);
  } else if (spawnMode === 2) {
    const d = items.map(() => rand(0, T)).sort((a, b) => a - b);
    items.forEach((it, i) => it.spawnDelay = d[i]);
  } else {
    items.forEach((it, i) => it.spawnDelay = cnt <= 1 ? 0 : T * i / (cnt - 1));
  }
  /* openDelay 할당 */
  if (openMode === 1) {
    items.forEach(it => it.openDelay = 0);
  } else if (openMode === 2) {
    const d = items.map(() => rand(0, T)).sort((a, b) => a - b);
    items.forEach((it, i) => it.openDelay = d[i]);
  } else {
    items.forEach(it => it.openDelay = it.spawnDelay);
  }
  return { cnt, items };
}
