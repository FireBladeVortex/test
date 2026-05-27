/* ════════════════════════════════════════════════════════════════
   그리기 헬퍼
════════════════════════════════════════════════════════════════ */

/*
 * 목적: id='canvas'인 HTML 캔버스 엘리먼트의 2D 렌더링 컨텍스트를 반환한다.
 * 기능: 모든 그리기 함수에서 ctx를 얻는 단일 진입점 역할을 한다.
 * 로직: getElementById('canvas')로 캔버스 DOM을 찾고 getContext('2d')를 호출한다.
 */
function getCtx() {
  /* 반환값: CanvasRenderingContext2D — 캔버스 2D 그리기 컨텍스트 */
  return document.getElementById('canvas').getContext('2d');
}

/*
 * 목적: eye 또는 maus 형태의 닫힌 윤곽 경로를 ctx의 현재 좌표계에 설정한다.
 * 기능: fillShape 내부에서만 사용하는 경로 생성 전용 헬퍼.
 *       ctx.save/restore 없이 translate/rotate를 직접 실행하므로,
 *       반드시 호출 전 ctx.save(), 이후 ctx.restore()가 있어야 한다.
 * 로직: ctx를 (it.cx, it.cy)로 이동하고 it.angle만큼 회전.
 *       type='A'이면 위·아래 베지어 호 두 개로 뾰족한 눈 모양을 만들고 closePath.
 *       type='B'이면 ctx.ellipse로 매끄러운 타원 경로를 만든다.
 */
function buildClosedPath(ctx, it, ry) {
  /* ctx : CanvasRenderingContext2D — save/restore 없이 transform이 적용되는 컨텍스트 */
  /* it  : object — eye 또는 maus 데이터 (cx, cy, angle, rx, type 프로퍼티를 사용) */
  /* ry  : number — 현재 프레임의 세로 반축(px). 팽창 중이면 0→it.ry로 증가 */
  /* rx  : number — it.rx 복사본. 가로 반축(px) */
  /* cp  : number — 베지어 제어점 x 오프셋. rx × 0.55 (타원 3차 베지어 근사 상수) */
  ctx.translate(it.cx, it.cy);
  ctx.rotate(it.angle);
  const rx = it.rx, cp = rx * 0.55;
  if (it.type === 'A') {
    ctx.moveTo(-rx, 0);
    ctx.bezierCurveTo(-cp, -ry, cp, -ry, rx, 0);
    ctx.bezierCurveTo( cp,  ry,-cp,  ry,-rx, 0);
    ctx.closePath();
  } else {
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  }
}

/*
 * 목적: eye 또는 maus 형태의 내부를 지정한 색(fc)으로 채운다.
 * 기능: eye_circle 흰색 내부, maus_circle 검정 내부 모두 이 함수로 그린다.
 * 로직: ry가 0 이하이면 아무것도 그리지 않고 종료.
 *       ctx.save로 현재 변환 상태를 저장하고, beginPath 후 buildClosedPath로
 *       닫힌 경로를 설정, fillStyle을 fc로 지정해 fill().
 *       ctx.restore로 변환 상태를 원래대로 복원한다.
 */
function fillShape(ctx, it, ry, fc) {
  /* ctx : CanvasRenderingContext2D */
  /* it  : object — eye 또는 maus 데이터 (buildClosedPath에 전달됨) */
  /* ry  : number — 세로 반축(px). 0 이하이면 그리지 않음 */
  /* fc  : string — 채울 CSS 색상 문자열 (예: '#ffffff'=흰색, '#000000'=검정) */
  if (ry <= 0) return;
  ctx.save();
  ctx.beginPath();
  buildClosedPath(ctx, it, ry);
  ctx.fillStyle = fc;
  ctx.fill();
  ctx.restore();
}

/*
 * 목적: eye_circle의 테두리(윤곽선)를 균일 두께로 그린다.
 * 기능: 눈이 열리는 grow 단계에서 ry가 증가할 때마다 호출되어 타원 테두리를 표시한다.
 * 로직: ry가 0 이하이면 스킵.
 *       ctx.save 후 strokeStyle/lineWidth/lineCap을 설정하고 eye 로컬 좌표계로 변환.
 *       type='A'이면 위 호(y<0 방향)와 아래 호(y>0 방향) 두 베지어를 개별 stroke.
 *       type='B'이면 ellipse를 stroke.
 *       ctx.restore로 복원.
 */
