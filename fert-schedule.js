/* جدول التسميد بالتنقيط حسب تاريخ الزراعة + تنبيهات (SME Agri)
   المصدر: الدليل الشامل لبرامج التسميد بالتنقيط (للهكتار) — الأسمدة المتوفرة لدى المزرعة */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const J = (k, d) => { try { return JSON.parse(lsGet(k, '')) || d; } catch (e) { return d; } };
  const DAYN = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // ---------- المنتجات ----------
  const MAP = 'ماب MAP 12-61-0', AS = 'سلفات الأمونيوم 21%', AN = 'نترات الأمونيوم 33.5%', CN = 'نترات الكالسيوم',
    KN = 'نترات البوتاسيوم 13-0-46', SP = 'سلفات البوتاسيوم 0-0-51', FO = 'فورتال المعلق 10-10-60', AC = 'حمض الكبريتيك 98%';
  const MATCH = [[/map|ماب/i, MAP], [/كالسيوم/, CN], [/نترات.*بوتاسيوم|13-0-46/, KN], [/سلفات.*بوتاسيوم|0-0-5/, SP], [/فورتال|10-10-60/, FO], [/كبريتيك|منظم/, AC], [/نترات.*(أمونيوم|امونيوم)|33/, AN], [/(كبريتات|سلفات).*(أمونيوم|امونيوم)|21%/, AS]];
  const I = (p, lo, hi, u, alt) => ({ p, lo, hi: hi || lo, u: u || 'كغ', alt: alt || '' });

  // أيام الرية الثلاثة: [اليوم 1، اليوم 2، اليوم 3] = (السبت، الإثنين، الأربعاء) افتراضياً
  // المراحل: from/to = أيام بعد الزراعة (أيام المراحل المحددة في الدليل أو تقديرية — معلّمة est)
  const PROG = {
    tomato: { ar: 'الطماطم', re: /طماطم|بندورة|tomate|tomato/i, stages: [
      { n: 'النمو الخضري', from: 15, to: 30, d: [[I(MAP, 2, 2.5), I(AS, 3.5, 3.5, 'كغ', 'أو 2 كغ نترات الأمونيوم')], [I(CN, 3)], [I(AS, 3), I(AC, 1, 1.5, 'لتر')]] },
      { n: 'التزهير وعقد الثمار', from: 31, to: 55, est: 1, d: [[I(MAP, 2), I(KN, 3)], [I(CN, 3.5, 4)], [I(KN, 3), I(AS, 2)]] },
      { n: 'تحجيم ونضج الثمار', from: 56, to: 110, est: 1, d: [[I(SP, 4, 5)], [I(FO, 3), I(AN, 1.5)], [I(SP, 3.5, 3.5, 'كغ', 'يُستبدل بـ 2.5 كغ نترات الكالسيوم كل أسبوعين')]] }] },
    watermelon: { ar: 'البطيخ', re: /بطيخ|pastèque|pasteque|watermelon/i, stages: [
      { n: 'النمو الخضري وتكوين العرش', from: 1, to: 25, est: 1, d: [[I(MAP, 2.5), I(AS, 4)], [I(CN, 3)], [I(AS, 3), I(AC, 1, 1, 'لتر')]] },
      { n: 'التزهير والعقد', from: 26, to: 40, est: 1, d: [[I(MAP, 2), I(KN, 3.5)], [I(CN, 3.5)], [I(KN, 3), I(AN, 2)]] },
      { n: 'التحجيم وزيادة السكريات', from: 41, to: 80, est: 1, d: [[I(SP, 5)], [I(FO, 3.5, 4)], [I(SP, 4, 4, 'كغ', 'أوقف الأسمدة النيتروجينية في آخر أسبوعين قبل الجني')]] }] },
    melon: { ar: 'الشمام', re: /شمام|melon|cantaloup/i, stages: [
      { n: 'النمو الخضري', from: 1, to: 21, d: [[I(MAP, 2), I(AS, 3.5)], [I(CN, 3)], [I(AN, 2.5), I(AC, 1, 1, 'لتر')]] },
      { n: 'التزهير وعقد الثمار', from: 22, to: 36, est: 1, d: [[I(MAP, 2), I(KN, 3)], [I(CN, 4)], [I(KN, 3), I(AS, 1.5)]] },
      { n: 'التحجيم وتكوين الشبكة والسكريات', from: 37, to: 75, est: 1, d: [[I(SP, 4.5)], [I(FO, 3)], [I(SP, 3.5, 3.5, 'كغ', 'أضف 2.5 كغ نترات الكالسيوم بالتناوب كل 10 أيام')]] }] },
    pumpkin: { ar: 'القرع العسلي', re: /قرع|يقطين|courge|pumpkin|potiron/i, stages: [
      { n: 'النمو الخضري وامتداد المدادات', from: 1, to: 28, est: 1, d: [[I(MAP, 2.5), I(AS, 4.5)], [I(CN, 3)], [I(AN, 3), I(AC, 1.5, 1.5, 'لتر')]] },
      { n: 'التزهير وعقد الثمار', from: 29, to: 45, est: 1, d: [[I(MAP, 2.5), I(KN, 3.5)], [I(CN, 3.5)], [I(KN, 3.5), I(AS, 2)]] },
      { n: 'التحجيم وامتلاء الثمار', from: 46, to: 95, est: 1, d: [[I(SP, 5)], [I(FO, 3.5), I(AN, 1.5)], [I(SP, 4)]] }] },
    onion: { ar: 'البصل', re: /بصل|oignon|onion/i, stages: [
      { n: 'النمو الخضري وتكوين الأوراق', from: 1, to: 45, est: 1, d: [[I(MAP, 2.5), I(AS, 4.5)], [I(CN, 2.5)], [I(AS, 4), I(AC, 1, 1, 'لتر')]] },
      { n: 'تكوين وبداية انتفاخ الأبصال', from: 46, to: 90, est: 1, d: [[I(KN, 3), I(AS, 2)], [I(CN, 2.5)], [I(SP, 3.5)]] },
      { n: 'الامتلاء والنضج', from: 91, to: 140, est: 1, d: [[I(SP, 4)], [I(FO, 2.5, 3)], [I(SP, 3.5, 3.5, 'كغ', 'أوقف النيتروجين قبل الحصاد بـ 3–4 أسابيع')]] }] },
    carrot: { ar: 'الجزر', re: /جزر|carotte|carrot/i, stages: [
      { n: 'النمو الخضري وتكوين الجذر الوتدي', from: 1, to: 40, est: 1, d: [[I(MAP, 3), I(AS, 3.5)], [I(CN, 2.5)], [I(AS, 3), I(AC, 1, 1, 'لتر')]] },
      { n: 'تغليظ وتحجيم الجذور', from: 41, to: 100, est: 1, d: [[I(SP, 4)], [I(FO, 3)], [I(KN, 3, 3, 'كغ', 'يُستبدل كل أسبوعين بـ 3 كغ نترات الكالسيوم لمنع تشقق الجذور')]] }] }
  };
  const cropKey = (txt) => { const t = String(txt || ''); for (const k in PROG) if (PROG[k].re.test(t)) return k; return null; };

  // ---------- أدوات ----------
  const ymd = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const wday = (s) => new Date(s + 'T12:00:00').getDay();
  const st = () => (typeof S !== 'undefined' ? S : { fields: [] });
  const areaHa = (f) => { const M = { 'هكتار': 10000, 'فدان': 4200, 'دونم': 1000, 'م²': 1 }; return (parseFloat(f.area) || 0) * (M[st().areaUnit] || 10000) / 10000; };
  const irrDays = () => { const d = J('sme_fs_days', [6, 1, 3]); return d.length === 3 ? d : [6, 1, 3]; };
  const fmt = (n) => (Math.round(n * 100) / 100).toString();

  // الجرعات المطلوبة لحقل في تاريخ معيّن (أو null)
  const dueOn = (f, date) => {
    const k = cropKey(f.crop); if (!k || !f.plant) return null;
    const slot = irrDays().indexOf(wday(date)); if (slot < 0) return null;
    const d = diffDays(f.plant, date); if (d < 0) return null;
    const stg = PROG[k].stages.find(s => d >= s.from && d <= s.to); if (!stg) return null;
    return { k, d, stg, slot, items: stg.d[slot] || [] };
  };
  const doneMap = () => J('sme_fs_done', {});
  const isDone = (f, date) => !!doneMap()[f.id + '|' + date];

  // ---------- المخزون ----------
  const ensureStock = () => {
    if (lsGet('sme_fs_stock_v1')) return;
    const stock = J('sme_fert_stock', []);
    if (stock.length && !stock.some(x => /فورتال/.test(x.name))) {
      stock.push({ id: stock.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1, name: FO, qty: 0, price: 0, min: 0 });
      lsSet('sme_fert_stock', JSON.stringify(stock));
    }
    lsSet('sme_fs_stock_v1', '1');
  };
  const deduct = (items, ha, fname) => {
    const stock = J('sme_fert_stock', []), logs = J('sme_fert_logs', []), out = [];
    items.forEach(it => {
      const amt = it.lo * ha; if (!(amt > 0)) return;
      const m = MATCH.find(x => x[1] === it.p)[0];
      const row = stock.find(x => m.test(String(x.name)) && (+x.qty || 0) > 0) || stock.find(x => m.test(String(x.name)));
      if (!row) { out.push(it.p + ': غير موجود بالمخزون'); return; }
      const before = +row.qty || 0; row.qty = Math.max(0, Math.round((before - amt) * 100) / 100);
      logs.push({ date: ymd(new Date()), name: row.name, qty: Math.round(amt * 100) / 100, field: fname });
      out.push(row.name + ': −' + fmt(amt));
    });
    lsSet('sme_fert_stock', JSON.stringify(stock)); lsSet('sme_fert_logs', JSON.stringify(logs));
    return out;
  };

  // ---------- النافذة ----------
  let modal = null;
  const itemsHtml = (items, ha) => items.map(it => {
    const lo = it.lo * ha, hi = it.hi * ha, q = lo === hi ? fmt(lo) : fmt(lo) + '–' + fmt(hi);
    return `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;padding:3px 0;border-bottom:1px dashed #d1fae5;"><span>• ${esc(it.p)}${it.alt ? `<br><small style="color:#92400e;">${esc(it.alt)}</small>` : ''}</span><strong style="white-space:nowrap;">${q} ${it.u}</strong></div>`;
  }).join('');

  const render = () => {
    if (!modal) return;
    const T = ymd(new Date()), fields = st().fields || [], days = irrDays();
    let h = `<div style="background:#fff;border-radius:16px;max-width:560px;margin:10px auto;padding:16px;color:#1e293b;box-shadow:0 15px 35px rgba(0,0,0,.4);">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #065f46;padding-bottom:9px;margin-bottom:10px;">
        <div><h3 style="margin:0;color:#065f46;font-size:17px;">📅 جدول التسميد حسب تاريخ الزراعة</h3><span style="font-size:11px;color:#64748b;">الكميات للهكتار من الدليل، مضروبة في مساحة كل حقل</span></div>
        <button id="fsClose" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:5px 11px;font-weight:bold;cursor:pointer;">✕</button></div>
      <details style="margin-bottom:10px;font-size:12px;"><summary style="cursor:pointer;font-weight:bold;color:#065f46;">⚙️ أيام الري والتنبيه</summary>
        <div style="margin-top:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">${[0, 1, 2].map(i => `<label>رية ${i + 1}<select class="fsDay" data-i="${i}" style="width:100%;padding:6px;border:1px solid #cbd5e1;border-radius:6px;">${DAYN.map((n, d) => `<option value="${d}" ${days[i] === d ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
        <div style="margin-top:8px;">ساعة التنبيه: <select id="fsHour" style="padding:6px;border:1px solid #cbd5e1;border-radius:6px;">${[5, 6, 7, 8, 9, 16, 17, 18].map(x => `<option value="${x}" ${+lsGet('sme_fs_hour', '7') === x ? 'selected' : ''}>${x}:00</option>`).join('')}</select>
        <button id="fsNotif" style="margin-inline-start:6px;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:7px 10px;font-weight:bold;cursor:pointer;">🔔 تفعيل التنبيهات</button></div>
        <div style="color:#64748b;margin-top:6px;line-height:1.6;">الرية 1 = السبت، 2 = الإثنين، 3 = الأربعاء (ترتيب الدليل). الكالسيوم يُعطى منفرداً دائماً في الرية 2.</div></details>`;
    let n = 0;
    fields.forEach(f => {
      const k = cropKey(f.crop); if (!k) return; n++;
      const ha = areaHa(f);
      h += `<div style="border:1px solid #a7f3d0;border-radius:12px;padding:10px;margin-bottom:10px;background:#f0fdf4;">
        <div style="font-weight:bold;color:#065f46;">🌱 ${esc(f.name)} — ${PROG[k].ar} <span style="font-weight:normal;font-size:11px;color:#475569;">(${fmt(ha)} هكتار)</span></div>`;
      if (!f.plant) { h += `<div style="font-size:12px;color:#b45309;margin-top:6px;">⚠️ حدد تاريخ الزراعة لهذا الحقل (من صفحة الحقول) ليبدأ الجدول.</div></div>`; return; }
      if (!(ha > 0)) h += `<div style="font-size:12px;color:#b45309;">⚠️ المساحة غير مدخلة: الكميات معروضة لهكتار واحد.</div>`;
      const H = ha > 0 ? ha : 1, d0 = diffDays(f.plant, T), P = PROG[k];
      const cur = P.stages.find(s => d0 >= s.from && d0 <= s.to), last = P.stages[P.stages.length - 1];
      h += `<div style="font-size:12px;color:#475569;margin:3px 0 6px;">زُرع في ${esc(f.plant)} • اليوم ${d0 < 0 ? 'قبل الزراعة بـ ' + (-d0) : d0} • ${cur ? 'المرحلة: <b>' + cur.n + '</b>' + (cur.est ? ' <small>(مدة المرحلة تقديرية)</small>' : '') : (d0 < P.stages[0].from ? 'الدليل يبدأ من اليوم ' + P.stages[0].from + ' بعد الزراعة' : d0 > last.to ? 'انتهى برنامج الدليل' : '')}</div>`;
      const td = dueOn(f, T);
      if (td) {
        const dn = isDone(f, T);
        h += `<div style="background:${dn ? '#e2e8f0' : '#fff'};border:2px solid ${dn ? '#94a3b8' : '#059669'};border-radius:10px;padding:8px;margin-bottom:6px;">
          <div style="font-weight:bold;font-size:13px;color:${dn ? '#64748b' : '#047857'};">${dn ? '✅ تم تنفيذ تسميد اليوم' : '🔔 اليوم موعد التسميد (الرية ' + (td.slot + 1) + ')'}</div>${itemsHtml(td.items, H)}
          ${dn ? '' : `<button class="fsDone" data-f="${esc(f.id)}" style="margin-top:8px;width:100%;background:#059669;color:#fff;border:none;border-radius:8px;padding:8px;font-weight:bold;cursor:pointer;">تم ✓ (وخصمه من المخزون)</button>`}</div>`;
      } else h += `<div style="font-size:12px;color:#64748b;margin-bottom:6px;">لا تسميد مقرر اليوم.</div>`;
      let up = '';
      for (let i = 1; i <= 10; i++) {
        const D = addDays(T, i), x = dueOn(f, D); if (!x) continue;
        up += `<details style="font-size:12px;margin:3px 0;"><summary style="cursor:pointer;">${DAYN[wday(D)]} ${D.slice(5)} — رية ${x.slot + 1} (يوم ${x.d})</summary>${itemsHtml(x.items, H)}</details>`;
      }
      h += up ? `<div style="font-weight:bold;font-size:12px;margin-top:4px;">القادم (10 أيام):</div>${up}` : '';
      h += '</div>';
    });
    if (!n) h += `<div style="text-align:center;color:#64748b;padding:20px;font-size:13px;">لا توجد حقول بمحصول من: ${Object.values(PROG).map(p => p.ar).join('، ')}.<br>أنشئ حقلاً باسم المحصول وتاريخ الزراعة.</div>`;
    h += `<div style="font-size:11px;color:#64748b;line-height:1.7;background:#f8fafc;border-radius:8px;padding:8px;">⚠️ نترات الكالسيوم لا تُخلط مع الماب أو سلفات البوتاسيوم أو الحمض أو فورتال. بعد كل تسميد اغسل الشبكة بماء صافٍ 15–20 دقيقة. المبيد الفطري Cuivreval 20 WG رشاً ورقياً 2.5–3 غ/لتر وليس مع ماء الري. حدود المراحل المعلّمة «تقديرية» ليست في الدليل الأصلي، فعدّلها حسب ملاحظتك للنبات.</div></div>`;
    modal.innerHTML = h;
    modal.querySelector('#fsClose').onclick = () => { modal.style.display = 'none'; };
    modal.querySelectorAll('.fsDay').forEach(sel => sel.onchange = () => {
      const a = [...modal.querySelectorAll('.fsDay')].map(x => +x.value);
      if (new Set(a).size !== 3) { alert('اختر 3 أيام مختلفة'); render(); return; }
      lsSet('sme_fs_days', JSON.stringify(a)); render(); scheduleNative(); check();
    });
    modal.querySelector('#fsHour').onchange = (e) => { lsSet('sme_fs_hour', e.target.value); scheduleNative(); };
    modal.querySelector('#fsNotif').onclick = enableNotifs;
    modal.querySelectorAll('.fsDone').forEach(b => b.onclick = () => {
      const f = (st().fields || []).find(x => String(x.id) === b.dataset.f); if (!f) return;
      const x = dueOn(f, T); if (!x) return;
      const res = deduct(x.items, areaHa(f) > 0 ? areaHa(f) : 1, f.name);
      const dm = doneMap(); dm[f.id + '|' + T] = 1; lsSet('sme_fs_done', JSON.stringify(dm));
      if (typeof toast === 'function') toast('تم التسجيل ✓ ' + res.join(' • ')); else alert(res.join('\n'));
      render(); check(); scheduleNative();
    });
  };

  // ---------- التنبيهات ----------
  const nativeLN = () => { try { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications; } catch (e) { return null; } };
  const dueList = (date) => (st().fields || []).map(f => { const x = dueOn(f, date); return x && !isDone(f, date) ? { f, x } : null; }).filter(Boolean);
  const textFor = (e) => `${e.f.name} (${PROG[e.x.k].ar}): ` + e.x.items.map(it => { const a = it.lo * (areaHa(e.f) || 1); return fmt(a) + ' ' + it.u + ' ' + it.p; }).join(' + ');

  const scheduleNative = async () => {
    const LN = nativeLN(); if (!LN || lsGet('sme_fs_notif') !== '1') return;
    try {
      const pend = await LN.getPending(); if (pend && pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.filter(n => n.id >= 7000 && n.id < 8000).map(n => ({ id: n.id })) });
      const hour = +lsGet('sme_fs_hour', '7'), now = new Date(), list = []; let id = 7000;
      for (let i = 0; i <= 14; i++) {
        const D = addDays(ymd(now), i), at = new Date(D + 'T' + String(hour).padStart(2, '0') + ':00:00');
        if (at <= now) continue;
        const due = dueList(D); if (!due.length) continue;
        list.push({ id: id++, title: '🌱 موعد التسميد اليوم', body: due.map(textFor).join('\n').slice(0, 400), schedule: { at, allowWhileIdle: true } });
        if (id >= 8000) break;
      }
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn('schedule', e); }
  };
  const enableNotifs = async () => {
    lsSet('sme_fs_notif', '1');
    const LN = nativeLN();
    try {
      if (LN) { const r = await LN.requestPermissions(); if (r.display !== 'granted') { alert('لم يُسمح بالإشعارات. فعّلها من إعدادات الهاتف > التطبيقات > SME Agri > الإشعارات.'); return; } await scheduleNative(); alert('تم تفعيل التنبيهات اليومية في الساعة ' + lsGet('sme_fs_hour', '7') + ':00 ✓'); }
      else if ('Notification' in window) { const r = await Notification.requestPermission(); alert(r === 'granted' ? 'تم تفعيل تنبيهات المتصفح (تظهر عند فتح التطبيق). في تطبيق الأندرويد تعمل التنبيهات اليومية تلقائياً بعد تثبيت النسخة الجديدة.' : 'لم يُسمح بالإشعارات'); }
      else alert('الإشعارات غير مدعومة هنا. سيظهر شريط التذكير داخل التطبيق.');
    } catch (e) { alert('تعذر تفعيل الإشعارات'); }
  };

  let banner = null, notifiedKey = '';
  const check = () => {
    const T = ymd(new Date()), due = dueList(T);
    if (!banner) {
      banner = document.createElement('div'); banner.id = 'smeFsBanner';
      banner.style.cssText = 'display:none;position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:999990;max-width:92vw;background:#047857;color:#fff;border-radius:14px;padding:9px 14px;font-size:12.5px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer;direction:rtl;text-align:center;';
      banner.onclick = () => open(); document.documentElement.appendChild(banner);
    }
    if (!due.length) { banner.style.display = 'none'; return; }
    banner.innerHTML = '🌱 موعد تسميد اليوم: ' + due.map(e => esc(e.f.name)).join('، ') + ' — اضغط للتفاصيل';
    banner.style.display = 'block';
    const key = T + '|' + due.map(e => e.f.id).join(',');
    if (lsGet('sme_fs_notif') === '1' && !nativeLN() && 'Notification' in window && Notification.permission === 'granted' && notifiedKey !== key) {
      notifiedKey = key; try { new Notification('🌱 موعد التسميد اليوم', { body: due.map(textFor).join('\n') }); } catch (e) {}
    }
  };

  const open = () => {
    if (!modal) { modal = document.createElement('div'); modal.id = 'smeFsModal'; modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:1000002;overflow-y:auto;padding:14px;direction:rtl;'; document.documentElement.appendChild(modal); }
    render(); modal.style.display = 'block';
  };
  window.smeOpenSchedule = open;
  window.smeFertSchedule = { PROG, dueOn, cropKey, areaHa };

  const boot = () => { ensureStock(); setTimeout(() => { check(); scheduleNative(); }, 1500); setInterval(check, 5 * 60 * 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) { check(); scheduleNative(); } }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
