(function() {
  const onReady = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const lsJson = (k, d) => { try { return JSON.parse(lsGet(k, 'null')) || d; } catch (e) { return d; } };
  const nf = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const appState = () => lsJson('farm_manager_v1', {});

  const texts = {
    ar: {
      dir: 'rtl', btnFloat: '🧾 الفوترة', title: '🧾 فاتورة مبيعات', langSwitch: 'Français 🇫🇷',
      company: 'بيانات الشركة', compAddrPh: 'العنوان', compPhonePh: 'هاتف / NIF / السجل التجاري',
      defaultAddr: 'كرمسين، ولاية اترارزة - موريتانيا', clientLabel: 'العميل / المشتري', clientPh: 'اسم العميل (يُقترح من العملاء السابقين)',
      clientPhone: 'هاتف العميل', clientAddr: 'عنوان العميل', defaultClient: 'عميل نقدي',
      invNumLabel: 'رقم الفاتورة', dateLabel: 'التاريخ', methodLabel: 'طريقة الدفع',
      addItemTitle: 'إضافة صنف / محصول', itemNamePh: 'المحصول (مثال: بطيخ أحمر)', itemQtyPh: 'الكمية', itemPricePh: 'سعر الوحدة', addBtn: '+ إضافة',
      thItem: 'الصنف', thQty: 'الكمية', thPrice: 'السعر', thSub: 'المجموع', noItems: 'لم تُضف أصناف بعد',
      subtotal: 'المجموع', discount: 'خصم', tax: 'ضريبة %', taxAmt: 'الضريبة', grand: 'الإجمالي المستحق', paid: 'المدفوع مقدماً', balance: 'المتبقي',
      notes: 'ملاحظات تظهر في الفاتورة', exportBtn: '📄 تصدير وحفظ PDF', waBtn: '📲 واتساب', newBtn: '🆕 فاتورة جديدة',
      errInput: 'أدخل اسم الصنف والكمية والسعر بشكل صحيح', errEmpty: 'أضف صنفاً واحداً على الأقل قبل التصدير',
      pdfSubtitle: 'الإنتاج الزراعي والتسويق', pdfBillTo: 'فاتورة إلى', pdfInvNo: 'رقم الفاتورة', pdfDate: 'التاريخ', pdfMethod: 'الدفع',
      pdfThDesc: 'البيان', pdfThUnit: 'سعر الوحدة', pdfSign: 'توقيع وختم الإدارة', pdfFooter: 'شكراً لتعاملكم معنا',
      methods: { cash: 'نقداً', bank: 'تحويل بنكي', bankily: 'بنكيلي', masrivi: 'مصرفي', sedad: 'سداد', cheque: 'شيك', credit: 'آجل' },
      units: { kg: 'كغ', ton: 'طن', box: 'صندوق', pc: 'حبة / قطعة', bag: 'كيس', lot: 'شحنة' }
    },
    fr: {
      dir: 'ltr', btnFloat: '🧾 Facturation', title: '🧾 Facture de vente', langSwitch: 'العربية 🇸🇦',
      company: 'Société', compAddrPh: 'Adresse', compPhonePh: 'Tél / NIF / RC',
      defaultAddr: 'Keur Macène, Wilaya du Trarza - Mauritanie', clientLabel: 'Client / Acheteur', clientPh: 'Nom du client (suggestions)',
      clientPhone: 'Téléphone client', clientAddr: 'Adresse client', defaultClient: 'Client Comptant',
      invNumLabel: 'N° de facture', dateLabel: 'Date', methodLabel: 'Mode de paiement',
      addItemTitle: 'Ajouter un produit / récolte', itemNamePh: 'Produit (ex : Pastèque)', itemQtyPh: 'Quantité', itemPricePh: 'Prix unitaire', addBtn: '+ Ajouter',
      thItem: 'Désignation', thQty: 'Qté', thPrice: 'P.U', thSub: 'Total', noItems: 'Aucun article',
      subtotal: 'Sous-total', discount: 'Remise', tax: 'TVA %', taxAmt: 'TVA', grand: 'Net à payer', paid: 'Acompte versé', balance: 'Reste à payer',
      notes: 'Notes visibles sur la facture', exportBtn: '📄 Exporter PDF', waBtn: '📲 WhatsApp', newBtn: '🆕 Nouvelle facture',
      errInput: 'Saisissez produit, quantité et prix valides', errEmpty: 'Ajoutez au moins un article avant d’exporter',
      pdfSubtitle: 'Production et commercialisation agricole', pdfBillTo: 'Facturé à', pdfInvNo: 'Facture N°', pdfDate: 'Date', pdfMethod: 'Paiement',
      pdfThDesc: 'Désignation', pdfThUnit: 'Prix unitaire', pdfSign: 'Cachet et signature', pdfFooter: 'Merci de votre confiance',
      methods: { cash: 'Espèces', bank: 'Virement', bankily: 'Bankily', masrivi: 'Masrivi', sedad: 'Sedad', cheque: 'Chèque', credit: 'À crédit' },
      units: { kg: 'kg', ton: 't', box: 'caisse', pc: 'pièce', bag: 'sac', lot: 'lot' }
    }
  };

  onReady(() => {
    if (document.getElementById('smeInvBtn')) return;
    let lang = lsGet('sme_inv_lang', 'ar') === 'fr' ? 'fr' : 'ar';

    const invBtn = document.createElement('button');
    invBtn.id = 'smeInvBtn';
    invBtn.innerHTML = texts.ar.btnFloat;
    invBtn.style.cssText = 'position:fixed; bottom:78px; left:16px; z-index:9998; background:#d97706; color:#fff; border:none; border-radius:25px; padding:10px 18px; font-weight:bold; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.25); cursor:pointer; font-family:inherit;';
    document.body.appendChild(invBtn);

    const modal = document.createElement('div');
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; overflow-y:auto; padding:14px;';
    document.body.appendChild(modal);

    /* ---------- الترقيم والعملاء ---------- */
    const pad = (n, w) => String(n).padStart(w, '0');
    const nextNumber = () => 'INV-' + new Date().getFullYear() + '-' + pad((+lsGet('sme_inv_counter', '0') || 0) + 1, 4);
    const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
    const getClients = () => lsJson('sme_inv_clients', []);

    const freshInv = () => ({ client: '', cphone: '', caddr: '', num: nextNumber(), date: today(), method: 'cash', discount: 0, tax: 0, paid: 0, notes: '', items: [] });
    let inv = Object.assign(freshInv(), lsJson('sme_inv_draft', {}));
    if (!Array.isArray(inv.items)) inv.items = [];
    const saveDraft = () => lsSet('sme_inv_draft', JSON.stringify(inv));

    const co = () => { const S = appState().co || {}; return S; };
    let compAddr = lsGet('sme_comp_addr', '') || [co().addr, co().city, co().country].filter(Boolean).join('، ');
    let compPhone = lsGet('sme_comp_phone', '') || [co().phone, co().nif ? 'NIF ' + co().nif : '', co().reg ? 'RC ' + co().reg : ''].filter(Boolean).join(' / ');
    const currency = () => appState().cur || 'MRU';

    const calc = () => {
      const sub = inv.items.reduce((a, it) => a + it.qty * it.price, 0);
      const disc = Math.min(Math.max(+inv.discount || 0, 0), sub);
      const taxAmt = (sub - disc) * (Math.max(+inv.tax || 0, 0) / 100);
      const grand = sub - disc + taxAmt;
      const paid = Math.min(Math.max(+inv.paid || 0, 0), grand);
      return { sub, disc, taxAmt, grand, paid, balance: grand - paid };
    };

    const readFields = () => {
      const g = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
      const v = (id, cur) => { const x = g(id); return x == null ? cur : x; };
      compAddr = v('compAddr', compAddr).trim(); compPhone = v('compPhone', compPhone).trim();
      lsSet('sme_comp_addr', compAddr); lsSet('sme_comp_phone', compPhone);
      inv.client = v('invClient', inv.client).trim(); inv.cphone = v('invCPhone', inv.cphone).trim(); inv.caddr = v('invCAddr', inv.caddr).trim();
      inv.num = v('invNum', inv.num).trim() || inv.num; inv.date = v('invDate', inv.date) || inv.date;
      inv.method = v('invMethod', inv.method); inv.notes = v('invNotes', inv.notes).trim();
      inv.discount = parseFloat(v('invDisc', inv.discount)) || 0; inv.tax = parseFloat(v('invTax', inv.tax)) || 0; inv.paid = parseFloat(v('invPaid', inv.paid)) || 0;
      saveDraft();
    };

    const renderModal = () => {
      const t = texts[lang];
      const aS = t.dir === 'rtl' ? 'right' : 'left', aE = t.dir === 'rtl' ? 'left' : 'right';
      const inputCss = 'width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box; font-size:13px;';
      const lbl = 'display:block; font-size:12px; font-weight:bold; margin:8px 0 3px;';
      modal.style.direction = t.dir;
      invBtn.innerHTML = t.btnFloat;
      modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; max-width:540px; margin:8px auto; padding:18px; box-shadow:0 10px 30px rgba(0,0,0,0.3); color:#1e293b;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #1a3622; padding-bottom:10px; margin-bottom:10px;">
            <h3 style="margin:0; color:#1a3622; font-size:17px;">${t.title}</h3>
            <div style="display:flex; gap:6px;">
              <button id="toggleInvLang" style="background:#1a3622; color:#fff; border:none; border-radius:8px; padding:5px 10px; font-size:12px; font-weight:bold; cursor:pointer;">${t.langSwitch}</button>
              <button id="closeInvModal" style="background:#ef4444; color:#fff; border:none; border-radius:8px; padding:5px 10px; font-weight:bold; cursor:pointer;">✕</button>
            </div>
          </div>

          <details style="background:#ecfdf5; padding:8px 10px; border-radius:10px; border:1px solid #a7f3d0;">
            <summary style="font-weight:bold; font-size:12px; color:#1a3622; cursor:pointer;">🏢 ${t.company}: SME Agri</summary>
            <input id="compAddr" type="text" value="${esc(compAddr)}" placeholder="${t.compAddrPh}" style="${inputCss} margin-top:6px;">
            <input id="compPhone" type="text" value="${esc(compPhone)}" placeholder="${t.compPhonePh}" style="${inputCss} margin-top:6px;">
          </details>

          <label style="${lbl}">${t.clientLabel}</label>
          <input id="invClient" list="invClientsList" type="text" value="${esc(inv.client)}" placeholder="${t.clientPh}" style="${inputCss}">
          <datalist id="invClientsList">${getClients().map(c => `<option value="${esc(c.name)}"></option>`).join('')}</datalist>
          <div style="display:flex; gap:8px;">
            <div style="flex:1;"><label style="${lbl}">${t.clientPhone}</label><input id="invCPhone" type="tel" value="${esc(inv.cphone)}" style="${inputCss}"></div>
            <div style="flex:1;"><label style="${lbl}">${t.clientAddr}</label><input id="invCAddr" type="text" value="${esc(inv.caddr)}" style="${inputCss}"></div>
          </div>

          <div style="display:flex; gap:8px;">
            <div style="flex:1;"><label style="${lbl}">${t.invNumLabel}</label><input id="invNum" type="text" value="${esc(inv.num)}" style="${inputCss}"></div>
            <div style="flex:1;"><label style="${lbl}">${t.dateLabel}</label><input id="invDate" type="date" value="${esc(inv.date)}" style="${inputCss}"></div>
          </div>
          <label style="${lbl}">${t.methodLabel}</label>
          <select id="invMethod" style="${inputCss}">${Object.entries(t.methods).map(([k, l]) => `<option value="${k}" ${inv.method === k ? 'selected' : ''}>${l}</option>`).join('')}</select>

          <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0; margin:12px 0;">
            <div style="font-weight:bold; font-size:13px; color:#1a3622; margin-bottom:6px;">${t.addItemTitle}</div>
            <input id="itemName" type="text" placeholder="${t.itemNamePh}" style="${inputCss} margin-bottom:6px;">
            <div style="display:flex; gap:6px;">
              <input id="itemQty" type="number" inputmode="decimal" min="0" step="any" placeholder="${t.itemQtyPh}" style="${inputCss} flex:1;">
              <select id="itemUnit" style="${inputCss} flex:1;">${Object.entries(t.units).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
              <input id="itemPrice" type="number" inputmode="decimal" min="0" step="any" placeholder="${t.itemPricePh}" style="${inputCss} flex:1;">
            </div>
            <button id="addItemBtn" style="width:100%; margin-top:6px; background:#1a3622; color:#fff; border:none; border-radius:8px; padding:9px; font-weight:bold; cursor:pointer;">${t.addBtn}</button>
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px;">
            <thead><tr style="background:#1a3622; color:#fff;">
              <th style="padding:6px; text-align:${aS};">${t.thItem}</th><th style="padding:6px; text-align:center;">${t.thQty}</th>
              <th style="padding:6px; text-align:center;">${t.thPrice}</th><th style="padding:6px; text-align:${aE};">${t.thSub}</th><th style="width:26px;"></th>
            </tr></thead>
            <tbody id="invItemsBody"></tbody>
          </table>

          <div style="display:flex; gap:8px;">
            <div style="flex:1;"><label style="${lbl}">${t.discount} (${esc(currency())})</label><input id="invDisc" type="number" inputmode="decimal" min="0" step="any" value="${inv.discount || ''}" style="${inputCss}"></div>
            <div style="flex:1;"><label style="${lbl}">${t.tax}</label><input id="invTax" type="number" inputmode="decimal" min="0" step="any" value="${inv.tax || ''}" style="${inputCss}"></div>
            <div style="flex:1;"><label style="${lbl}">${t.paid}</label><input id="invPaid" type="number" inputmode="decimal" min="0" step="any" value="${inv.paid || ''}" style="${inputCss}"></div>
          </div>
          <label style="${lbl}">${t.notes}</label>
          <textarea id="invNotes" rows="2" style="${inputCss}">${esc(inv.notes)}</textarea>

          <div id="invTotals" style="background:#fef3c7; padding:10px; border-radius:8px; margin:12px 0; font-size:13px; color:#92400e;"></div>

          <div style="display:flex; gap:6px;">
            <button id="exportInvPdfBtn" style="flex:2; background:#16a34a; color:#fff; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:bold; cursor:pointer;">${t.exportBtn}</button>
            <button id="waInvBtn" style="flex:1; background:#25d366; color:#fff; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:bold; cursor:pointer;">${t.waBtn}</button>
          </div>
          <button id="newInvBtn" style="width:100%; margin-top:8px; background:#e2e8f0; color:#334155; border:none; border-radius:10px; padding:9px; font-size:13px; font-weight:bold; cursor:pointer;">${t.newBtn}</button>
        </div>`;

      const $ = (id) => document.getElementById(id);

      const renderItems = () => {
        const tbody = $('invItemsBody');
        tbody.innerHTML = inv.items.length ? inv.items.map((it, i) => `<tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:6px; text-align:${aS};">${esc(it.name)}</td>
            <td style="padding:6px; text-align:center;">${nf(it.qty)} ${esc(t.units[it.unit] || '')}</td>
            <td style="padding:6px; text-align:center;">${nf(it.price)}</td>
            <td style="padding:6px; text-align:${aE}; font-weight:bold;">${nf(it.qty * it.price)}</td>
            <td><button data-del="${i}" style="background:none; border:none; color:#ef4444; font-size:15px; cursor:pointer;">✕</button></td></tr>`).join('')
          : `<tr><td colspan="5" style="padding:14px; text-align:center; color:#94a3b8;">${t.noItems}</td></tr>`;
        tbody.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => { readFields(); inv.items.splice(+b.dataset.del, 1); saveDraft(); renderModal(); }; });
        const c = calc(), cur = esc(currency());
        const row = (l, v, strong) => `<div style="display:flex; justify-content:space-between; ${strong ? 'font-weight:bold; font-size:16px; border-top:1px solid #fcd34d; margin-top:4px; padding-top:4px;' : ''}"><span>${l}</span><span>${v}</span></div>`;
        $('invTotals').innerHTML = row(t.subtotal, nf(c.sub) + ' ' + cur) + (c.disc ? row(t.discount, '− ' + nf(c.disc) + ' ' + cur) : '') + (c.taxAmt ? row(t.taxAmt + ' (' + nf(inv.tax) + '%)', nf(c.taxAmt) + ' ' + cur) : '')
          + row(t.grand, '<span id="invTotal">' + nf(c.grand) + '</span> ' + cur, true) + (c.paid ? row(t.paid, nf(c.paid) + ' ' + cur) + row(t.balance, nf(c.balance) + ' ' + cur) : '');
      };
      renderItems();
      ['invDisc', 'invTax', 'invPaid'].forEach(id => { $(id).oninput = () => { readFields(); renderItems(); }; });
      ['invClient', 'invCPhone', 'invCAddr', 'invNum', 'invDate', 'invNotes', 'invMethod', 'compAddr', 'compPhone'].forEach(id => { $(id).onchange = readFields; });
      $('invClient').onchange = () => {
        readFields();
        const c = getClients().find(x => x.name === inv.client);
        if (c) { if (!inv.cphone) $('invCPhone').value = c.phone || ''; if (!inv.caddr) $('invCAddr').value = c.addr || ''; readFields(); }
      };

      $('closeInvModal').onclick = () => { readFields(); modal.style.display = 'none'; };
      $('toggleInvLang').onclick = () => { readFields(); lang = lang === 'ar' ? 'fr' : 'ar'; lsSet('sme_inv_lang', lang); renderModal(); };
      $('newInvBtn').onclick = () => { if (inv.items.length && !confirm(lang === 'ar' ? 'بدء فاتورة جديدة؟ ستُمسح المسودة الحالية.' : 'Nouvelle facture ? Le brouillon actuel sera effacé.')) return; inv = freshInv(); saveDraft(); renderModal(); };

      $('addItemBtn').onclick = () => {
        const name = $('itemName').value.trim(), qty = parseFloat($('itemQty').value), price = parseFloat($('itemPrice').value);
        if (!name || !(qty > 0) || !(price >= 0)) return alert(t.errInput);
        readFields();
        inv.items.push({ name, qty, price, unit: $('itemUnit').value });
        saveDraft(); renderModal();
        setTimeout(() => { const n = document.getElementById('itemName'); if (n) n.focus(); }, 50);
      };

      /* ---------- واتساب ---------- */
      $('waInvBtn').onclick = () => {
        readFields();
        if (!inv.items.length) return alert(t.errEmpty);
        const c = calc(), cur = currency();
        const lines = [`🧾 *${lang === 'ar' ? 'فاتورة' : 'Facture'} ${inv.num}* — SME Agri`, `${t.pdfBillTo}: ${inv.client || t.defaultClient}`, `${t.pdfDate}: ${inv.date}`, ''];
        inv.items.forEach(it => lines.push(`• ${it.name}: ${nf(it.qty)} ${t.units[it.unit] || ''} × ${nf(it.price)} = ${nf(it.qty * it.price)}`));
        lines.push('', `*${t.grand}: ${nf(c.grand)} ${cur}*`);
        if (c.paid) lines.push(`${t.paid}: ${nf(c.paid)} — ${t.balance}: ${nf(c.balance)} ${cur}`);
        let digits = (inv.cphone || '').replace(/\D/g, ''); if (digits.length === 8) digits = '222' + digits;
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
      };

      /* ---------- PDF ---------- */
      const loadScript = (src) => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('تعذر تحميل ' + src));
        document.head.appendChild(s);
      });

      const buildInvoiceHtml = () => {
        const c = calc(), cur = esc(currency());
        const logo = (typeof LOGO !== 'undefined' && LOGO) ? `<img src="${LOGO}" style="width:64px; height:64px; border-radius:12px; object-fit:contain;">` : '';
        const rows = inv.items.map((it, i) => `
          <tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">
            <td style="padding:9px; border-bottom:1px solid #e2e8f0; text-align:${aS};">${esc(it.name)}</td>
            <td style="padding:9px; border-bottom:1px solid #e2e8f0; text-align:center;">${nf(it.qty)} ${esc(t.units[it.unit] || '')}</td>
            <td style="padding:9px; border-bottom:1px solid #e2e8f0; text-align:center;">${nf(it.price)}</td>
            <td style="padding:9px; border-bottom:1px solid #e2e8f0; text-align:${aE}; font-weight:bold;">${nf(it.qty * it.price)}</td></tr>`).join('');
        const tr = (l, v, strong) => `<div style="display:flex; justify-content:space-between; padding:5px 0; ${strong ? 'font-size:18px; font-weight:bold; color:#1a3622; border-top:2px solid #1a3622; margin-top:4px;' : 'font-size:14px;'}"><span>${l}</span><span>${v}</span></div>`;
        return `
          <div style="width:714px; padding:40px; background:#fff; color:#1e293b; direction:${t.dir}; font-family:Cairo, Arial, sans-serif; box-sizing:content-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #1a3622; padding-bottom:14px; margin-bottom:18px;">
              <div>
                <div style="font-size:26px; font-weight:bold; color:#1a3622;">SME Agri</div>
                <div style="font-size:13px; color:#475569;">Société Moulay Ely Pour Agricol</div>
                <div style="font-size:12px; color:#64748b;">${t.pdfSubtitle}</div>
                <div style="font-size:12px; color:#64748b;">${esc(compAddr || t.defaultAddr)}</div>
                ${compPhone ? `<div style="font-size:12px; color:#64748b;">${esc(compPhone)}</div>` : ''}
              </div>
              ${logo}
            </div>
            <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:18px; gap:20px;">
              <div><div style="color:#64748b; font-size:12px;">${t.pdfBillTo}</div><div style="font-weight:bold; font-size:17px;">${esc(inv.client || t.defaultClient)}</div>
                ${inv.cphone ? `<div style="font-size:12px; color:#475569;">${esc(inv.cphone)}</div>` : ''}${inv.caddr ? `<div style="font-size:12px; color:#475569;">${esc(inv.caddr)}</div>` : ''}</div>
              <div style="text-align:${aE}; line-height:1.8;"><div>${t.pdfInvNo}: <b>${esc(inv.num)}</b></div><div>${t.pdfDate}: <b>${esc(inv.date)}</b></div><div>${t.pdfMethod}: <b>${esc(t.methods[inv.method] || '')}</b></div></div>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <thead><tr style="background:#1a3622; color:#fff;">
                <th style="padding:9px; text-align:${aS};">${t.pdfThDesc}</th><th style="padding:9px; text-align:center;">${t.thQty}</th>
                <th style="padding:9px; text-align:center;">${t.pdfThUnit}</th><th style="padding:9px; text-align:${aE};">${t.thSub}</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:16px; width:300px; ${t.dir === 'rtl' ? 'margin-right:0; margin-left:auto;' : 'margin-left:auto;'}">
              ${tr(t.subtotal, nf(c.sub) + ' ' + cur)}${c.disc ? tr(t.discount, '− ' + nf(c.disc) + ' ' + cur) : ''}${c.taxAmt ? tr(t.taxAmt + ' (' + nf(inv.tax) + '%)', nf(c.taxAmt) + ' ' + cur) : ''}
              ${tr(t.grand, nf(c.grand) + ' ' + cur, true)}${c.paid ? tr(t.paid, nf(c.paid) + ' ' + cur) + tr(t.balance, nf(c.balance) + ' ' + cur) : ''}
            </div>
            ${inv.notes ? `<div style="margin-top:18px; padding:10px; background:#f8fafc; border-radius:8px; font-size:12px; color:#475569; white-space:pre-line;">${esc(inv.notes)}</div>` : ''}
            <div style="margin-top:46px; font-size:13px; color:#475569; text-align:${aE};">${t.pdfSign}<div style="margin-top:44px; border-top:1px solid #94a3b8; width:190px; display:inline-block;"></div></div>
            <div style="margin-top:34px; text-align:center; font-size:11px; color:#94a3b8;">SME Agri — ${t.pdfFooter}</div>
          </div>`;
      };

      $('exportInvPdfBtn').onclick = async () => {
        readFields();
        if (!inv.items.length) return alert(t.errEmpty);
        const btn = $('exportInvPdfBtn'), old = btn.innerText;
        btn.disabled = true; btn.innerText = '⏳ ...';
        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed; left:-10000px; top:0;';
        holder.innerHTML = buildInvoiceHtml();
        document.body.appendChild(holder);
        try {
          if (!window.html2canvas) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
          if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
          if (document.fonts && document.fonts.ready) await document.fonts.ready;
          const canvas = await window.html2canvas(holder.firstElementChild, { scale: 2, backgroundColor: '#ffffff' });
          const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
          const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
          const fullH = canvas.height * pageW / canvas.width;
          const img = canvas.toDataURL('image/jpeg', 0.92);
          if (fullH <= pageH) pdf.addImage(img, 'JPEG', 0, 0, pageW, fullH);
          else { // فاتورة طويلة: تقسيم على صفحات
            const pages = Math.ceil(fullH / pageH - 0.001);
            for (let i = 0; i < pages; i++) { if (i) pdf.addPage(); pdf.addImage(img, 'JPEG', 0, -i * pageH, pageW, fullH); }
          }

          const c = calc();
          const safeNum = inv.num.replace(/[^\w\-]+/g, '_');
          const fileName = (safeNum.toUpperCase().startsWith('INV-') ? safeNum : 'INV-' + safeNum) + '.pdf';
          const b64 = pdf.output('datauristring').split(',')[1];
          window.__lastInvoice = { id: fileName.replace('.pdf', ''), client: inv.client || t.defaultClient, total: String(Math.round(c.grand * 100) / 100), cur: currency() };

          let ok = true;
          if (window.Capacitor && window.saveNativeBase64File) ok = await window.saveNativeBase64File(b64, fileName);   // الأرشفة تتم عبر وحدة الإدارة
          else {
            pdf.save(fileName);
            if (window.smeArchiveInvoice) window.smeArchiveInvoice({ id: window.__lastInvoice.id, client: window.__lastInvoice.client, total: window.__lastInvoice.total, date: new Date().toLocaleDateString('ar-EG'), base64: b64 });
          }
          if (ok !== false) {
            lsSet('sme_inv_counter', String((+lsGet('sme_inv_counter', '0') || 0) + 1));
            if (inv.client) { const cl = getClients().filter(x => x.name !== inv.client); cl.unshift({ name: inv.client, phone: inv.cphone, addr: inv.caddr }); lsSet('sme_inv_clients', JSON.stringify(cl.slice(0, 100))); }
            inv = freshInv(); saveDraft(); renderModal();
          }
        } catch (err) {
          alert('⚠️ ' + (lang === 'ar' ? 'تعذر إنشاء الفاتورة: ' : 'Échec : ') + err.message + (lang === 'ar' ? '\n(يلزم اتصال بالإنترنت لأول تصدير)' : '\n(Connexion requise au premier export)'));
          btn.disabled = false; btn.innerText = old;
        } finally { holder.remove(); }
      };
    };

    invBtn.onclick = () => { renderModal(); modal.style.display = 'block'; };
  });
})();
