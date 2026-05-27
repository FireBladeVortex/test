/* ════════════════════════════════════════════════════════════════
   UI 헬퍼
════════════════════════════════════════════════════════════════ */

/*
 * 목적: 버튼 그룹에서 activeId 에 해당하는 버튼 하나에만 'on' 클래스를 부여하고
 *       나머지는 모두 제거한다. 패널의 모든 토글 버튼 그룹에 사용된다.
 * 로직: ids 배열을 순회하면서 각 id가 activeId와 같으면 classList.add('on'),
 *       다르면 classList.remove('on')을 수행한다.
 */
function activateOne(ids, activeId) {
  /* ids     : string[]  — 같은 그룹에 속한 버튼 id 목록 */
  /* activeId: string    — 'on' 클래스를 부여할 버튼의 id */
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', id === activeId);
  });
}

/*
 * 목적: eye_x 생성 개수를 전역 변수 forceCount 에 저장하고 대응 버튼을 활성화한다.
 * 로직: v가 'rand'면 무작위 버튼, 숫자면 해당 숫자 버튼에 'on' 클래스를 부여한다.
 */
function setCount(v) {
  /* v: 'rand' 또는 1~9 정수 — 생성할 eye_x 개수 또는 무작위 지시자 */
  forceCount = v;
  const ids = ['cnt_r','cnt_1','cnt_2','cnt_3','cnt_4','cnt_5','cnt_6','cnt_7','cnt_8','cnt_9'];
  activateOne(ids, v === 'rand' ? 'cnt_r' : 'cnt_' + v);
}

/*
 * 목적: eye_x 등장 방법(spawnMode)을 설정하고 대응 버튼을 활성화한다.
 * 로직: n을 spawnMode에 저장 후 'sp'+n 버튼에 'on' 클래스를 부여한다.
 */
function setSpawn(n) {
  /* n: 1(동시) | 2(무작위 타이밍) | 3(균일 순서 등장) */
  spawnMode = n;
  activateOne(['sp1','sp2','sp3'], 'sp' + n);
}

/*
 * 목적: eye_circle open 방법(openMode)을 설정하고 대응 버튼을 활성화한다.
 * 로직: n을 openMode에 저장 후 'op'+n 버튼에 'on' 클래스를 부여한다.
 */
function setOpen(n) {
  /* n: 1(동시) | 2(완전 무작위) | 3(등장 순서 연동) */
  openMode = n;
  activateOne(['op1','op2','op3'], 'op' + n);
}

/*
 * 목적: maus 등장 여부(forceMaus)를 설정하고, OFF 시 하위 그룹을 반투명 비활성화한다.
 * 로직: v를 forceMaus에 저장, ON/OFF 버튼 토글,
 *       mausTypeGroup·mausThickGroup의 opacity와 pointerEvents를 v 값에 따라 조정한다.
 */
function setMaus(v) {
  /* v: true(maus 등장) | false(maus 미등장) */
  forceMaus = v;
  activateOne(['mausOn','mausOff'], v ? 'mausOn' : 'mausOff');
  ['mausTypeGroup','mausThickGroup'].forEach(id => {
    document.getElementById(id).style.opacity      = v ? '1' : '0.35';
    document.getElementById(id).style.pointerEvents = v ? '' : 'none';
  });
}

/*
 * 목적: maus 모양 타입(forceMausType)을 설정하고 대응 버튼을 활성화한다.
 * 로직: v를 forceMausType에 저장 후 버튼 id 매핑 객체로 activateOne 호출.
 */
function setMausType(v) {
  /* v: 'rand'(무작위) | 'A'(뾰족 베지어) | 'B'(둥근 타원) */
  forceMausType = v;
  activateOne(['mt_r','mt_A','mt_B'], {rand:'mt_r', A:'mt_A', B:'mt_B'}[v]);
}

/*
 * 목적: maus 두께 스타일(forceMausThick)을 설정하고 대응 버튼을 활성화한다.
 * 로직: v를 forceMausThick에 저장 후 버튼 id 매핑 객체로 activateOne 호출.
 */
function setMausThick(v) {
  /* v: 'rand' | 0(균일 10px) | 1(역볼록) | 2(sine 완만) | 3(직선) */
  forceMausThick = v;
  activateOne(['mth_r','mth_0','mth_1','mth_2','mth_3'],
    {rand:'mth_r', 0:'mth_0', 1:'mth_1', 2:'mth_2', 3:'mth_3'}[v]);
}

/*
 * 목적: eye_circle 모양 타입(forceEyeType)을 설정하고 대응 버튼을 활성화한다.
 * 로직: v를 forceEyeType에 저장 후 버튼 id 매핑 객체로 activateOne 호출.
 */
function setEyeType(v) {
  /* v: 'rand'(무작위) | 'A'(뾰족 베지어) | 'B'(둥근 타원) */
  forceEyeType = v;
  activateOne(['et_r','et_A','et_B'], {rand:'et_r', A:'et_A', B:'et_B'}[v]);
}

/*
 * 목적: eye_hole 크기 비율(forceHoleRatio)을 설정하고 대응 버튼을 활성화한다.
 * 로직: v를 forceHoleRatio에 저장, 부동소수점 비교로 버튼 id를 결정해 activateOne 호출.
 */
function setHoleRatio(v) {
  /* v: 'rand' | 1/3(소) | 1/2(중) | 2/3(대) */
  forceHoleRatio = v;
  const key = v==='rand' ? 'hr_r' : v===(1/3) ? 'hr_1_3' : v===0.5 ? 'hr_1_2' : 'hr_2_3';
  activateOne(['hr_r','hr_1_3','hr_1_2','hr_2_3'], key);
}

/* 초기 버튼 상태 설정 */
setCount('rand'); setSpawn(1); setOpen(1);
setMaus(true); setMausType('rand'); setMausThick('rand');
setEyeType('rand'); setHoleRatio('rand');
