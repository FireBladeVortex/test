/* ════════════════════════════════════════════════════════════════
   렌더
════════════════════════════════════════════════════════════════ */

/*
 * 목적: 경과 시간(e ms)을 기반으로 모든 eye의 현재 상태를 캔버스에 그린다.
 * 기능: runEye의 rAF 루프에서 매 프레임 호출되는 중심 렌더링 함수.
 *       단일 루프로 maus 배경 + 모든 eye의 페이드인/grow/동공을 처리한다.
 * 로직:
 *   1) 캔버스 전체를 지우고, maus가 있으면 drawMausBg로 배경을 먼저 그린다.
 *   2) 각 eye(it)에 대해 세 단계 진행도를 각각 계산한다:
 *      sp  (spawn progress)  : (e - spawnDelay) / T, 0~1 클램핑. 선 페이드인 진행도.
 *      op  (open progress)   : (e - openStart)  / T, 0~1 클램핑. 눈 뜨기 진행도.
 *                              openStart = spawnDelay + T(페이드인) + T(대기) + openDelay
 *      hp  (hole progress)   : (e - holeStart)  / T, 0~1 클램핑. 동공 이동 진행도.
 *                              holeStart = openStart + T(grow완료) + T(대기)
 *   3) sp <= 0이면 아직 등장 전이므로 건너뜀.
 *   4) op <= 0이면 선 페이드인 단계: globalAlpha = easeOut(sp)로 선을 그린다.
 *   5) op > 0이면 눈 뜨기 단계: ry = it.ry × easeOut(op)로 커지는 타원을
 *      흰색 채움(fillShape) + 테두리(strokeEyeCircle)로 그린다.
 *      op >= 1이 되면 동공(drawHoleClipped)도 추가로 그린다:
 *      init_hx/init_hy → cx/cy 방향으로 easeInOut(hp)에 따라 이동.
 */
function renderFrame(ctx, items, maus, e) {
  /* ctx       : CanvasRenderingContext2D */
  /* items     : object[] — buildLayout() 반환 eye 배열 */
  /* maus      : object|null — buildMaus() 반환값 또는 null (없으면 배경 안 그림) */
  /* e         : number(ms) — runEye 시작 시각 기준 경과 시간 */
  /* it        : object — items 배열의 각 eye 데이터 객체 */
  /* sp        : number 0~1 — 선 페이드인 진행도 */
  /* openStart : number(ms) — op 타이머의 시작 기준 시각 */
  /* op        : number 0~1 — 눈 뜨기(grow) 진행도 */
  /* holeStart : number(ms) — hp 타이머의 시작 기준 시각 */
  /* hp        : number 0~1 — 동공 이동 진행도 */
  /* ry        : number(px) — 현재 프레임의 eye_circle 세로 반축. op 적용 결과 */
  /* hx,hy     : number(px) — 현재 프레임의 eye_hole 중심 좌표(월드). hp 보간 결과 */
  ctx.clearRect(0, 0, BOX, BOX);
  if (maus) drawMausBg(ctx, maus);
  for (const it of items) {
    const sp        = Math.min(Math.max((e - it.spawnDelay) / T, 0), 1);
    const openStart = it.spawnDelay + T + T + it.openDelay;
    const op        = Math.min(Math.max((e - openStart) / T, 0), 1);
    const holeStart = openStart + T + T;
    const hp        = Math.min(Math.max((e - holeStart) / T, 0), 1);
    if (sp <= 0) continue;
    if (op <= 0) {
      ctx.save();
      ctx.globalAlpha = easeOut(sp);
      ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = THICK; ctx.lineCap = LINE_CAP;
      ctx.beginPath(); ctx.moveTo(it.sx, it.sy); ctx.lineTo(it.ex, it.ey); ctx.stroke();
      ctx.restore();
    } else {
      const ry = it.ry * easeOut(op);
      fillShape(ctx, it, ry, '#ffffff');
      strokeEyeCircle(ctx, it, ry, LINE_COLOR, THICK);
      if (op >= 1) {
        const hx = it.init_hx + (it.cx - it.init_hx) * easeInOut(hp);
        const hy = it.init_hy + (it.cy - it.init_hy) * easeInOut(hp);
        drawHoleClipped(ctx, it, hx, hy);
      }
    }
  }
}

/*
 * 목적: maus_x 선 페이드인 → 대기 → maus_circle 팽창 순서로 애니메이션하고,
 *       완료 후 onDone 콜백을 호출한다.
 * 기능: startAll에서 forceMaus=true일 때 eye 시퀀스보다 먼저 실행되는 전처리 애니메이션.
 * 로직: rAF 루프에서 st 기준 경과 시간 e를 매 프레임 계산한다.
 *       e < T         : maus_x 선을 easeOut(e/T) 투명도로 그린다(페이드인).
 *       T <= e < T*2  : 대기 구간. clearRect만 하고 아무것도 그리지 않는다.
 *       e >= T*2      : p=(e-T*2)/T로 팽창 진행도 계산. maus_circle을 ry=maus.ry×easeOut(p)로 그린다.
 *       e >= T*3      : 팽창 완료. 최종 ry=maus.ry 상태로 그리고 animId=null 후 onDone() 호출.
 */
