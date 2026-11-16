(function() {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initFertilizerModule = () => {
    if (document.getElementById('smeFertBtn')) return;

    // 1. زر وحدة الأسمدة
    const fertBtn = document.createElement('button');
    fertBtn.id = 'smeFertBtn';
    fertBtn.innerHTML = '🧪 الأسمدة والتسميد';
    fertBtn.style.cssText = 'position:fixed; bottom:126px; right:16px; z-index:9998; background:#065f46; color:#fff; border:2px solid #34d399; border-radius:25px; padding:9px 16px; font-weight:bold; font-size:13px; box-shadow:0 4px 12px rgba(0,0,0,0.3); cursor:pointer; font-family:inherit;';
    document.body.appendChild(fertBtn);

    // 2. نافذة نظام الأسمدة المتعمق
    const modal = document.createElement('div');
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:1000000; overflow-y:auto; padding:14px; direction:rtl;';
    document.documentElement.appendChild(modal);

    // بيانات مخزن الأسمدة وسجل الصرف
    let stock = JSON.parse(localStorage.getItem('sme_fert_stock') || '[]');
    if (stock.length === 0) {
      stock = [
        { id: 1, name: 'NPK 20-20-20 متوازن', qty: 500, price: 45, min: 100 },
        { id: 2, name: 'يوريا 46% (نيتروجين)', qty: 400, price: 38, min: 100 },
        { id: 3, name: 'سلفات البوتاسيوم (تحجيم)', qty: 350, price: 52, min: 80 },
        { id: 4, name: 'نترات الكالسيوم', qty: 200, price: 48, min: 50 },
        { id: 5, name: 'حمض الفوسفوريك / ماب', qty: 150, price: 60, min: 40 }
      ];
    }
    if (!localStorage.getItem('sme_fert_stock_v2')) {
      // إضافة أصناف قائمة DEVIS 2026 دون حذف أي صنف موجود (الكميات والأسعار تُدخل من تبويب المخزون)
      const have = stock.map(x => String(x.name));
      let nid = stock.reduce((m, x) => Math.max(m, x.id || 0), 0);
      ['MAP 12-61-0','نترات البوتاسيوم 13-0-46','سلفات البوتاسيوم 0-0-50','نترات الأمونيوم 33%','كبريتات الأمونيوم 21%','نترات الكالسيوم (DEVIS)','هيوميك أسيد','مغنيسيوم (MgO)','بورون سائل','نحاس','حمض الكبريتيك / منظم pH']
        .forEach(n => { if (!have.includes(n)) stock.push({ id: ++nid, name: n, qty: 0, price: 0, min: 0 }); });
      localStorage.setItem('sme_fert_stock', JSON.stringify(stock));
      localStorage.setItem('sme_fert_stock_v2', '1');
    }
    let logs = JSON.parse(localStorage.getItem('sme_fert_logs') || '[]');
    let activeTab = 'calc';

    const saveAll = () => {
      localStorage.setItem('sme_fert_stock', JSON.stringify(stock));
      localStorage.setItem('sme_fert_logs', JSON.stringify(logs));
    };

    const renderFertSystem = () => {
      const totalStockValue = stock.reduce((acc, s) => acc + (s.qty * s.price), 0);
      const lowStockCount = stock.filter(s => s.qty <= s.min).length;

      modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; max-width:540px; margin:10px auto; padding:18px; box-shadow:0 15px 35px rgba(0,0,0,0.4); color:#1e293b;">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #065f46; padding-bottom:10px; margin-bottom:12px;">
            <div>
              <h3 style="margin:0; color:#065f46; font-size:17px;">🧪 إدارة الأسمدة والتسميد الذكي</h3>
              <span style="font-size:11px; color:#64748b;">مخزون الأسمدة، حاسبة الجرعات، ودليل الخلط</span>
            </div>
            <button id="closeFertModal" style="background:#ef4444; color:#fff; border:none; border-radius:8px; padding:5px 11px; font-weight:bold; cursor:pointer;">✕</button>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:12px; font-size:12px;">
            <div style="flex:1; background:#ecfdf5; border:1px solid #a7f3d0; padding:8px; border-radius:8px; text-align:center;">
              قيمة المخزون: <strong style="color:#065f46;">${totalStockValue.toLocaleString()} MRU</strong>
            </div>
            <div style="flex:1; background:${lowStockCount > 0 ? '#fee2e2' : '#f1f5f9'}; border:1px solid ${lowStockCount > 0 ? '#fca5a5' : '#cbd5e1'}; padding:8px; border-radius:8px; text-align:center;">
              تنبيهات النقص: <strong style="color:${lowStockCount > 0 ? '#dc2626' : '#334155'};">${lowStockCount} أصناف</strong>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; margin-bottom:14px;">
            <button class="f-tab" data-tab="calc" style="padding:8px 4px; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; background:${activeTab==='calc'?'#065f46':'#e2e8f0'}; color:${activeTab==='calc'?'#fff':'#334155'};">🧮 الحاسبة</button>
            <button class="f-tab" data-tab="stock" style="padding:8px 4px; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; background:${activeTab==='stock'?'#065f46':'#e2e8f0'}; color:${activeTab==='stock'?'#fff':'#334155'};">📦 المخزن</button>
            <button class="f-tab" data-tab="logs" style="padding:8px 4px; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; background:${activeTab==='logs'?'#065f46':'#e2e8f0'}; color:${activeTab==='logs'?'#fff':'#334155'};">📝 الصرف</button>
            <button class="f-tab" data-tab="mix" style="padding:8px 4px; border:none; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer; background:${activeTab==='mix'?'#065f46':'#e2e8f0'}; color:${activeTab==='mix'?'#fff':'#334155'};">⚠️ الخلط</button>
          </div>

          <div id="fertTabContent"></div>
        </div>
      `;

      const contentDiv = document.getElementById('fertTabContent');

      if (activeTab === 'calc') {
        contentDiv.innerHTML = `
          <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #cbd5e1;">
            <div style="margin-bottom:8px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">نوع المحصول في الحقل:</label>
              <select id="calcCrop" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="watermelon">🍉 البطيخ الأحمر (Pastèque)</option>
                <option value="melon">🍈 الشمام الشبكي / الأصفر (Melon)</option>
                <option value="veg">🍅 خضروات عامة (طماطم / فلفل)</option>
              </select>
            </div>
            <div style="margin-bottom:8px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">مرحلة النمو الحالية للنبات:</label>
              <select id="calcStage" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="root">1. التأسيس وتجذير الشتلات (الأسبوع 1 - 2)</option>
                <option value="veg">2. النمو الخضري وتكوين العرش (الأسبوع 3 - 4)</option>
                <option value="flower">3. التزهير وعقد الثمار (الأسبوع 5 - 6)</option>
                <option value="fruit">4. التحجيم وزيادة السكر (الأسبوع 7 - 9)</option>
              </select>
            </div>
            <div style="margin-bottom:10px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">مساحة الحقل (بالهكتار - Hectare):</label>
              <input id="calcArea" type="number" step="0.1" value="1" placeholder="مثال: 2.5 هكتار" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
            </div>
            <button id="runCalcBtn" style="width:100%; background:#d97706; color:#fff; border:none; border-radius:8px; padding:10px; font-weight:bold; cursor:pointer;">احسب البرنامج السمادي الموصى به</button>
          </div>
          <div id="calcResultBox" style="margin-top:12px;"></div>
        `;

        document.getElementById('runCalcBtn').onclick = () => {
          const crop = document.getElementById('calcCrop').value;
          const stage = document.getElementById('calcStage').value;
          const area = parseFloat(document.getElementById('calcArea').value) || 1;
          const mult = crop === 'watermelon' ? 1.1 : (crop === 'melon' ? 1.0 : 0.9);

          const programs = {
            root: {
              title: 'برنامج التأسيس وتقوية الجذور',
              items: [
                { name: 'حمض الفوسفوريك أو ماب (عالي الفوسفور)', kg: Math.round(15 * area * mult) },
                { name: 'هيوميك أسيد + منشط جذور', kg: Math.round(4 * area * mult) },
                { name: '[DEVIS] MAP 12-61-0 (بديل)', kg: Math.round(15 * area * mult) },
                { name: '[DEVIS] كبريتات الأمونيوم 21%', kg: Math.round(10 * area * mult) }
              ],
              note: 'بالتنقيط صباحاً. اضبط pH الماء بمنظم الحموضة/حمض الكبريتيك قبل الحقن.'
            },
            veg: {
              title: 'برنامج النمو الخضري وبناء المجموع الورقي',
              items: [
                { name: 'يوريا 46% أو نترات النشادر', kg: Math.round(25 * area * mult) },
                { name: 'NPK 20-20-20 متوازن', kg: Math.round(20 * area * mult) },
                { name: 'عناصر صغرى مخلبية (حديد + زنك)', kg: Math.round(2 * area * mult) },
                { name: '[DEVIS] نترات الأمونيوم 33%', kg: Math.round(25 * area * mult) },
                { name: '[DEVIS] نترات البوتاسيوم 13-0-46', kg: Math.round(15 * area * mult) },
                { name: '[DEVIS] مغنيسيوم (MgO)', kg: Math.round(8 * area * mult) }
              ],
              note: 'قسّمها على دفعات أسبوعية؛ لا تخلط الكالسيوم مع الفوسفات/الكبريتات في نفس الخزان.'
            },
            flower: {
              title: 'برنامج التزهير وتثبيت العقد',
              items: [
                { name: 'NPK عالي الفوسفور (15-30-15)', kg: Math.round(22 * area * mult) },
                { name: 'نترات الكالسيوم (منفصلة في يوم مستقل)', kg: Math.round(18 * area * mult) },
                { name: 'بورون + موليبدينوم (رش أو تسميد)', kg: Math.round(1.5 * area * mult) },
                { name: '[DEVIS] MAP 12-61-0', kg: Math.round(10 * area * mult) },
                { name: '[DEVIS] نترات البوتاسيوم 13-0-46', kg: Math.round(15 * area * mult) },
                { name: '[DEVIS] بورون سائل', kg: Math.round(1.5 * area * mult * 10) / 10 }
              ],
              note: 'الكالسيوم والبورون يمنعان تساقط الأزهار وتشوه الثمار.'
            },
            fruit: {
              title: 'برنامج التحجيم ورفع نسبة السكر والصلابة',
              items: [
                { name: 'سلفات البوتاسيوم الذوابة (0-0-50)', kg: Math.round(35 * area * mult) },
                { name: 'سلفات المغنيسيوم', kg: Math.round(10 * area * mult) },
                { name: '[DEVIS] نترات البوتاسيوم 13-0-46', kg: Math.round(10 * area * mult) },
                { name: '[DEVIS] نحاس (وقائي، رشاً)', kg: Math.round(0.5 * area * mult * 10) / 10 }
              ],
              note: 'أوقف الأمونيوم في هذه المرحلة لرفع الحلاوة. الأرقام تقريبية؛ عدّلها بتحليل التربة.'
            }
          };

          const res = programs[stage];
          document.getElementById('calcResultBox').innerHTML = `
            <div style="background:#ecfdf5; border:1px solid #059669; border-radius:10px; padding:12px;">
              <div style="font-weight:bold; color:#065f46; font-size:14px; margin-bottom:8px;">📋 ${res.title} (${area} هكتار):</div>
              ${res.items.map(i => `<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #a7f3d0; font-size:13px;">
                <span>• ${i.name}</span>
                <strong style="color:#1a3622;">${i.kg} كغ / أسبوع</strong>
              </div>`).join('')}

              <div style="margin-top:8px; font-size:12px; color:#065f46; background:#d1fae5; padding:8px; border-radius:6px; line-height:1.5;">💡 ${res.note}</div>
            </div>
          `;
        };

      } else if (activeTab === 'stock') {
        contentDiv.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
            ${stock.map(s => `
              <div style="background:${s.qty <= s.min ? '#fee2e2' : '#f8fafc'}; border:1px solid ${s.qty <= s.min ? '#fca5a5' : '#e2e8f0'}; border-radius:10px; padding:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:bold;">
                  <span>${esc(s.name)}</span>
                  <button class="f-del" data-id="${s.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px;">🗑</button>
                </div>
                <div style="font-size:12px; color:#475569; margin:4px 0;">
                  الكمية: <strong>${s.qty} كغ</strong> | السعر: ${s.price} MRU/كغ | الحد الأدنى: ${s.min}
                  ${s.qty <= s.min ? '<strong style="color:#dc2626;"> ⚠️ نقص</strong>' : ''}
                </div>
                <div style="display:flex; gap:6px;">
                  <input type="number" min="0" placeholder="كمية وارد (كغ)" class="f-restock-qty" data-id="${s.id}" style="flex:1; padding:6px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
                  <button class="f-restock" data-id="${s.id}" style="background:#065f46; color:#fff; border:none; border-radius:6px; padding:0 12px; font-weight:bold; cursor:pointer;">+ توريد</button>
                </div>
              </div>`).join('')}
          </div>
          <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px; padding:10px;">
            <div style="font-weight:bold; font-size:12px; margin-bottom:6px;">إضافة صنف جديد:</div>
            <input id="newFertName" type="text" placeholder="اسم السماد" style="width:100%; padding:7px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:6px; box-sizing:border-box;">
            <div style="display:flex; gap:6px;">
              <input id="newFertQty" type="number" min="0" placeholder="الكمية كغ" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
              <input id="newFertPrice" type="number" min="0" placeholder="السعر/كغ" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
              <input id="newFertMin" type="number" min="0" placeholder="الحد الأدنى" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
            </div>
            <button id="addFertBtn" style="width:100%; margin-top:8px; background:#1a3622; color:#fff; border:none; border-radius:8px; padding:9px; font-weight:bold; cursor:pointer;">+ إضافة للمخزن</button>
          </div>
        `;

        contentDiv.querySelectorAll('.f-restock').forEach(btn => {
          btn.onclick = () => {
            const id = Number(btn.dataset.id);
            const input = contentDiv.querySelector(`.f-restock-qty[data-id="${id}"]`);
            const q = parseFloat(input.value);
            if (!(q > 0)) return alert('أدخل كمية صحيحة');
            const item = stock.find(s => s.id === id);
            if (item) { item.qty += q; saveAll(); renderFertSystem(); }
          };
        });
        contentDiv.querySelectorAll('.f-del').forEach(btn => {
          btn.onclick = () => {
            if (!confirm('حذف هذا الصنف من المخزن؟')) return;
            stock = stock.filter(s => s.id !== Number(btn.dataset.id));
            saveAll(); renderFertSystem();
          };
        });
        document.getElementById('addFertBtn').onclick = () => {
          const name = document.getElementById('newFertName').value.trim();
          const qty = parseFloat(document.getElementById('newFertQty').value);
          const price = parseFloat(document.getElementById('newFertPrice').value);
          const min = parseFloat(document.getElementById('newFertMin').value) || 0;
          if (!name || !(qty >= 0) || !(price >= 0)) return alert('أدخل الاسم والكمية والسعر بشكل صحيح');
          stock.push({ id: Date.now(), name, qty, price, min });
          saveAll(); renderFertSystem();
        };

      } else if (activeTab === 'logs') {
        contentDiv.innerHTML = `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:bold; font-size:12px; margin-bottom:6px;">تسجيل صرف سماد من المخزن:</div>
            <select id="logItem" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:6px;">
              ${stock.map(s => `<option value="${s.id}">${esc(s.name)} (المتوفر: ${s.qty} كغ)</option>`).join('')}
            </select>
            <div style="display:flex; gap:6px; margin-bottom:6px;">
              <input id="logQty" type="number" min="0" placeholder="الكمية المصروفة (كغ)" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
              <input id="logField" type="text" placeholder="الحقل / الملاحظة" style="flex:1; padding:7px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
            </div>
            <button id="addLogBtn" style="width:100%; background:#d97706; color:#fff; border:none; border-radius:8px; padding:9px; font-weight:bold; cursor:pointer;">تسجيل الصرف</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${logs.length === 0 ? '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:14px;">لا توجد عمليات صرف مسجلة بعد.</div>' :
              logs.slice().reverse().slice(0, 50).map(l => `
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; font-size:12px; display:flex; justify-content:space-between;">
                  <span>📅 ${esc(l.date)} — <strong>${esc(l.name)}</strong>${l.field ? ' (' + esc(l.field) + ')' : ''}</span>
                  <strong style="color:#b45309;">${l.qty} كغ</strong>
                </div>`).join('')}
          </div>
        `;
        document.getElementById('addLogBtn').onclick = () => {
          const id = Number(document.getElementById('logItem').value);
          const qty = parseFloat(document.getElementById('logQty').value);
          const field = document.getElementById('logField').value.trim();
          const item = stock.find(s => s.id === id);
          if (!item) return alert('لا يوجد صنف في المخزن');
          if (!(qty > 0)) return alert('أدخل كمية صحيحة');
          if (qty > item.qty) return alert('الكمية المطلوبة أكبر من المتوفر في المخزن (' + item.qty + ' كغ)');
          item.qty -= qty;
          logs.push({ date: new Date().toISOString().split('T')[0], name: item.name, qty, field });
          saveAll(); renderFertSystem();
        };

      } else {
        contentDiv.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; line-height:1.6;">
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:10px; padding:10px;">
              <strong style="color:#b91c1c;">❌ لا تخلط أبداً في نفس الخزان:</strong><br>
              • نترات الكالسيوم مع أي سماد يحتوي على <b>كبريتات</b> (سلفات البوتاسيوم، سلفات المغنيسيوم) — يترسب الجبس.<br>
              • نترات الكالسيوم مع <b>الفوسفات</b> (حمض الفوسفوريك، ماب، NPK فوسفاتي) — يترسب فوسفات الكالسيوم.<br>
              • الأسمدة الحمضية مع الأسمدة القلوية أو الكلورين.
            </div>
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:10px;">
              <strong style="color:#065f46;">✅ آمن الخلط:</strong><br>
              • اليوريا مع NPK المتوازن ومع سلفات البوتاسيوم.<br>
              • العناصر الصغرى المخلبية مع معظم الأسمدة (باستثناء الفوسفات بتركيز عالٍ).
            </div>
            <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:10px;">
              <strong style="color:#92400e;">💡 نصائح:</strong><br>
              • اجعل الكالسيوم في يوم مستقل أو خزان (A) منفصل عن خزان الفوسفات والكبريتات (B).<br>
              • اختبر الخلط في دلو صغير قبل الخزان الكبير؛ أي عكارة أو ترسّب تعني عدم التوافق.<br>
              • اغسل خطوط التنقيط بماء نظيف بعد كل تسميد.
            </div>
          </div>
        `;
      }

      modal.querySelectorAll('.f-tab').forEach(btn => {
        btn.onclick = () => { activeTab = btn.dataset.tab; renderFertSystem(); };
      });
      document.getElementById('closeFertModal').onclick = () => { modal.style.display = 'none'; };
    };

    fertBtn.onclick = () => { try { stock = JSON.parse(localStorage.getItem('sme_fert_stock') || '[]'); logs = JSON.parse(localStorage.getItem('sme_fert_logs') || '[]'); } catch (e) {} renderFertSystem(); modal.style.display = 'block'; };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFertilizerModule, { once: true });
  else initFertilizerModule();
})();