function strokeEyeCircle(ctx, it, ry, sc, lw) {
  /* ctx : CanvasRenderingContext2D */
  /* it  : object — eye 데이터 (cx, cy, angle, rx, type 사용) */
  /* ry  : number — 세로 반축(px). grow 중에는 0→it.ry로 증가 */
  /* sc  : string — 테두리 CSS 색상 (호출 측에서 LINE_COLOR 전달) */
  /* lw  : number — 테두리 두께(px) (호출 측에서 THICK 전달) */
  /* rx  : number — it.rx 복사본, 가로 반축 */
  /* cp  : number — 베지어 제어점 x 오프셋 (rx × 0.55) */
  if (ry <= 0) return;
  ctx.save();
  ctx.strokeStyle = sc; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.translate(it.cx, it.cy); ctx.rotate(it.angle);
  const rx = it.rx, cp = rx * 0.55;
  if (it.type === 'A') {
    ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-cp, -ry, cp, -ry, rx, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-cp,  ry, cp,  ry, rx, 0); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/*
 * 목적: eye_circle 윤곽선 안쪽 영역으로만 클리핑한 뒤 eye_hole(동공)을 그 안에 표시한다.
 * 기능: 동공이 eye_circle 밖으로 튀어나오지 않도록 캔버스 클리핑을 사용한다.
 * 로직:
 *   1) ctx.save로 상태 저장.
 *   2) eye 로컬 좌표계(translate+rotate)로 변환한다.
 *   3) eye_circle 형태의 닫힌 경로를 설정하고 ctx.clip()으로 클리핑 영역을 지정한다.
 *   4) hx, hy는 월드 좌표이므로 역변환(월드→로컬)을 적용한다:
 *      dx = hx - cx, dy = hy - cy → 중심 기준 변위
 *      로컬 좌표 = (dx·cos(-angle) - dy·sin(-angle),  dx·sin(-angle) + dy·cos(-angle))
 *   5) 역변환된 로컬 좌표에서 ctx.arc로 동공을 그린다.
 *   6) ctx.restore로 클리핑 해제 및 변환 복원.
 * 주의: buildClosedPath를 사용하지 않고 독립 구현한다.
 *       buildClosedPath는 save 없이 transform을 변경하므로, 여러 eye가 있을 때
 *       이전 루프의 transform이 누적되어 좌표가 틀어지는 버그를 방지하기 위함이다.
 */
function drawHoleClipped(ctx, it, hx, hy) {
  /* ctx   : CanvasRenderingContext2D */
  /* it    : object — eye 데이터 (cx, cy, angle, rx, ry, type, hole_r 사용) */
  /* hx,hy : number — eye_hole 중심 좌표 (월드 좌표계, px) */
  /* rx,ry : number — it.rx/it.ry 복사본. eye_circle 가로/세로 반축 */
  /* cp    : number — 베지어 제어점 x 오프셋 (rx × 0.55) */
  /* dx,dy : number — hx/hy에서 eye 중심(it.cx, it.cy)을 뺀 월드 변위 벡터 */
  /* ca,sa : number — -it.angle의 cos/sin. 월드→로컬 역회전에 사용 */
  /* 로컬 x : dx·ca - dy·sa   (역회전 x 성분) */
  /* 로컬 y : dx·sa + dy·ca   (역회전 y 성분) */
  ctx.save();
  ctx.translate(it.cx, it.cy);
  ctx.rotate(it.angle);
  const rx = it.rx, ry = it.ry, cp = rx * 0.55;
  ctx.beginPath();
  if (it.type === 'A') {
    ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-cp, -ry, cp, -ry, rx, 0);
    ctx.bezierCurveTo(cp, ry, -cp, ry, -rx, 0); ctx.closePath();
  } else {
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  }
  ctx.clip();
  const dx = hx - it.cx, dy = hy - it.cy;
  const ca = Math.cos(-it.angle), sa = Math.sin(-it.angle);
  ctx.fillStyle = LINE_COLOR;
  ctx.beginPath();
  ctx.arc(dx * ca - dy * sa, dx * sa + dy * ca, it.hole_r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/*
 * 목적: maus_circle 테두리의 위치(t)에서의 선 두께를 스타일(s)에 따라 계산해 반환한다.
 * 기능: strokeVariableWidth 내부에서 매 세그먼트마다 호출되어 가변 두께를 구현한다.
 * 로직:
 *   스타일 0 — 균일 10px: 위치 무관하게 항상 10 반환
 *   스타일 1 — 역볼록: 중앙(t=0.5)이 4px로 가장 얇고 양 끝(t=0,1)이 최대 12px
 *              공식: 4 + 8 × |t-0.5|×2 의 1.5승
 *   스타일 2 — sine 완만 (사용자 제안 A): 양 끝 3px → 중앙 9px
 *              공식: 3 + 6 × sin(π·t)
 *   스타일 3 — 직선 (사용자 제안 B): 양 끝 3px → 중앙 9px, 두 직선 구간
 *              공식: t<0.5이면 3+12t, t>=0.5이면 3+12(1-t)
 */
function thickFn(s, t) {
  /* s : 0|1|2|3 — 두께 스타일 번호 */
  /* t : number 0~1 — 호 위의 위치 (0=왼쪽 끝, 0.5=중앙, 1=오른쪽 끝) */
  /* 반환값 : number — 해당 위치의 lineWidth(px) */
  switch (s) {
    case 0: return 10;
    case 1: return 4 + 8 * Math.pow(Math.abs(t - 0.5) * 2, 1.5);
    case 2: return 3 + 6 * Math.sin(Math.PI * t);
    case 3: return t < 0.5 ? 3 + 12 * t : 3 + 12 * (1 - t);
  }
}

/*
 * 목적: 3차 베지어 곡선 위의 매개변수 t 위치에 해당하는 좌표를 반환한다.
 * 기능: strokeVariableWidth에서 maus_circle 타입 A 호의 각 세그먼트 좌표를 구하는 데 사용한다.
 * 로직: Bernstein 기저 전개식을 직접 계산한다.
 *       x(t) = (1-t)³·x0 + 3(1-t)²t·x1 + 3(1-t)t²·x2 + t³·x3
 *       y도 동일한 방식으로 계산.
 */
function bezierPt(t, x0, y0, x1, y1, x2, y2, x3, y3) {
  /* t      : number 0~1 — 곡선 위 위치 매개변수 */
  /* x0,y0  : number — P0, 시작점 좌표 (베지어 호 왼쪽 끝) */
  /* x1,y1  : number — P1, 첫 번째 제어점 좌표 */
  /* x2,y2  : number — P2, 두 번째 제어점 좌표 */
  /* x3,y3  : number — P3, 끝점 좌표 (베지어 호 오른쪽 끝) */
  /* u       : number — 1-t. 보간 보완 값 */
  /* 반환값  : {x: number, y: number} — 해당 t의 곡선 위 좌표 */
  const u = 1 - t;
  return {
    x: u**3*x0 + 3*u**2*t*x1 + 3*u*t**2*x2 + t**3*x3,
    y: u**3*y0 + 3*u**2*t*y1 + 3*u*t**2*y2 + t**3*y3
  };
}

/*
 * 목적: 원점 기준 타원 위의 각도 a에 해당하는 좌표를 반환한다.
 * 기능: strokeVariableWidth에서 maus_circle 타입 B 반호의 각 세그먼트 좌표를 구한다.
 * 로직: 타원 파라메트릭 방정식 적용:  x = rx·cos(a),  y = ry·sin(a)
 */
function ellipsePt(a, rx, ry) {
  /* a  : number — 타원 위의 각도(라디안). 0~2π 범위 */
  /* rx : number — 가로 반축(px) */
  /* ry : number — 세로 반축(px) */
  /* 반환값 : {x: number, y: number} — 해당 각도의 타원 위 좌표 */
  return { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
}

/*
 * 목적: 호(베지어 또는 타원 반호)를 MAUS_SEG 개의 짧은 선분으로 분할하고,
 *       각 선분의 위치에서 thickFn이 반환하는 두께로 선을 그려 가변 두께 효과를 낸다.
 * 기능: maus_circle 테두리의 입 모양 가변 두께 효과를 구현한다.
 * 로직: i = 0 ~ MAUS_SEG-1 루프로 t0/t1(세그먼트 양 끝 t값)을 계산한다.
 *       두께 결정 시 t는 세그먼트 중점을 쓴다.
 *       isBottom=true이면 두께 t를 1-중점으로 뒤집어, 위/아래 호가 같은 두께 분포를 가지게 한다.
 *       getPt(t0)/getPt(t1)로 좌표를 받아 moveTo→lineTo→stroke를 반복한다.
 */
function strokeVariableWidth(ctx, getPt, style, isBottom) {
  /* ctx      : CanvasRenderingContext2D — 이미 maus 로컬 좌표계로 변환된 상태여야 함 */
  /* getPt    : (t: number)=>{x,y} — t(0~1)를 입력받아 호 위 좌표를 반환하는 콜백 */
  /* style    : 0|1|2|3 — thickFn에 전달할 두께 스타일 번호 */
  /* isBottom : boolean — true이면 아래 호. t를 뒤집어 위/아래 두께 분포를 대칭으로 맞춤 */
  /* N        : number — MAUS_SEG 복사본 (세그먼트 총 수) */
  /* i        : number — 루프 인덱스 (0 ~ N-1) */
  /* t0,t1    : number — 현재 세그먼트의 시작/끝 매개변수 t값 (0~1) */
  /* tw       : number — 두께 계산에 쓸 t값. isBottom이면 1-(t0+t1)/2, 아니면 (t0+t1)/2 */
  /* p0,p1    : {x,y} — 세그먼트 시작/끝 좌표 */
  const N = MAUS_SEG;
  ctx.save();
  ctx.strokeStyle = MAUS_COLOR; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const tw = isBottom ? 1 - (t0 + t1) / 2 : (t0 + t1) / 2;
    const p0 = getPt(t0), p1 = getPt(t1);
    ctx.lineWidth = thickFn(style, tw);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
  ctx.restore();
}

/*
 * 목적: maus_circle의 테두리를 thickStyle에 따른 가변 두께로 그린다.
 * 기능: maus 시퀀스(팽창 단계)와 drawMausBg에서 호출되어 빨간 입 모양 테두리를 표시한다.
 * 로직: ry가 0 이하이면 스킵.
 *       ctx.save 후 maus 로컬 좌표계(translate+rotate)로 변환한다.
 *       type='A'이면 위 베지어 호(y<0)와 아래 베지어 호(y>0) 각각 strokeVariableWidth 호출.
 *       type='B'이면 타원을 위 반원(각도 π→0)과 아래 반원(각도 π→2π)으로 나눠 호출.
 *       isBottom 플래그로 위/아래 호의 두께 방향을 대칭으로 맞춘다.
 *       ctx.restore로 복원.
 */
function strokeMausCircle(ctx, maus, ry) {
  /* ctx  : CanvasRenderingContext2D */
  /* maus : object — buildMaus() 반환값 (cx, cy, angle, rx, ry, type, thickStyle 사용) */
  /* ry   : number — 현재 세로 반축(px). grow 중에는 0→maus.ry로 증가 */
  /* rx   : number — maus.rx 복사본. 가로 반축 */
  /* cp   : number — 베지어 제어점 x 오프셋 (rx × 0.55) */
  /* st   : 0|1|2|3 — maus.thickStyle 복사본. strokeVariableWidth에 전달 */
  if (ry <= 0) return;
  ctx.save();
  ctx.translate(maus.cx, maus.cy); ctx.rotate(maus.angle);
  const rx = maus.rx, cp = rx * 0.55, st = maus.thickStyle;
  if (maus.type === 'A') {
    strokeVariableWidth(ctx, t => bezierPt(t, -rx,0, -cp,-ry, cp,-ry, rx,0), st, false);
    strokeVariableWidth(ctx, t => bezierPt(t, -rx,0, -cp, ry, cp, ry, rx,0), st, true);
  } else {
    strokeVariableWidth(ctx, t => ellipsePt(Math.PI - Math.PI * t, rx, ry), st, false);
    strokeVariableWidth(ctx, t => ellipsePt(Math.PI + Math.PI * t, rx, ry), st, true);
  }
  ctx.restore();
}

/*
 * 목적: maus_circle 전체(내부 채움 + 빨간 테두리)를 배경 레이어로 그린다.
 * 기능: eye 시퀀스 renderFrame에서 매 프레임 가장 먼저 호출되어
 *       모든 eye_circle 아래에 maus_circle이 존재하도록 레이어 순서를 보장한다.
 * 로직: fillShape로 내부를 MAUS_FILL(검정)로 채운 뒤,
 *       strokeMausCircle로 빨간 가변 두께 테두리를 그 위에 덮어 그린다.
 */
function drawMausBg(ctx, maus) {
  /* ctx  : CanvasRenderingContext2D */
  /* maus : object — buildMaus() 반환값 (fillShape, strokeMausCircle에 그대로 전달) */
  fillShape(ctx, maus, maus.ry, MAUS_FILL);
  strokeMausCircle(ctx, maus, maus.ry);
}