function runMaus(maus, onDone) {
  /* maus   : object — buildMaus() 반환값 (sx,sy,ex,ey,cx,cy,angle,rx,ry,type,thickStyle) */
  /* onDone : function — 팽창 완료 후 호출할 콜백. startAll에서 setTimeout+runEye를 넘김 */
  /* ctx    : CanvasRenderingContext2D — getCtx()로 얻은 그리기 컨텍스트 */
  /* st     : number|null — rAF 첫 번째 timestamp. null이면 아직 초기화 전 */
  /* e      : number(ms) — st 기준 경과 시간 */
  /* p      : number 0~1 — maus_circle 팽창 진행도. (e-T*2)/T, 최대 1로 클램핑 */
  /* ry     : number(px) — 현재 프레임의 maus_circle 세로 반축. maus.ry × easeOut(p) */
  const ctx = getCtx(); let st = null;
  function step(ts) {
    if (!st) st = ts;
    const e = ts - st;
    ctx.clearRect(0, 0, BOX, BOX);
    if (e < T) {
      ctx.globalAlpha = easeOut(e / T);
      ctx.strokeStyle = MAUS_COLOR; ctx.lineWidth = THICK; ctx.lineCap = LINE_CAP;
      ctx.beginPath(); ctx.moveTo(maus.sx, maus.sy); ctx.lineTo(maus.ex, maus.ey); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      const p  = Math.min((e - T - T) / T, 1);
      const ry = maus.ry * Math.max(easeOut(p), 0);
      fillShape(ctx, maus, ry, MAUS_FILL);
      strokeMausCircle(ctx, maus, ry);
      if (e >= T * 3) {
        fillShape(ctx, maus, maus.ry, MAUS_FILL);
        strokeMausCircle(ctx, maus, maus.ry);
        animId = null; onDone?.(); return;
      }
    }
    animId = requestAnimationFrame(step);
  }
  animId = requestAnimationFrame(step);
}

/*
 * 목적: eye_x 선 페이드인 → 눈 뜨기 → 동공 등장 → 동공 중심 이동 전체 시퀀스를
 *       단일 rAF 루프로 실행한다.
 * 로직: items 배열에서 각 eye의 spawnDelay+openDelay+여유시간을 합산해 total을 결정하고,
 *       경과 시간 e를 renderFrame에 넘겨 매 프레임을 그린다.
 *       e >= total 이 되면 루프를 종료한다.
 */
function runEye(items, maus) {
  /* items: object[] — buildLayout() eye 배열 */
  /* maus: object|null — maus 데이터 또는 null */
  /* ctx: CanvasRenderingContext2D */
  /* total: number(ms) — 애니메이션 전체 길이. 각 eye의 최대 완료 시각으로 결정 */
  /* st: number|null — rAF 첫 timestamp */
  /* e: number(ms) — st 기준 경과 시간 */
  const ctx = getCtx();
  const total = Math.max(
    ...items.map(it => it.spawnDelay + T + T + it.openDelay + T + T + T + T),
    T * 6
  );
  let st = null;
  function step(ts) {
    if (!st) st = ts;
    const e = ts - st;
    renderFrame(ctx, items, maus, e);
    if (e < total) animId = requestAnimationFrame(step);
    else animId = null;
  }
  animId = requestAnimationFrame(step);
}

/* ════════════════════════════════════════════════════════════════
   진입점
════════════════════════════════════════════════════════════════ */

/*
 * 목적: 재생 버튼 클릭 시 전체 애니메이션을 처음부터 시작한다.
 * 로직: 진행 중인 rAF가 있으면 취소하고, buildLayout으로 eye 데이터를 생성한다.
 *       forceMaus가 true이면 buildMaus → runMaus → setTimeout(T) → runEye 순서로 실행.
 *       false이면 바로 runEye를 실행한다.
 */
function startAll() {
  /* animId: number|null — 취소할 rAF 핸들 */
  /* cnt: number — buildLayout이 실제로 배치한 eye_x 수 */
  /* items: object[] — buildLayout eye 배열 */
  /* maus: object — buildMaus() 반환값 */
  if (animId) cancelAnimationFrame(animId);
  const { cnt, items } = buildLayout();
  if (forceMaus) {
    const maus = buildMaus();
    runMaus(maus, () => setTimeout(() => runEye(items, maus), T));
  } else {
    runEye(items, null);
  }
}

/*
 * 목적: 초기화 버튼 클릭 시 진행 중인 애니메이션을 중단하고 캔버스를 지운다.
 * 로직: animId가 있으면 cancelAnimationFrame으로 취소하고, clearRect로 캔버스를 초기화한다.
 */
function resetAll() {
  /* animId: number|null — 취소할 rAF 핸들 */
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  getCtx().clearRect(0, 0, BOX, BOX);
}

startAll();
