/* ════════════════════════════════════════════════════════════════
   수학 / 유틸
════════════════════════════════════════════════════════════════ */

/*
 * 목적: a 이상 b 미만의 균일 분포 무작위 실수를 반환한다.
 * 로직: Math.random()(0~1)에 범위 폭(b-a)을 곱하고 a를 더한다.
 */
function rand(a, b) {
  /* a: number — 범위 하한(포함) */
  /* b: number — 범위 상한(미포함) */
  return Math.random() * (b - a) + a;
}

/*
 * 목적: 0~1 진행도 t를 받아 감속(끝에서 느려지는) 곡선 값을 반환한다.
 * 로직: quadratic ease-out 공식 1-(1-t)^2. t=0→0, t=1→1, 중간은 곡선.
 */
function easeOut(t) {
  /* t: number 0~1 — 선형 진행도 */
  /* 반환값: number 0~1 — 감속 적용된 진행도 */
  return 1 - (1 - t) * (1 - t);
}

/*
 * 목적: 0~1 진행도 t를 받아 가속 후 감속하는 부드러운 곡선 값을 반환한다.
 * 로직: t<0.5 구간은 ease-in(2t^2), t>=0.5 구간은 ease-out 대칭 공식 적용.
 */
function easeInOut(t) {
  /* t: number 0~1 — 선형 진행도 */
  /* 반환값: number 0~1 — 가속-감속 적용된 진행도 */
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* ════════════════════════════════════════════════════════════════
   공간 판정
════════════════════════════════════════════════════════════════ */

/*
 * 목적: 점 (x, y)이 캔버스의 둥근 사각형 경계 안에 있는지 판정한다.
 * 로직: 점에서 가장 가까운 둥근 모서리 원의 중심(cx, cy)을 구하고,
 *       점과 중심 사이 거리²가 BOX_RADIUS²-1 이하이면 내부로 판정한다.
 */
function insideBox(x, y) {
  /* x, y: number — 판정할 점의 캔버스 좌표(px) */
  /* cx, cy: number — x, y에서 가장 가까운 모서리 원의 중심 좌표 */
  const cx = x < BOX_RADIUS ? BOX_RADIUS : (x > BOX - BOX_RADIUS ? BOX - BOX_RADIUS : x);
  const cy = y < BOX_RADIUS ? BOX_RADIUS : (y > BOX - BOX_RADIUS ? BOX - BOX_RADIUS : y);
  return (x - cx) ** 2 + (y - cy) ** 2 <= BOX_RADIUS ** 2 - 1;
}

/*
 * 목적: 선분 (x1,y1)~(x2,y2) 전체가 캔버스 경계 내부에 있는지 확인한다.
 * 로직: 선분을 SAMPLE_COUNT 등분해 각 점을 insideBox로 검사하고,
 *       하나라도 밖이면 false를 반환한다.
 */
function lineInBox(x1, y1, x2, y2) {
  /* x1,y1: number — 선분 시작점 좌표 */
  /* x2,y2: number — 선분 끝점 좌표 */
  /* t: number 0~1 — 선분 위의 보간 매개변수 */
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = i / SAMPLE_COUNT;
    if (!insideBox(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

/*
 * 목적: 점 (px, py)에서 선분 (ax,ay)~(bx,by)까지의 최단 거리를 반환한다.
 * 로직: 점을 선분에 정사영한 매개변수 t를 0~1로 클램핑해 최근점을 구하고
 *       점과의 유클리드 거리를 반환한다.
 */
function ptSegDist(px, py, ax, ay, bx, by) {
  /* px,py: number — 거리를 구할 점 */
  /* ax,ay,bx,by: number — 선분 양 끝점 */
  /* dx,dy: number — 선분 방향 벡터 성분 */
  /* len2: number — 선분 길이의 제곱 (0이면 점과 동일) */
  /* t: number 0~1 — 정사영 매개변수 (클램핑 후) */
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  if (!len2) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/*
 * 목적: 두 선분 사이의 최단 거리를 반환한다.
 * 로직: 선분1의 두 끝점에서 선분2까지, 선분2의 두 끝점에서 선분1까지
 *       ptSegDist를 4회 호출하고 최솟값을 반환한다.
 *       (교차 시 0을 반환하지 않을 수 있으나 간격 판정에는 충분히 정확하다.)
 */
function segSegDist(ax, ay, bx, by, cx, cy, dx, dy) {
  /* ax,ay,bx,by: number — 첫 번째 선분의 양 끝점 */
  /* cx,cy,dx,dy: number — 두 번째 선분의 양 끝점 */
  return Math.min(
    ptSegDist(ax, ay, cx, cy, dx, dy),
    ptSegDist(bx, by, cx, cy, dx, dy),
    ptSegDist(cx, cy, ax, ay, bx, by),
    ptSegDist(dx, dy, ax, ay, bx, by)
  );
}

/*
 * 목적: 회전된 eye_circle 타원의 축 정렬 바운딩 박스(AABB)를 계산한다.
 * 로직: 회전 타원의 AABB 공식을 사용해 가로·세로 반폭을 구하고
 *       EYE_PAD 여유를 더해 박스 좌표를 반환한다.
 *       공식: hw = sqrt((rx·cosA)² + (ry·sinA)²), hh = sqrt((rx·sinA)² + (ry·cosA)²)
 */
function eyeBBox(cx, cy, a, rx, ry) {
  /* cx,cy: number — 타원 중심 좌표 */
  /* a: number — 타원 회전 각도(라디안) */
  /* rx: number — 타원 가로 반축(px) */
  /* ry: number — 타원 세로 반축(px) */
  /* c,s: number — a의 cos/sin 값 */
  /* hw,hh: number — AABB 가로/세로 반폭 */
  const c = Math.cos(a), s = Math.sin(a);
  const hw = Math.sqrt(rx * rx * c * c + ry * ry * s * s) + EYE_PAD;
  const hh = Math.sqrt(rx * rx * s * s + ry * ry * c * c) + EYE_PAD;
  return { left: cx - hw, right: cx + hw, top: cy - hh, bottom: cy + hh };
}

/*
 * 목적: 두 AABB 박스가 겹치는지 판정한다.
 * 로직: 분리축 이론(SAT)을 적용해 어느 한 축에서라도 분리되면 false를 반환한다.
 */
function bboxOverlap(a, b) {
  /* a,b: {left,right,top,bottom} — 두 바운딩 박스 */
  return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
}

/*
 * 목적: 바운딩 박스의 대표 8개 점이 모두 캔버스 둥근 사각형 안에 있는지 확인한다.
 * 로직: 박스의 네 꼭짓점과 네 변 중점을 추출하고,
 *       각 점에서 EYE_MARGIN 만큼 수축된 캔버스 경계를 insideBox 방식으로 검사한다.
 */
function bboxInsideBox(bb) {
  /* bb: {left,right,top,bottom} — 검사할 바운딩 박스 */
  /* m: number — EYE_MARGIN(경계 여백) */
  /* pts: [x,y][] — 검사할 8개 점 목록 */
  /* cx,cy: number — 각 점의 수축된 모서리 원 중심 */
  const m = EYE_MARGIN;
  const pts = [
    [bb.left,  bb.top],    [bb.right, bb.top],
    [bb.left,  bb.bottom], [bb.right, bb.bottom],
    [(bb.left + bb.right) / 2, bb.top],
    [(bb.left + bb.right) / 2, bb.bottom],
    [bb.left,  (bb.top + bb.bottom) / 2],
    [bb.right, (bb.top + bb.bottom) / 2]
  ];
  for (const [x, y] of pts) {
    const cx = x < BOX_RADIUS + m ? BOX_RADIUS + m : (x > BOX - BOX_RADIUS - m ? BOX - BOX_RADIUS - m : x);
    const cy = y < BOX_RADIUS + m ? BOX_RADIUS + m : (y > BOX - BOX_RADIUS - m ? BOX - BOX_RADIUS - m : y);
    if ((x - cx) ** 2 + (y - cy) ** 2 > (BOX_RADIUS - m) ** 2) return false;
    if (x < m || x > BOX - m || y < m || y > BOX - m) return false;
  }
  return true;
}
