/* ==========================================================
   북눅 공통 스크립트 — 모든 페이지의 상단 바 · 헤더 · 설정 Drawer · 푸터,
   장바구니 · 찜 · 로그인 상태(브라우저 저장소)를 담당합니다.
   ========================================================== */
document.documentElement.classList.add('js');
const HOME = 'index.html';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { localStorage.removeItem(k); } catch(e){} },
  json(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch(e){ return d; } },
  setJSON(k, v){ this.set(k, JSON.stringify(v)); }
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const won = n => n.toLocaleString('ko-KR') + '원';
const params = new URLSearchParams(location.search);
const product = id => PRODUCTS.find(p => p.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- 상태: 장바구니 · 찜 · 회원 ---------- */
const Cart = {
  items(){ return store.json('bn-cart', []).filter(i => product(i.id)); },
  save(v){ store.setJSON('bn-cart', v); updateBadges(); },
  add(id, qty = 1){ const v = this.items(), f = v.find(i => i.id === id); f ? f.qty = Math.min(99, f.qty + qty) : v.push({ id, qty }); this.save(v); },
  setQty(id, qty){ this.save(this.items().map(i => i.id === id ? { ...i, qty:Math.max(1, Math.min(99, qty)) } : i)); },
  remove(id){ this.save(this.items().filter(i => i.id !== id)); },
  clear(){ this.save([]); },
  count(){ return this.items().reduce((n, i) => n + i.qty, 0); },
  subtotal(){ return this.items().reduce((n, i) => n + product(i.id).price * i.qty, 0); }
};
const Wish = {
  ids(){ return store.json('bn-wish', []).filter(product); },
  has(id){ return this.ids().includes(id); },
  toggle(id){ const v = this.ids(), on = !v.includes(id); this.save(on ? [...v, id] : v.filter(x => x !== id)); return on; },
  remove(id){ this.save(this.ids().filter(x => x !== id)); },
  save(v){ store.setJSON('bn-wish', v); updateBadges(); syncWish(); document.dispatchEvent(new CustomEvent('bn:wish')); }
};
const User = {
  get(){ return store.json('bn-user', null); },
  login(name, email){ store.setJSON('bn-user', { name, email, points:2000 }); },
  logout(){ store.del('bn-user'); }
};

/* ---------- 아이콘 ---------- */
const ICONS = {
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bag:'<path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  right:'<path d="m9 18 6-6-6-6"/>', left:'<path d="m15 18-6-6 6-6"/>', down:'<path d="m6 9 6 6 6-6"/>', up:'<path d="m18 15-6-6-6 6"/>',
  minus:'<path d="M5 12h14"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  bulb:'<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  gift:'<path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>'
};
const I = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- 상품 카드 (메인 · 찜 · 검색에서 공통 사용) ---------- */
function productCard(p){
  return `
  <article class="card reveal">
    <div class="thumb">
      <a class="thumb-link" href="product.html?id=${p.id}"><img src="${p.img}" alt="${p.name} 북눅 완성 사진" loading="lazy" width="900" height="1124"></a>
      <span class="p-badges">${p.badges.map(([t, c]) => `<span class="${c}">${t}</span>`).join('')}</span>
      <button class="wish" type="button" data-wish="${p.id}" aria-pressed="${Wish.has(p.id)}" aria-label="${p.name} 찜하기">${I('heart')}</button>
      <div class="hover-acts"><a class="light" href="product.html?id=${p.id}">상세보기</a><button type="button" data-cart="${p.id}">장바구니</button></div>
    </div>
    <div class="info">
      <span class="ed">${p.edition}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a><small>${p.en}</small></h3>
      <p class="desc">${p.desc}</p>
      ${priceHTML(p)}
      <div class="meta"><span>한글설명서</span><span>LED 포함</span><span class="rv">리뷰 ${p.reviews}</span></div>
    </div>
  </article>`;
}
function priceHTML(p, qty = 1){
  return `<p class="price">${p.orig ? `<s>${won(p.orig * qty)}</s><em>${Math.round((1 - p.price / p.orig) * 100)}%</em>` : ''}<strong>${won(p.price * qty)}</strong></p>`;
}

/* ---------- 공통 화면 그리기 ---------- */
function renderChrome(){
  const page = document.body.dataset.page, pid = params.get('id'), user = User.get();
  const cur = c => c ? ' aria-current="page"' : '';
  const lnb = [
    ['전체상품', `${HOME}#pick`, false],
    ['시즌 에디션', 'product.html?id=season', page === 'product' && pid === 'season', 'hot'],
    ['할로윈 에디션', 'product.html?id=halloween', page === 'product' && pid === 'halloween'],
    ['스토리 에디션', 'product.html?id=story', page === 'product' && pid === 'story'],
    ['만드는 과정', `${HOME}#film`, false],
    ['공지사항', 'notice.html', page === 'notice']
  ];
  const loginBtn = user
    ? `<a class="icon-btn" href="${HOME}" data-action="logout" aria-label="로그아웃">${I('logout')}<span class="lbl">로그아웃</span></a>`
    : `<a class="icon-btn" href="login.html" aria-label="로그인"${cur(page === 'login')}><span class="point">+2,000P</span>${I('login')}<span class="lbl">로그인</span></a>`;

  document.body.insertAdjacentHTML('afterbegin', `
  <div class="topbar">
    <div class="wrap">
      <span class="tag">NOTICE</span>
      <div class="ticker"><ul id="ticker"></ul></div>
      <nav class="util" aria-label="바로가기">
        <a href="manual.html"${cur(page === 'manual')}>한글 설명서 다운로드</a>
        <a href="notice.html"${cur(page === 'notice')}>공지사항</a>
        <a href="${HOME}#contact">고객센터</a>
      </nav>
    </div>
  </div>
  <header class="header" id="top">
    <div class="wrap header-row">
      <button class="icon-btn menu-btn" id="openDrawer" aria-controls="drawer" aria-expanded="false" aria-label="전체 메뉴 열기">${I('menu')}<span class="lbl">메뉴</span></button>
      <a class="logo" href="${HOME}" aria-label="BookNook 홈">
        <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="4" width="22" height="32" rx="3" fill="#2B2018"/><rect x="13" y="8" width="14" height="22" fill="#F3B66B"/><path d="M13 30 18 22h4l5 8z" fill="#5A4030"/><rect x="18.5" y="15" width="3" height="8" fill="#FFF1C2"/><rect x="4" y="12" width="5" height="24" rx="1" fill="#C8963E"/><rect x="31" y="16" width="5" height="20" rx="1" fill="#E04B2F"/></svg>
        <span><b>사이</b><small>북눅</small></span>
      </a>
      <nav class="lnb" aria-label="주 메뉴"><ul>
        ${lnb.map(([t, h, on, cls]) => `<li><a href="${h}"${cls ? ` class="${cls}"` : ''}${cur(on)}>${t}</a></li>`).join('')}
      </ul></nav>
      <div class="h-right">
        <button class="icon-btn" id="searchBtn" aria-controls="searchPanel" aria-expanded="false" aria-label="검색">${I('search')}<span class="lbl">검색</span></button>
        <a class="icon-btn" href="wishlist.html" aria-label="찜한 상품"${cur(page === 'wishlist')}>${I('heart')}<span class="lbl">찜</span><span class="badge-count" data-badge="wish">0</span></a>
        <a class="icon-btn hide-sm" href="mypage.html" aria-label="마이페이지"${cur(page === 'mypage')}>${I('user')}<span class="lbl">마이페이지</span></a>
        <a class="icon-btn" href="cart.html" aria-label="장바구니"${cur(page === 'cart')}>${I('bag')}<span class="lbl">장바구니</span><span class="badge-count" data-badge="cart">0</span></a>
        <span class="sep" aria-hidden="true"></span>
        ${loginBtn}
      </div>
    </div>
    <div class="search-panel" id="searchPanel" hidden>
      <div class="wrap">
        <form class="search-form" action="search.html" method="get" role="search">
          <label class="sr-only" for="q">상품 검색</label>
          <input id="q" name="q" type="search" placeholder="크리스마스, 할로윈, 달빛 동화…" autocomplete="off" value="${esc(params.get('q') || '')}">
          <button class="btn" type="submit">검색</button>
        </form>
        <div class="chips"><span>추천 검색어</span>
          ${['크리스마스','할로윈','달빛','선물','LED'].map(k => `<a href="search.html?q=${encodeURIComponent(k)}">${k}</a>`).join('')}
        </div>
      </div>
    </div>
  </header>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" aria-hidden="true">
    <div class="drawer-head">
      <h2 id="drawerTitle">전체 메뉴</h2>
      <button class="icon-btn" id="closeDrawer" aria-label="닫기">${I('close')}</button>
    </div>
    <div class="drawer-body">
      <div class="member">${user
        ? `<p><b>${esc(user.name)}</b>님, 반가워요! 적립금 <b>${(user.points || 0).toLocaleString()}P</b></p>
           <div class="row"><a class="btn" href="mypage.html">마이페이지</a><a class="btn line" href="${HOME}" data-action="logout">로그아웃</a></div>`
        : `<p>지금 가입하면 <b>적립금 2,000P</b> 즉시 지급!</p>
           <div class="row"><a class="btn" href="login.html">로그인</a><a class="btn line" href="join.html">회원가입</a></div>`}
      </div>
      <h3>SHOP</h3>
      <ul class="menu-list">
        <li><a href="${HOME}#pick">전체상품 ${I('right')}</a></li>
        ${PRODUCTS.map(p => `<li><a href="product.html?id=${p.id}">${p.name}<em>${p.edition.split(' ')[0]}</em> ${I('right')}</a></li>`).join('')}
      </ul>
      <h3>MY</h3>
      <ul class="menu-list">
        <li><a href="wishlist.html">찜한 상품 <em data-badge-text="wish"></em> ${I('right')}</a></li>
        <li><a href="cart.html">장바구니 <em data-badge-text="cart"></em> ${I('right')}</a></li>
        <li><a href="mypage.html">마이페이지 ${I('right')}</a></li>
      </ul>
      <h3>고객지원</h3>
      <ul class="menu-list">
        <li><a href="manual.html">한글 설명서 다운로드 ${I('right')}</a></li>
        <li><a href="notice.html">공지사항 ${I('right')}</a></li>
        <li><a href="${HOME}#contact">고객센터 ${I('right')}</a></li>
      </ul>
    </div>
  </aside>`);

  document.body.insertAdjacentHTML('beforeend', `
  <footer class="footer">
    <div class="wrap">
      <nav class="links" aria-label="정책"><a href="#" data-mock="회사소개">회사소개</a><a href="#" data-mock="이용약관">이용약관</a><a href="#" data-mock="개인정보처리방침">개인정보처리방침</a><a href="#" data-mock="이용안내">이용안내</a></nav>
      <p>상호 북눅(BookNook) · 대표 ○○○ · 사업자등록번호 000-00-00000 · 통신판매업 신고 0000-서울○○-0000</p>
      <p>주소 서울시 ○○구 ○○로 00 · 대표전화 02-000-0000 · 이메일 hello@booknook.example</p>
      <p>© 2026 BookNook. All rights reserved.</p>
    </div>
  </footer>
  <div class="quick">
    <a class="kakao" href="#" data-mock="카카오톡 채널 상담" aria-label="카카오톡 상담">TALK</a>
    <button class="top" id="toTop" aria-label="맨 위로">${I('up')}</button>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`);
}

/* ---------- 배지 · 찜 버튼 동기화 ---------- */
function updateBadges(){
  const n = { cart:Cart.count(), wish:Wish.ids().length };
  $$('[data-badge]').forEach(b => { const v = n[b.dataset.badge]; b.textContent = v > 99 ? '99+' : v; b.classList.toggle('zero', !v); });
  $$('[data-badge-text]').forEach(b => b.textContent = n[b.dataset.badgeText] ? `${n[b.dataset.badgeText]}개` : '');
}
function syncWish(){ $$('[data-wish]').forEach(b => b.setAttribute('aria-pressed', Wish.has(b.dataset.wish))); }

/* ---------- 토스트 ---------- */
let toastTimer;
function toast(msg, href, label){
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${href ? `<a href="${href}">${label} →</a>` : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), href ? 3200 : 2200);
}

