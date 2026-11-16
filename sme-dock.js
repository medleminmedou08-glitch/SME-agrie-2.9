(function() {
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const POS_KEY = 'sme_dock_pos';
  const SIZE = 54;

  const createProDock = () => {
    if (document.getElementById('smeMasterDockBtn')) return;

    // ---------- الزر العائم: دائري، يُسحب بحرية، يلتصق بحافة الشاشة ----------
    const btn = document.createElement('button');
    btn.id = 'smeMasterDockBtn';
    btn.setAttribute('aria-label', 'أدوات SME Pro');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>';
    btn.style.cssText = `position:fixed; z-index:999998; width:${SIZE}px; height:${SIZE}px; border-radius:50%; border:2px solid rgba(251,191,36,.95);
      background:linear-gradient(145deg, #166534 0%, #14532d 55%, #0f3d22 100%); color:#fff; display:flex; align-items:center; justify-content:center;
      box-shadow:0 6px 18px rgba(0,0,0,.4); cursor:grab; padding:0; touch-action:none; user-select:none; -webkit-user-select:none;
      transition:opacity .3s, transform .15s; opacity:.92; font-family:inherit;`;
    document.documentElement.appendChild(btn);

    const menu = document.createElement('div');
    menu.id = 'smeMasterMenu';
    menu.style.cssText = 'display:none; position:fixed; z-index:999999; background:#fff; border-radius:18px; padding:10px; width:236px; max-width:calc(100vw - 20px); box-shadow:0 18px 40px rgba(0,0,0,.4); direction:rtl; font-family:inherit; border:1px solid #e2e8f0; color:#1e293b;';
    const svg = (d, c) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const ICON = {
      map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
      fert: '<path d="M9 3h6"/><path d="M10 3v6l-5.4 9.3A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.7L14 9V3"/><path d="M7.5 15h9"/>',
      inv: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
      pro: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
      ai: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
      att: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
      sched: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/>',
      bak: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>'
    };
    const items = [
      ['map', 'الخريطة وشبكة الري', '#2563eb', '#eff6ff'],
      ['fert', 'الأسمدة وحاسبة الجرعات', '#059669', '#ecfdf5'],
      ['sched', 'جدول التسميد والتنبيهات', '#0d9488', '#f0fdfa'],
      ['inv', 'الفوترة', '#d97706', '#fffbeb'],
      ['pro', 'الإدارة الذكية', '#334155', '#f1f5f9'],
      ['ai', 'المستشار الذكي', '#7c3aed', '#f5f3ff'],
      ['att', 'تسجيل الحضور', '#db2777', '#fdf2f8'],
      ['bak', 'نسخة احتياطية', '#475569', '#f8fafc']
    ];
    menu.style.cssText = 'display:none; position:fixed; z-index:999999; background:rgba(255,255,255,.96); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border-radius:22px; padding:12px; width:250px; max-width:calc(100vw - 20px); box-shadow:0 20px 50px rgba(15,23,42,.35); direction:rtl; font-family:inherit; border:1px solid rgba(226,232,240,.9); color:#0f172a;';
    menu.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; padding:2px 4px 10px;">
        <span style="font-weight:700; font-size:13px; letter-spacing:.2px; color:#14532d;">أدوات SME Pro</span>
        <span id="closeMasterMenu" style="cursor:pointer; color:#94a3b8; width:24px; height:24px; display:grid; place-items:center; border-radius:50%; font-size:14px;">✕</span></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${items.map(i => `
        <button data-k="${i[0]}" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:12px 6px 10px; font-size:11.5px; font-weight:600; color:#1e293b; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:8px; font-family:inherit; line-height:1.35; box-shadow:0 1px 2px rgba(15,23,42,.05); ${i[0] === 'bak' ? 'grid-column:1/-1; flex-direction:row; justify-content:center; padding:10px;' : ''}">
          <span style="width:42px; height:42px; border-radius:14px; background:${i[3]}; display:grid; place-items:center; flex:none;">${svg(ICON[i[0]], i[2])}</span>
          <span>${i[1]}</span></button>`).join('')}</div>
      <div style="font-size:10.5px; color:#94a3b8; text-align:center; margin-top:10px;">اسحب الزر لتغيير مكانه</div>`;
    document.documentElement.appendChild(menu);

    // ---------- الموضع ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const vw = () => window.innerWidth, vh = () => window.innerHeight;
    let pos = null;
    try { pos = JSON.parse(lsGet(POS_KEY, 'null')); } catch (e) {}
    if (!pos || typeof pos.x !== 'number') pos = { x: vw() - SIZE - 10, y: Math.round(vh() * 0.62) };
    const place = (x, y) => { pos = { x: clamp(x, 6, vw() - SIZE - 6), y: clamp(y, 6, vh() - SIZE - 6) }; btn.style.left = pos.x + 'px'; btn.style.top = pos.y + 'px'; };
    place(pos.x, pos.y);
    window.addEventListener('resize', () => { place(pos.x, pos.y); if (menu.style.display === 'block') placeMenu(); });

    const placeMenu = () => {
      const mw = menu.offsetWidth || 236, mh = menu.offsetHeight || 240;
      let top = pos.y + SIZE + 8; if (top + mh > vh() - 8) top = pos.y - mh - 8;
      top = clamp(top, 8, vh() - mh - 8);
      const left = clamp(pos.x + SIZE / 2 - mw / 2, 8, vw() - mw - 8);
      menu.style.top = top + 'px'; menu.style.left = left + 'px';
    };
    const openMenu = () => { menu.style.display = 'block'; placeMenu(); btn.style.opacity = '1'; };
    const closeMenu = () => { menu.style.display = 'none'; fade(); };

    // يصبح شبه شفاف عند عدم الاستخدام حتى لا يحجب الواجهة
    let fadeT = null;
    const fade = () => { clearTimeout(fadeT); btn.style.opacity = '.92'; fadeT = setTimeout(() => { if (menu.style.display !== 'block') btn.style.opacity = '.4'; }, 3500); };
    fade();

    // ---------- السحب (لمس وفأرة) ----------
    let drag = null;
    btn.addEventListener('pointerdown', (e) => {
      drag = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      btn.style.cursor = 'grabbing'; btn.style.transition = 'opacity .3s'; btn.style.opacity = '1';
    });
    btn.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; menu.style.display = 'none'; }
      if (drag.moved) place(drag.ox + dx, drag.oy + dy);
    });
    const endDrag = () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      btn.style.cursor = 'grab'; btn.style.transition = 'opacity .3s, transform .15s, left .2s, top .2s';
      if (moved) { // يلتصق بأقرب حافة أفقية
        const toRight = pos.x + SIZE / 2 > vw() / 2;
        place(toRight ? vw() - SIZE - 8 : 8, pos.y);
        lsSet(POS_KEY, JSON.stringify(pos)); fade();
      } else { menu.style.display === 'block' ? closeMenu() : openMenu(); }
    };
    btn.addEventListener('pointerup', endDrag);
    btn.addEventListener('pointercancel', () => { drag = null; });
    document.getElementById('closeMasterMenu').onclick = closeMenu;
    document.addEventListener('pointerdown', (e) => { if (menu.style.display === 'block' && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu(); }, true);

    // ---------- تشغيل الوحدات ----------
    const clickByText = (keywords) => {
      const target = Array.from(document.querySelectorAll('button')).find(b =>
        b !== btn && !menu.contains(b) && keywords.some(k => b.innerText && b.innerText.includes(k)));
      if (target) { target.click(); return true; }
      alert('⚠️ هذه الوحدة غير محمّلة بعد، أعد المحاولة بعد لحظات.');
      return false;
    };
    const actions = {
      map: () => { if (typeof go === 'function') go('map'); },
      fert: () => {
        // الزر العائم الأصلي لوحدة الأسمدة (بالمعرّف، ثم بالنص بين الأزرار الثابتة فقط)
        let b = document.getElementById('smeFertBtn');
        if (!b) b = Array.from(document.querySelectorAll('button')).find(x => x !== btn && !menu.contains(x) && getComputedStyle(x).position === 'fixed' && /الأسمدة|التسميد|Engrais/.test(x.innerText || ''));
        if (b) b.click(); else alert('⚠️ وحدة الأسمدة غير موجودة في الملفات. ارفع الملف fertilizer-pro.js إلى المستودع.');
      },
      sched: () => { if (window.smeOpenSchedule) window.smeOpenSchedule(); else alert('⚠️ ارفع الملف fert-schedule.js إلى المستودع.'); },
      inv: () => { const b = document.getElementById('smeInvBtn'); if (b) b.click(); else clickByText(['الفوترة', 'Facturation']); },
      pro: () => { const b = document.getElementById('smeProBtn'); if (b) b.click(); else clickByText(['الإدارة الذكية']); },
      ai: () => { const b = document.getElementById('smeAiBtn'); if (b) b.click(); else clickByText(['المساعد الذكي']); },
      att: () => { if (typeof go === 'function') { go('daily'); } },
      bak: () => { if (typeof go === 'function') go('settings'); }
    };
    menu.querySelectorAll('[data-k]').forEach(b => {
      b.onclick = () => {
        closeMenu();
        try { actions[b.dataset.k](); } catch (e) { alert('تعذر فتح الوحدة'); }
        setTimeout(() => { // رفع نوافذ الوحدات فوق الزر
          document.querySelectorAll('body > div').forEach(d => { if (d.style && d.style.position === 'fixed' && d.style.display !== 'none' && d !== menu && d.style.zIndex && +d.style.zIndex < 1000001 && +d.style.zIndex >= 9999) d.style.zIndex = '1000001'; });
        }, 150);
      };
    });

    // إخفاء الأزرار العائمة الفردية للوحدات (الوصول عبر هذا الزر فقط)
    const hideSingles = () => {
      ['smeInvBtn', 'smeProBtn', 'smeAiBtn', 'smeFertBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.position === 'fixed') { el.style.opacity = '0'; el.style.pointerEvents = 'none'; el.style.width = '1px'; el.style.height = '1px'; el.style.overflow = 'hidden'; el.style.padding = '0'; el.style.border = '0'; }
      });
    };
    hideSingles(); setInterval(hideSingles, 1500);
  };

  const boot = () => setTimeout(createProDock, 600);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
