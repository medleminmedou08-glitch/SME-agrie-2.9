/* جدول التسميد العلمي بالتنقيط حسب تاريخ الزراعة + تنبيهات (SME Agri)
   المصدر: منظمة الأغذية والزراعة (FAO) - برامج التسميد بالتنقيط (كجم/هكتار للرية الواحدة) */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const J = (k, d) => { try { const v = lsGet(k, ''); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const DAYN = 'الأحد,الإثنين,الثلاثاء,الأربعاء,الخميس,الجمعة,السبت'.split(',');

  // ---------- الأسمدة القياسية المعتمدة ----------
  const MAP = 'ماب MAP 12-61-0',
        AS  = 'سلفات الأمونيوم 21%',
        AN  = 'نترات الأمونيوم 33.5%',
        CN  = 'نترات الكالسيوم',
        KN  = 'نترات البوتاسيوم 13-0-46',
        SP  = 'سلفات البوتاسيوم 0-0-50',
        MG  = 'سلفات المغنيسيوم',
        AC  = 'حمض الفوسفوريك / الكبريتيك';

  const MATCH = new Array(
    new Array(/map|ماب/i, MAP),
    new Array(/كالسيوم/, CN),
    new Array(/نترات.*بوتاسيوم|13-0-46/, KN),
    new Array(/سلفات.*بوتاسيوم|0-0-5/, SP),
    new Array(/مغنيسيوم|mgo/i, MG),
    new Array(/فوسفوريك|كبريتيك|منظم/i, AC),
    new Array(/نترات.*(أمونيوم|امونيوم)|33/, AN),
    new Array(/(كبريتات|سلفات).*(أمونيوم|امونيوم)|21%/, AS)
  );

  const I = (p, lo, hi, u, alt) => ({ p, lo, hi: hi || lo, u: u || 'كغ', alt: alt || '' });
  const R = (...items) => items; // صف رية واحدة
  const D = (r1, r2, r3) => new Array(r1, r2, r3); // 3 ريات في الأسبوع

  // برامج التسميد بالتنقيط للهكتار (الرية 1 و 3 لخزان B، والرية 2 لخزان A نترات الكالسيوم منفردة)
  const PROG = {
    tomato: {
      ar: 'الطماطم',
      re: /طماطم|بندورة|tomate|tomato/i,
      stages: new Array(
        {
          n: '1. التأسيس وتجذير الشتلات', from: 1, to: 15,
          d: D(
            R(I(MAP, 10, 12), I(AS, 6)),
            R(I(CN, 6, 8, 'كغ', 'يُحقن منفرداً لتنشيط الشعيرات الجذرية')),
            R(I(MAP, 10, 12), I(AC, 1.5, 2, 'لتر', 'لضبط حموضة ماء الري (pH 6.0)'))
          )
        },
        {
          n: '2. النمو الخضري وتكوين المجموع الورقي', from: 16, to: 35,
          d: D(
            R(I(AS, 12, 15, 'كغ', 'أو 8 كغ نترات أمونيوم في التربة الطينية'), I(MAP, 5)),
            R(I(CN, 10, 12), I(KN, 5)),
            R(I(AS, 12, 15), I(MG, 5))
          )
        },
        {
          n: '3. التزهير وعقد الثمار', from: 36, to: 60,
          d: D(
            R(I(MAP, 6, 8), I(KN, 12, 15)),
            R(I(CN, 12, 15, 'كغ', 'ضروري لمنع عفن الطرف الزهري')),
            R(I(KN, 12, 15), I(AS, 8), I(MG, 6))
          )
        },
        {
          n: '4. التحجيم والنضج ورفع الصلابة', from: 61, to: 120,
          d: D(
            R(I(SP, 18, 22), I(MG, 6)),
            R(I(CN, 10, 12, 'كغ', 'لتحسين صلابة الثمار وقدرتها التخزينية')),
            R(I(SP, 18, 22), I(KN, 8, 10, 'كغ', 'أوقف النيتروجين قبل الجني النهائي بـ 15 يوماً'))
          )
        }
      )
    },
    watermelon: {
      ar: 'البطيخ الأحمر',
      re: /بطيخ|pastèque|pasteque|watermelon/i,
      stages: new Array(
        {
          n: '1. التأسيس والتجذير', from: 1, to: 14,
          d: D(
            R(I(MAP, 10), I(AS, 5)),
            R(I(CN, 6)),
            R(I(MAP, 10), I(AC, 1.5, 2, 'لتر'))
          )
        },
        {
          n: '2. النمو الخضري وامتداد العرش', from: 15, to: 30,
          d: D(
            R(I(AS, 14, 16), I(MAP, 5)),
            R(I(CN, 10)),
            R(I(AS, 12, 14), I(MG, 5))
          )
        },
        {
          n: '3. التزهير وعقد الثمار', from: 31, to: 48,
          d: D(
            R(I(MAP, 6), I(KN, 12)),
            R(I(CN, 12)),
            R(I(KN, 12), I(AS, 6), I(MG, 5))
          )
        },
        {
          n: '4. التحجيم وزيادة السكريات (Brix)', from: 49, to: 85,
          d: D(
            R(I(SP, 20, 25)),
            R(I(CN, 10, 10, 'كغ', 'يمنع تشقق الثمار ويعزز الصلابة')),
            R(I(SP, 20, 25), I(MG, 6, 6, 'كغ', 'يُوقف النيتروجين تماماً في آخر أسبوعين قبل الحصاد'))
          )
        }
      )
    },
    melon: {
      ar: 'الشمام',
      re: /شمام|melon|cantaloup/i,
      stages: new Array(
        {
          n: '1. التأسيس والتجذير', from: 1, to: 14,
          d: D(
            R(I(MAP, 8, 10), I(AS, 5)),
            R(I(CN, 5)),
            R(I(MAP, 8, 10), I(AC, 1.5, 1.5, 'لتر'))
          )
        },
        {
          n: '2. النمو الخضري', from: 15, to: 28,
          d: D(
            R(I(AS, 12, 14), I(MAP, 4)),
            R(I(CN, 8, 10)),
            R(I(AS, 10, 12), I(MG, 4))
          )
        },
        {
          n: '3. التزهير وعقد الثمار', from: 29, to: 45,
          d: D(
            R(I(MAP, 5), I(KN, 10, 12)),
            R(I(CN, 10, 12)),
            R(I(KN, 10, 12), I(AS, 5), I(MG, 5))
          )
        },
        {
          n: '4. التحجيم وتكوين الشبكة والسكريات', from: 46, to: 80,
          d: D(
            R(I(SP, 16, 20)),
            R(I(CN, 8, 10)),
            R(I(SP, 16, 20), I(MG, 5, 5, 'كغ', 'أوقف النيتروجين قبل النضج بـ 12–15 يوماً'))
          )
        }
      )
    },
    onion: {
      ar: 'البصل',
      re: /بصل|oignon|onion/i,
      stages: new Array(
        {
          n: '1. التأسيس ونمو الأوراق', from: 1, to: 45,
          d: D(
            R(I(MAP, 10), I(AS, 12, 15)),
            R(I(CN, 8)),
            R(I(AS, 12, 15), I(AC, 1.5, 1.5, 'لتر'))
          )
        },
        {
          n: '2. بداية تكوين وانتفاخ الأبصال', from: 46, to: 90,
          d: D(
            R(I(KN, 10, 12), I(AS, 8)),
            R(I(CN, 8, 10)),
            R(I(SP, 12, 15), I(MG, 5))
          )
        },
        {
          n: '3. امتلاء الأبصال والنضج', from: 91, to: 135,
          d: D(
            R(I(SP, 15, 18)),
            R(I(CN, 6, 8, 'كغ', 'لتحسين القشرة الخارجية وقدرة التخزين')),
            R(I(SP, 15, 18, 'كغ', 'أوقف التسميد تماماً قبل الحصاد بـ 3 أسابيع'))
          )
        }
      )
    },
    potato: {
      ar: 'البطاطس',
      re: /بطاطس|بطاطا|pomme de terre|potato/i,
      stages: new Array(
        {
          n: '1. الإنبات وتكوين المجموع الجذري', from: 1, to: 20,
          d: D(
            R(I(MAP, 12, 15), I(AS, 8)),
            R(I(CN, 8)),
            R(I(MAP, 12, 15), I(AC, 1.5, 2, 'لتر'))
          )
        },
        {
          n: '2. النمو الخضري وبداية تكوين الدرنات', from: 21, to: 45,
          d: D(
            R(I(AS, 15, 18), I(MAP, 6)),
            R(I(CN, 10, 12)),
            R(I(AS, 15), I(KN, 10), I(MG, 6))
          )
        },
        {
          n: '3. صب وتحجيم الدرنات', from: 46, to: 95,
          d: D(
            R(I(SP, 20, 25)),
            R(I(CN, 10, 12, 'كغ', 'يمنع القلب الأجوف ويزيد متانة القشرة')),
            R(I(SP, 20, 25), I(MG, 6, 6, 'كغ', 'أوقف النيتروجين قبل التقليع بـ 20 يوماً'))
          )
        }
      )
    },
    carrot: {
      ar: 'الجزر',
      re: /جزر|carotte|carrot/i,
      stages: new Array(
        {
          n: '1. الإنبات ونمو الجذر الوتدي', from: 1, to: 35,
          d: D(
            R(I(MAP, 10, 12), I(AS, 8)),
            R(I(CN, 6, 8)),
            R(I(AS, 8), I(AC, 1.5, 1.5, 'لتر'))
          )
        },
        {
          n: '2. تغليظ وتحجيم الجذور', from: 36, to: 95,
          d: D(
            R(I(SP, 15, 18)),
            R(I(CN, 10, 10, 'كغ', 'ضروري لمنع تشقق الجذور')),
            R(I(SP, 15, 18), I(KN, 8))
          )
        }
      )
    }
  };

  const cropKey = (txt) => {
    const t = String(txt || '');
    for (const k in PROG) {
      if (PROG[k].re.test(t)) return k;
    }
    return null;
  };

  const ymd = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  const wday = (s) => new Date(s + 'T12:00:00').getDay();
  const st = () => (typeof S !== 'undefined' ? S : { fields: new Array() });
  const areaHa = (f) => {
    const M = { 'هكتار': 10000, 'فدان': 4200, 'دونم': 1000, 'م²': 1 };
    return (parseFloat(f.area) || 0) * (M[st().areaUnit] || 10000) / 10000;
  };
  const irrDays = () => {
    const def = new Array(6, 1, 3);
    const d = J('sme_fs_days', def);
    return (Array.isArray(d) && d.length === 3) ? d : def;
  };
  const fmt = (n) => (Math.round(n * 100) / 100).toString();

  const dueOn = (f, date) => {
    const k = cropKey(f.crop);
    if (!k || !f.plant) return null;
    const slot = irrDays().indexOf(wday(date));
    if (slot < 0) return null;
    const d = diffDays(f.plant, date);
    if (d < 0) return null;
    const stg = PROG[k].stages.find(s => d >= s.from && d <= s.to);
    if (!stg) return null;
    return { k, d, stg, slot, items: stg.d.at(slot) || new Array() };
  };

  const doneMap = () => J('sme_fs_done', {});
  const isDone = (f, date) => !!doneMap()[f.id + '|' + date];

  const deduct = (items, ha, fname) => {
    const stock = J('sme_fert_stock', new Array());
    const logs = J('sme_fert_logs', new Array());
    const out = new Array();
    items.forEach(it => {
      const amt = it.lo * ha;
      if (!(amt > 0)) return;
      const found = MATCH.find(x => x.at(1) === it.p);
      if (!found) return;
      const m = found.at(0);
      const row = stock.find(x => m.test(String(x.name)) && (+x.qty || 0) > 0) || stock.find(x => m.test(String(x.name)));
      if (!row) { out.push(it.p + ': غير موجود بالمخزون'); return; }
      const before = +row.qty || 0;
      row.qty = Math.max(0, Math.round((before - amt) * 100) / 100);
      logs.push({ date: ymd(new Date()), name: row.name, qty: Math.round(amt * 100) / 100, field: fname });
      out.push(row.name + ': −' + fmt(amt));
    });
    lsSet('sme_fert_stock', JSON.stringify(stock));