/* ---------- 스크롤 등장 ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin:'0px 0px -8% 0px' }) : null;
function observe(){ $$('.reveal:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in')); }

/* ---------- 공통 동작 연결 ---------- */
function initChrome(){
  updateBadges();

  // 공지 띠
  const ul = $('#ticker'), items = NOTICES.slice(0, 3);
  ul.innerHTML = [...items, items[0]].map((n, i) => `<li><a href="notice.html#n${i % items.length}">[${n.tag}] ${n.title}</a></li>`).join('');
  if (!reduceMotion){
    let k = 0;
    setInterval(() => {
      k++; ul.style.transition = 'transform .5s ease'; ul.style.transform = `translateY(-${k * 36}px)`;
      if (k === items.length) setTimeout(() => { ul.style.transition = 'none'; ul.style.transform = 'translateY(0)'; k = 0; }, 520);
    }, 3500);
  }

  // 검색 패널
  const sb = $('#searchBtn'), sp = $('#searchPanel');
  sb.onclick = () => { const open = sp.hidden; sp.hidden = !open; sb.setAttribute('aria-expanded', open); if (open) $('#q').focus(); };
  $('.search-form').addEventListener('submit', e => { if (!$('#q').value.trim()){ e.preventDefault(); toast('검색어를 입력해 주세요'); } });

  // 전체 메뉴 Drawer (주 메뉴가 숨는 1180px 이하 화면에서만 버튼이 보임)
  const d = $('#drawer'), openBtn = $('#openDrawer');
  const isOpen = () => document.body.classList.contains('drawer-open');
  const open = () => { document.body.classList.add('drawer-open','lock'); d.setAttribute('aria-hidden','false'); openBtn.setAttribute('aria-expanded','true'); setTimeout(() => $('#closeDrawer').focus(), 50); };
  const close = () => { document.body.classList.remove('drawer-open','lock'); d.setAttribute('aria-hidden','true'); openBtn.setAttribute('aria-expanded','false'); };
  openBtn.onclick = open;
  $('#closeDrawer').onclick = () => { close(); openBtn.focus(); };
  $('#scrim').onclick = close;
  $$('.menu-list a', d).forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape'){ close(); openBtn.focus(); }
    if (e.key === 'Tab'){
      const f = $$('a,button,input', d).filter(el => el.offsetParent !== null);
      if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
    }
  });

  // 맨 위로
  const t = $('#toTop');
  addEventListener('scroll', () => t.classList.toggle('show', scrollY > 600), { passive:true });
  t.onclick = () => scrollTo({ top:0 });

  // 클릭 동작: 찜 · 장바구니 · 바로구매 · 로그아웃 · 준비 중 링크
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-wish],[data-cart],[data-buy],[data-action="logout"],[data-mock]');
    if (!el) return;
    e.preventDefault();
    if (el.dataset.mock) return toast(`'${el.dataset.mock}' 페이지는 준비 중이에요`);
    if (el.dataset.action === 'logout'){ User.logout(); toast('로그아웃했어요'); return setTimeout(() => location.href = HOME, 700); }
    if (el.dataset.wish){
      const on = Wish.toggle(el.dataset.wish);
      return on ? toast('찜 목록에 담았어요', 'wishlist.html', '찜 목록 보기') : toast('찜을 해제했어요');
    }
    const id = el.dataset.cart || el.dataset.buy, qty = +(el.dataset.qty || 1);
    Cart.add(id, qty);
    if (el.dataset.buy) return location.href = 'cart.html';
    toast(`'${product(id).name}' ${qty > 1 ? qty + '개를' : '을(를)'} 장바구니에 담았어요`, 'cart.html', '장바구니 보기');
  });

  // 다른 탭에서 바뀐 장바구니 · 찜 반영
  addEventListener('storage', () => { updateBadges(); syncWish(); });
}

renderChrome();
initChrome();
