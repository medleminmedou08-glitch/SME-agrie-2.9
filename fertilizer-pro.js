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

    // 2. نافذة نظام الأسمدة
    const modal = document.createElement('div');
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:1000000; overflow-y:auto; padding:14px; direction:rtl;';
    document.documentElement.appendChild(modal);

    // بيانات مخزن الأسمدة القياسية وسجل الصرف
    let stock = JSON.parse(localStorage.getItem('sme_fert_stock') || '[]');
    if (stock.length === 0) {
      stock = new Array(
        { id: 1, name: 'ماب MAP 12-61-0 (عالي الفوسفور)', qty: 200, price: 65, min: 50 },
        { id: 2, name: 'NPK 20-20-20 متوازن ذواب', qty: 400, price: 48, min: 100 },
        { id: 3, name: 'سلفات الأمونيوم 21% (نيتروجين + كبريت)', qty: 500, price: 32, min: 100 },
        { id: 4, name: 'يوريا 46% (نيتروجين)', qty: 400, price: 38, min: 100 },
        { id: 5, name: 'سلفات البوتاسيوم 0-0-50 (تحجيم)', qty: 350, price: 55, min: 80 },
        { id: 6, name: 'نترات البوتاسيوم 13-0-46', qty: 250, price: 60, min: 50 },
        { id: 7, name: 'نترات الكالسيوم 15.5-0-0 + 26% CaO', qty: 200, price: 48, min: 50 },
        { id: 8, name: 'سلفات المغنيسيوم 16% MgO', qty: 150, price: 30, min: 40 },
        { id: 9, name: 'عناصر صغرى مخلبية (حديد + زنك + منغنيز)', qty: 50, price: 120, min: 10 },
        { id: 10, name: 'حمض الفوسفوريك / الكبريتيك (تعديل pH)', qty: 100, price: 50, min: 25 }
      );
      localStorage.setItem('sme_fert_stock', JSON.stringify(stock));
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
              <h3 style="margin:0; color:#065f46; font-size:17px;">🧪 إدارة الأسمدة والتسميد العلمي</h3>
              <span style="font-size:11px; color:#64748b;">معدلات منظمة الفاو (FAO) بالتنقيط — مخزون وحاسبة الجرعات</span>
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
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">نوع المحصول:</label>
              <select id="calcCrop" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="tomato">🍅 الطماطم (Tomato)</option>
                <option value="watermelon">🍉 البطيخ الأحمر (Pastèque)</option>
                <option value="melon">🍈 الشمام (Melon)</option>
                <option value="onion">🧅 البصل (Oignon)</option>
                <option value="potato">🥔 البطاطس (Pomme de terre)</option>
              </select>
            </div>
            <div style="margin-bottom:8px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">نوع التربة:</label>
              <select id="calcSoil" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="sandy">تربة رملية (تحتاج تقسيم الجرعات وتجنب اليوريا)</option>
                <option value="loamy">تربة طينية / طميية متوسطة</option>
              </select>
            </div>
            <div style="margin-bottom:8px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">مرحلة النمو الحالية للنبات:</label>
              <select id="calcStage" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="root">1. التأسيس وتجذير الشتلات (الأسبوع 1 - 2)</option>
                <option value="veg">2. النمو الخضري وتكوين العرش (الأسبوع 3 - 5)</option>
                <option value="flower">3. التزهير وعقد الثمار (الأسبوع 6 - 8)</option>
                <option value="fruit">4. التحجيم والنضج ورفع السكر (الأسبوع 9 - الحصاد)</option>
              </select>
            </div>
            <div style="margin-bottom:10px;">
              <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">مساحة الحقل (بالهكتار):</label>
              <input id="calcArea" type="number" step="0.1" min="0.1" value="1" placeholder="مثال: 1.5" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
            </div>
            <button id="runCalcBtn" style="width:100%; background:#065f46; color:#fff; border:none; border-radius:8px; padding:10px; font-weight:bold; cursor:pointer;">احسب الجرعة الأسبوعية الصحيحة</button>
          </div>
          <div id="calcResultBox" style="margin-top:12px;"></div>
        `;

        document.getElementById('runCalcBtn').onclick = () => {
          const crop = document.getElementById('calcCrop').value;
          const soil = document.getElementById('calcSoil').value;
          const stage = document.getElementById('calcStage').value;
          const area = parseFloat(document.getElementById('calcArea').value) || 1;

          const cropFactors = {
            tomato:     { n: 1.0,  p: 1.0,  k: 1.0  },
            watermelon: { n: 0.85, p: 0.8,  k: 0.95 },
            melon:      { n: 0.8,  p: 0.75, k: 0.9  },
            onion:      { n: 0.9,  p: 0.85, k: 0.85 },
            potato:     { n: 0.95, p: 1.1,  k: 1.15 }
          };
          const f = cropFactors[crop] || cropFactors.tomato;
          const nSource = soil === 'sandy' ? 'سلفات الأمونيوم 21% (مقاوم للغسيل)' : 'يوريا 46% أو نترات الأمونيوم';
          const nMult = soil === 'sandy' ? 1.8 : 1.0;

          const programs = {
            root: {
              title: 'مرحلة التأسيس وتنشيط الجذور (عالي الفوسفور)',
              npkPure: `الاحتياج الصافي: ${(5 * area * f.n).toFixed(1)} كغ N • ${(15 * area * f.p).toFixed(1)} كغ P₂O₅ • ${(4 * area * f.k).toFixed(1)} كغ K₂O`,
              items: new Array(
                { name: 'ماب MAP 12-61-0 (لتكوين المجموع الجذري)', kg: Math.round(25 * area * f.p) },
                { name: nSource, kg: Math.round(8 * area * f.n * nMult) },
                { name: 'هيوميك أسيد 85% (تحسين امتصاص الجذور)', kg: Math.round(3 * area * 10) / 10 },
                { name: 'حمض الفوسفوريك أو الكبريتيك (لضبط pH الماء إلى 6.0)', kg: Math.round(2 * area * 10) / 10 }
              ),
