(function() {
  const onReady = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const STATE_KEY = 'farm_manager_v1';
  const HIST_KEY = 'sme_ai_history';
  const MODEL = 'gemini-2.5-flash';

  /* ---------------- قراءة بيانات المزرعة من التطبيق ---------------- */
  const readState = () => { try { return JSON.parse(lsGet(STATE_KEY, '{}')) || {}; } catch (e) { return {}; } };
  const readWeather = () => { try { const w = JSON.parse(lsGet(STATE_KEY + '_w', 'null')); return w && w.W ? w : null; } catch (e) { return null; } };
  const sum = (a, f) => (a || []).reduce((x, y) => x + (+f(y) || 0), 0);
  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const monthKey = () => new Date().toISOString().slice(0, 7);

  const farmFacts = () => {
    const S = readState(), cur = S.cur || 'MRU', unit = S.areaUnit || 'هكتار';
    const fields = S.fields || [], tx = S.tx || [], items = S.items || [], debts = S.debts || [], workers = S.workers || [];
    const mk = monthKey();
    const mt = tx.filter(t => String(t.date || '').startsWith(mk));
    const inc = sum(mt.filter(t => t.type === 'income'), t => t.amount);
    const exp = sum(mt.filter(t => t.type === 'expense'), t => t.amount);
    const low = items.filter(i => +i.qty <= +i.min);
    const open = fields.filter(f => f.status !== 'مكتمل');
    const t0 = new Date().toISOString().slice(0, 10);
    const harvest = open.filter(f => f.harvest).map(f => ({ f, d: Math.round((new Date(f.harvest) - new Date(t0)) / 864e5) })).sort((a, b) => a.d - b.d);
    const owed = (k) => sum(debts.filter(d => d.kind === k), d => (+d.amount || 0) - sum(d.pays || [], p => p.amount));
    return { S, cur, unit, fields, open, tx, items, low, workers, inc, exp, harvest, receivable: owed('receivable'), payable: owed('payable'), farm: S.farm || 'SME Agri', loc: S.loc, W: readWeather() };
  };

  const contextText = () => {
    const F = farmFacts(), L = [];
    L.push(`المزرعة: ${F.farm}${F.loc ? ' — ' + F.loc.name : ''}`);
    L.push(`الحقول (${F.fields.length}): ` + (F.fields.slice(0, 15).map(f => `${f.name} [${f.crop || '?'}، ${f.area || 0} ${F.unit}، حالة: ${f.status || '?'}${f.harvest ? '، حصاد: ' + f.harvest : ''}${f.irr ? '، ري: ' + f.irr : ''}]`).join('؛ ') || 'لا شيء'));
    L.push(`الشهر الحالي: إيرادات ${fmt(F.inc)} ${F.cur}، مصروفات ${fmt(F.exp)} ${F.cur}، صافي ${fmt(F.inc - F.exp)}`);
    L.push(`ديون لنا: ${fmt(F.receivable)}، ديون علينا: ${fmt(F.payable)}`);
    if (F.low.length) L.push('مخزون منخفض: ' + F.low.slice(0, 10).map(i => `${i.name} (${i.qty} ${i.unit || ''})`).join('، '));
    L.push(`عدد العمال الدائمين: ${F.workers.length}`);
    if (F.W && F.W.current) L.push(`الطقس الحالي: ${Math.round(F.W.current.temperature_2m)}°م، رياح ${Math.round(F.W.current.wind_speed_10m)} كم/س، رطوبة ${F.W.current.relative_humidity_2m}%`);
    return L.join('\n');
  };

  /* ---------------- قاعدة معرفة زراعية (تعمل بدون إنترنت) ---------------- */
  const KB = [
    { k: ['تسميد', 'سماد', 'npk', 'يوريا', 'fertili', 'engrais', 'تغذية'],
      ar: '🌱 <b>برنامج تسميد البطيخ والشمام (بالتنقيط):</b>\n• <b>التأسيس (أسبوع 1–2):</b> فوسفور عالٍ (ماب/حمض فوسفوريك) + هيوميك لتقوية الجذور.\n• <b>النمو الخضري (3–4):</b> NPK 20-20-20 مع قليل من اليوريا، وعناصر صغرى مخلبية (حديد، زنك).\n• <b>التزهير والعقد (5–6):</b> NPK عالي الفوسفور + نترات الكالسيوم + بورون. فصل الكالسيوم عن الفوسفات والكبريتات.\n• <b>التحجيم (7–9):</b> سلفات البوتاسيوم + مغنيسيوم، وإيقاف النيتروجين لرفع السكر.\n⚠️ حلّل التربة والماء أولاً؛ الكميات تُضبط حسب نتائج التحليل. (وحدة «الأسمدة» تحسب الجرعات لمساحتك)',
      fr: '🌱 <b>Fertilisation pastèque/melon (goutte-à-goutte) :</b>\n• <b>Installation (sem. 1–2) :</b> phosphore élevé + acides humiques.\n• <b>Croissance (3–4) :</b> NPK 20-20-20 + oligo-éléments chélatés.\n• <b>Floraison/nouaison (5–6) :</b> NPK riche en P, nitrate de calcium, bore. Ne jamais mélanger calcium avec sulfates/phosphates.\n• <b>Grossissement (7–9) :</b> sulfate de potasse + magnésium, stopper l’azote pour le sucre.' },
    { k: ['ري', 'سقي', 'ماء', 'تنقيط', 'irrig', 'arros', 'goutte'],
      ar: '💧 <b>الري في المناطق الحارة:</b>\n• الري بالتنقيط صباحاً مبكراً أو قبل الغروب، ونبضات قصيرة متكررة في الرمال.\n• زِد الكمية عند الحرارة فوق 36° وقلّلها تدريجياً عند نضج الثمار لرفع السكر ومنع التشقق.\n• تجنّب تذبذب الري قبل الحصاد (يسبب تشقق الثمار).\n• نظّف المرشحات أسبوعياً، واغسل الخطوط الفرعية بنهاياتها المفتوحة، وعالج الانسداد الكلسي بحمض أو كلور مخفف.\n• راقب ملوحة الماء (EC) فهي حرجة في وادي النهر.',
      fr: '💧 <b>Irrigation en zone chaude :</b>\n• Goutte-à-goutte tôt le matin ou fin d’après-midi, impulsions courtes en sol sableux.\n• Augmenter au-delà de 36 °C, réduire progressivement à maturité (sucre, éviter l’éclatement).\n• Nettoyer les filtres chaque semaine, purger les rampes, traiter le calcaire/chlore.\n• Surveiller la salinité (CE) de l’eau.' },
    { k: ['ذبابة', 'بيضاء', 'من ', 'حشر', 'آفات', 'آفة', 'عنكبوت', 'ثربس', 'دودة', 'pest', 'insect', 'ravageur', 'puceron', 'mouche'],
      ar: '🐛 <b>أهم آفات البطيخ والشمام:</b>\n• <b>الذبابة البيضاء والمنّ:</b> فحص أسفل الأوراق أسبوعياً، مصائد صفراء، تناوب المبيدات الجهازية بمجموعات مختلفة.\n• <b>العنكبوت الأحمر:</b> يزداد في الحر والغبار؛ رش ماء وكبريت ميكروني/أكاريسايد.\n• <b>الثربس:</b> مصائد زرقاء وفحص الأزهار.\n• <b>دودة الثمار والحفار:</b> طُعوم ومصائد فرمونية.\n✅ التزم بملصق المبيد وفترة ما قبل الحصاد، وبدّل مجموعات المبيدات لتجنب المقاومة.',
      fr: '🐛 <b>Principaux ravageurs :</b> aleurodes et pucerons (pièges jaunes, rotation des familles), acariens (soufre mouillable), thrips (pièges bleus), noctuelles. Respecter l’étiquette et le délai avant récolte.' },
    { k: ['بياض', 'مرض', 'مراض', 'امراض', 'فطر', 'ذبول', 'عفن', 'تبقع', 'maladie', 'mildiou', 'oïdium', 'fusar', 'pourriture', 'disease'],
      ar: '🍂 <b>أمراض شائعة:</b>\n• <b>البياض الدقيقي:</b> بقع بيضاء مسحوقية؛ كبريت ميكروني وتهوية ومنع الإفراط في النيتروجين.\n• <b>البياض الزغبي:</b> بقع صفراء تحتها زغب رمادي مع الرطوبة؛ مبيدات وقائية نحاسية وتقليل رطوبة الأوراق.\n• <b>ذبول الفيوزاريوم:</b> ذبول مفاجئ من التربة؛ تناوب زراعي (4 سنوات)، شتلات مطعّمة، تعقيم التربة.\n• <b>لفحة الساق الصمغية:</b> تقرّحات صمغية على الساق؛ تهوية ومعاملات وقائية.\n📌 صوّر العرض واكتب وصفه لأساعدك في التشخيص.',
      fr: '🍂 <b>Maladies :</b> oïdium (soufre, aération), mildiou (cuivre préventif), fusariose (rotation, plants greffés), chancre gommeux de la tige. Décrivez les symptômes pour un diagnostic.' },
    { k: ['حصاد', 'نضج', 'قطف', 'جني', 'récolte', 'maturité', 'harvest', 'ripe'],
      ar: '🍉 <b>علامات النضج:</b>\n• <b>البطيخ:</b> جفاف المحلاق المجاور للثمرة، تحوّل بقعة الملامسة للأرض إلى أصفر كريمي، وصوت أجوف عند النقر.\n• <b>الشمام الشبكي:</b> انفصال الثمرة بسهولة عن العنق (Slip)، وتحوّل لون الخلفية وظهور الرائحة العطرية.\n• اقطف صباحاً مبكراً وظلّل الثمار بعد القطف وتجنّب الرمي والصدمات.\n• أوقف الري 3–5 أيام قبل الحصاد لرفع السكر.',
      fr: '🍉 <b>Maturité :</b> pastèque : vrille sèche, tache de sol jaune crème, son creux. Melon : détachement facile du pédoncule, arôme. Récolter tôt le matin, éviter les chocs, stopper l’irrigation 3–5 jours avant.' },
    { k: ['ملوحة', 'ملح', 'قلوية', 'ph', 'تربة', 'رمل', 'salin', 'sol ', 'salinité'],
      ar: '🧂 <b>الملوحة والتربة:</b>\n• اقِس EC للماء والتربة؛ البطيخ متوسط التحمل (حتى ~2.5 dS/م دون خسارة كبيرة).\n• اغسل الأملاح بريّة إضافية دورية، وتجنّب الري الخفيف المتكرر بماء مالح.\n• أضف مادة عضوية وجبس زراعي عند ارتفاع الصوديوم.\n• التربة الرملية تحتاج تسميداً أكثر تكراراً وبجرعات أقل.',
      fr: '🧂 <b>Salinité :</b> mesurer la CE de l’eau et du sol (pastèque : tolérance moyenne), lessivage périodique, matière organique et gypse si sodicité, fertigation fractionnée en sol sableux.' },
    { k: ['تلقيح', 'نحل', 'عقد', 'تساقط', 'أزهار', 'pollin', 'abeille', 'nouaison'],
      ar: '🐝 <b>التلقيح والعقد:</b> ضع 3–5 خلايا نحل للهكتار عند بدء التزهير، وتجنّب رش المبيدات نهاراً أثناء نشاط النحل. تساقط الأزهار غالباً بسبب الحرارة الشديدة، نقص البورون/الكالسيوم، أو الإفراط في النيتروجين.',
      fr: '🐝 <b>Pollinisation :</b> 3–5 ruches/ha à la floraison, pas de traitement en journée. Chute de fleurs : chaleur, carence en bore/calcium, excès d’azote.' },
    { k: ['زراعة', 'مسافة', 'بذور', 'شتل', 'كثافة', 'تباعد', 'semis', 'plantation', 'densité', 'planting'],
      ar: '🌾 <b>الزراعة:</b> المسافة المعتادة للبطيخ 1.5–2 م بين الخطوط و0.6–0.9 م بين النباتات (≈ 7000–10000 نبتة/هكتار). الشمام أقرب قليلاً. استخدم الغطاء البلاستيكي (Mulch) لتقليل الأعشاب والتبخر، واحرص على تناوب المحاصيل.',
      fr: '🌾 <b>Plantation :</b> pastèque 1,5–2 m entre lignes × 0,6–0,9 m (≈ 7000–10000 plants/ha). Paillage plastique recommandé, rotation des cultures.' },
    { k: ['حرارة', 'حر', 'رياح', 'غبار', 'صقيع', 'chaleur', 'vent', 'canicule'],
      ar: '🔥 <b>الحر والرياح:</b> في الحرارة العالية زِد الري وظلّل الثمار بالأوراق، وتجنّب الرش الورقي وقت الظهيرة أو عند رياح فوق 25 كم/س. الرياح الرملية تُتلف الشتلات الصغيرة: استخدم مصدّات رياح أو أنفاق.',
      fr: '🔥 <b>Chaleur/vent :</b> irriguer davantage, ombrer les fruits, pas de traitement foliaire à midi ou vent > 25 km/h, brise-vent pour les jeunes plants.' },
    { k: ['تسويق', 'بيع', 'سعر', 'تخزين', 'تعبئة', 'تصدير', 'marché', 'vente', 'prix', 'export'],
      ar: '🛒 <b>التسويق:</b> سجّل كل شحنة وفاتورة فوراً، وحدّد سعر التعادل (تكلفة الكيلو) قبل التفاوض. اجمع العروض من أكثر من تاجر، ونسّق الحصاد مع موعد الشحن لتقليل الفاقد. استخدم وحدة «الفوترة» لإصدار فاتورة PDF للعميل.',
      fr: '🛒 <b>Commercialisation :</b> facturer chaque expédition, connaître le coût de revient/kg, comparer plusieurs acheteurs, synchroniser récolte et transport.' },
    { k: ['عمال', 'عمالة', 'راتب', 'إدارة', 'تكلف', 'ربح', 'نصيحة', 'main-d', 'gestion', 'coût', 'travailleur'],
      ar: '📊 <b>نصائح إدارية:</b> راقب تكلفة الهكتار (عمالة + أسمدة + ري + وقود) وقارنها بالإيراد المتوقع. سجّل الحضور بالبصمة وحدّد مهام يومية لكل فريق. افصل حساب المزرعة عن الحسابات الشخصية، وراجع الديون المستحقة أسبوعياً.',
      fr: '📊 <b>Gestion :</b> suivre le coût/ha (main-d’œuvre, engrais, eau, carburant), pointer les présences, séparer comptes personnels et ferme, relancer les créances chaque semaine.' }
  ];

  /* ---------------- موسوعة الأسمدة والمكملات والمحاصيل ---------------- */
  KB.push(
    { k: ['يوريا', 'نترات الأمونيوم', 'كبريتات الأمونيوم', 'آزوت', 'ازوت', 'نيتروجين', 'urée', 'azote', 'ammonitrate', 'nitrogen'],
      ar: '🟦 <b>الأسمدة النيتروجينية (N):</b>\n• <b>اليوريا 46%:</b> الأرخص والأعلى تركيزاً، ممتازة للتنقيط، تتطاير في الحر إن نُثرت دون ري → اخلطها بالتربة أو احقنها.\n• <b>نترات الأمونيوم 33.5%:</b> نصفها نترات (سريعة) ونصفها أمونيوم؛ مناسبة للتسميد السطحي.\n• <b>كبريتات الأمونيوم 21% (+24% كبريت):</b> تحمّض التربة قليلاً، مفيدة للتربة القلوية والرملية.\n• <b>نترات الكالسيوم 15.5% (+26% CaO):</b> للتزهير والعقد وجودة الثمار، لا تُخلط مع الفوسفات والكبريتات.\n• <b>نترات البوتاسيوم 13-0-46:</b> نيتروجين نتراتي + بوتاسيوم بلا كلور.\n⚠️ الإفراط في النيتروجين يزيد النمو الخضري ويؤخر النضج ويخفض السكر.' },
    { k: ['ماب', 'map', 'dap', 'فوسفور', 'فوسفات', 'سوبر', 'tsp', 'phosphore', 'phosphat'],
      ar: '🟧 <b>الأسمدة الفوسفورية (P₂O₅):</b>\n• <b>MAP 12-61-0:</b> الأفضل للتنقيط (يذوب جيداً ويخفض pH قليلاً).\n• <b>DAP 18-46-0:</b> للتسميد الأساسي بالنثر قبل الزراعة.\n• <b>سوبر فوسفات ثلاثي TSP 46%:</b> بدون نيتروجين، للتأسيس.\n• <b>حمض الفوسفوريك:</b> يخفض pH الماء وينظّف خطوط التنقيط.\nالفوسفور قليل الحركة: ضعه قرب الجذور (أسبوع 0–4). في التربة الكلسية يتثبّت؛ أضف مادة عضوية وحمّض ماء الري قليلاً.' },
    { k: ['بوتاسيوم', 'بوتاس', 'سلفات البوتاسيوم', 'نترات البوتاس', 'mkp', 'potasse', 'potassium', 'sop', 'mop'],
      ar: '🟪 <b>الأسمدة البوتاسية (K₂O):</b>\n• <b>سلفات البوتاسيوم 0-0-50 (+18% كبريت):</b> الأفضل لمحاصيل الفاكهة والمياه المالحة (بلا كلور).\n• <b>نترات البوتاسيوم 13-0-46:</b> للنمو والعقد.\n• <b>MKP 0-52-34:</b> للتزهير والعقد (فوسفور + بوتاسيوم).\n• <b>كلوريد البوتاسيوم 0-0-60:</b> أرخص، يصلح للحبوب والتربة غير المالحة، ويُتجنَّب مع البطيخ والشمام والملوحة.\nالبوتاسيوم يرفع السكر واللون والحجم وتحمّل الحر؛ ركّز عليه من التزهير حتى التحجيم.' },
    { k: ['كالسيوم', 'مغنيسيوم', 'كبريت', 'ثانوية', 'calcium', 'magnésium', 'magnesium', 'soufre', 'sulf'],
      ar: '🟩 <b>العناصر الثانوية:</b>\n• <b>الكالسيوم:</b> نترات الكالسيوم أو كلوريد الكالسيوم رشاً (0.3–0.5%) عند العقد لمنع عفن الطرف الزهري وتحسين التخزين.\n• <b>المغنيسيوم:</b> كبريتات المغنيسيوم (16% MgO) 20–40 كغ/هكتار في النمو الخضري؛ علامة نقصه اصفرار بين العروق في الأوراق القديمة.\n• <b>الكبريت:</b> يأتي من كبريتات الأمونيوم والبوتاسيوم والجبس؛ مهم للبصل والأزهار.' },
    { k: ['حديد', 'زنك', 'منغنيز', 'بورون', 'نحاس', 'موليبدينوم', 'مخلبي', 'eddha', 'chélat', 'oligo', 'micro', 'عناصر صغرى', 'عناصر دقيقة'],
      ar: '🔬 <b>العناصر الصغرى:</b>\n• <b>الحديد Fe-EDDHA (6%):</b> 1–2 كغ/هكتار للتربة الكلسية والرملية؛ الأعراض: اصفرار الأوراق الحديثة مع بقاء العروق خضراء.\n• <b>الزنك Zn-EDTA (14%):</b> ~1 كغ/هكتار؛ الأعراض: تقزّم وأوراق صغيرة.\n• <b>البورون (سولوبور 20.5%):</b> 1–2 كغ/هكتار موزعة على مرحلتين قبل/عند التزهير؛ الأعراض: تشوّه الأزهار وضعف العقد. الجرعة الزائدة سامة.\n• <b>المنغنيز والنحاس:</b> رشاً عند ظهور النقص أو بخلطات جاهزة.\n✅ الأفضل الرش الورقي صباحاً أو عصراً وليس وقت الظهيرة.' },
    { k: ['هيوميك', 'فولفيك', 'طحالب', 'أحماض أمينية', 'احماض امينية', 'منشط', 'محفز', 'بيوستيمولانت', 'humic', 'algue', 'biostimul', 'amino', 'seaweed', 'مكملات'],
      ar: '✨ <b>المكملات والمنشطات الحيوية:</b>\n• <b>هيوميك/فولفيك:</b> 5–10 لتر/هكتار 2–3 مرات (بعد الزراعة، النمو، التزهير)؛ يحسّن امتصاص العناصر وبنية التربة الرملية.\n• <b>مستخلص الطحالب:</b> 2–3 لتر/هكتار عند التزهير والإجهاد الحراري.\n• <b>الأحماض الأمينية:</b> 2 لتر/هكتار قبل/بعد موجات الحر أو الرش بالمبيدات لتقليل الإجهاد.\n• <b>الميكوريزا والبكتيريا المثبّتة:</b> مع الزراعة لتقوية الجذور.\n⚠️ هي مكمّلات تُحسِّن الاستفادة ولا تعوّض التسميد الأساسي.' },
    { k: ['عضوي', 'كمبوست', 'روث', 'سماد بلدي', 'مخلفات', 'compost', 'fumier', 'organique', 'biochar', 'manure'],
      ar: '🌿 <b>التسميد العضوي:</b> أضف 10–20 طن/هكتار من الكمبوست أو روث الماشية المتحلل قبل الزراعة بـ 2–4 أسابيع (التربة الرملية تحتاج الحد الأعلى). يرفع احتفاظ التربة بالماء والعناصر ويخفف أثر الملوحة. تجنّب الروث الطازج (حرق الجذور وبذور أعشاب وأمراض). الكمبوست يُعوّض جزءاً من الفوسفور والبوتاسيوم.' },
    { k: ['نقص', 'أعراض', 'اصفرار', 'احمرار', 'بقع', 'تقزم', 'deficiency', 'carence', 'jaunissement', 'symptom', 'symptôme'],
      ar: '🩺 <b>أعراض نقص العناصر:</b>\n• <b>N:</b> اصفرار عام يبدأ بالأوراق القديمة، نمو ضعيف.\n• <b>P:</b> لون بنفسجي/داكن، جذور ضعيفة.\n• <b>K:</b> حروق على حواف الأوراق القديمة، ثمار صغيرة قليلة السكر.\n• <b>Ca:</b> عفن الطرف الزهري، حروق الأطراف الحديثة.\n• <b>Mg:</b> اصفرار بين العروق في الأوراق القديمة.\n• <b>Fe:</b> اصفرار الأوراق الحديثة والعروق خضراء.\n• <b>Zn:</b> أوراق صغيرة وسلاميات قصيرة.\n• <b>B:</b> تشقق الساق/الثمار، ضعف العقد.\n📌 الاصفرار قد يكون أيضاً من غرق التربة أو ملوحة أو نيماتودا؛ أكّد بتحليل ورقي/تربة.' },
    { k: ['توافق', 'تخلط', 'يخلط', 'ترسب', 'ترسّب', 'incompat', 'mélange', 'mix'],
      ar: '⚗️ <b>قواعد الخلط في الخزان:</b>\n• ❌ نترات الكالسيوم + (كبريتات/فوسفات) = ترسّب.\n• ❌ الحديد المخلبي مع الفوسفات عالي التركيز أو الأحماض القوية.\n• ✅ يوريا + نترات البوتاسيوم + MAP تُخلط معاً بتركيز معتدل.\n• اجعل الكالسيوم في خزان (A) وبقية العناصر في خزان (B).\n• اختبر الخلط في دلو صغير: العكارة أو الراسب = لا تحقنه.' },
    { k: ['كم كغ', 'كم كيلو', 'حساب', 'تحويل', 'تركيز', 'نسبة', 'npk', 'conversion', 'combien de kg'],
      ar: '🧮 <b>حساب كمية السماد من وحدات العنصر:</b>\nكمية السماد (كغ) = وحدات العنصر المطلوبة ÷ نسبة العنصر في السماد.\nمثال: 120 كغ آزوت ÷ 0.46 (يوريا) = <b>261 كغ يوريا/هكتار</b>.\n• 60 كغ P₂O₅ ÷ 0.61 (MAP) = 98 كغ.\n• 180 كغ K₂O ÷ 0.50 (سلفات البوتاسيوم) = 360 كغ.\nاستعمل «مخطط التسميد» لتوزيع ذلك على مراحل وللحقل كاملاً.' },
    { k: ['جبس', 'كبريت زراعي', 'حموضة', 'قلوية', 'صوديوم', 'ph التربة', 'gypse', 'amendement', 'gypsum', 'sodic'],
      ar: '🧱 <b>تحسين التربة:</b> التربة المالحة/الصودية: جبس زراعي 1–3 طن/هكتار مع غسيل وتصريف جيد. التربة القلوية (pH>8): كبريت زراعي أو أسمدة محمّضة (MAP، كبريتات الأمونيوم)، وحمض في ماء الري. التربة الحمضية: كلس زراعي. حلّل التربة (pH, EC, ESP) قبل أي معالجة.' },
    { k: ['حقن', 'ec الماء', 'جودة الماء', 'انسداد', 'fertigation', 'qualité de l’eau', 'bicarbonate'],
      ar: '💧 <b>التسميد مع الري (Fertigation):</b> احقن السماد في الثلث الأوسط من زمن الري (لا أول ولا آخر)، واغسل الخط بماء نظيف 10–15 دقيقة بعد الحقن. EC ماء الري + السماد يجب ألا يتجاوز ~2.5 dS/م للبطيخ. الماء الكلسي (بيكربونات عالية): احقن حمض الفوسفوريك/النيتريك لخفض pH إلى 6–6.5 وتجنّب انسداد النقاطات.' },
    { k: ['أصناف', 'صنف', 'كريمسون', 'شوغر', 'variété', 'variety', 'cultivar'],
      ar: '🍉 <b>أصناف شائعة:</b> البطيخ الأحمر: Crimson Sweet، Sugar Baby (صغير مبكر)، Charleston Gray، وهجائن بلا بذور. الشمام: Galia، Charentais، Cantaloupe (Athena/Hy-Mark)، Honeydew. اختر حسب قدرة النقل والتخزين وطلب السوق، وتأكد من تحمّلها للفيوزاريوم والبياض في أصناف الموسم.' },
    { k: ['طماطم', 'بندورة', 'tomate', 'tomato'],
      ar: '🍅 <b>الطماطم:</b> زراعة بالشتل، 40–50 سم بين النباتات و1.2 م بين الخطوط، إنتاج 40–80 طن/هكتار. تحتاج كالسيوماً منتظماً وبوتاسيوماً عالياً وتدعيماً. الحرارة فوق 35° تُسقط الأزهار؛ أهم المشاكل: الذبابة البيضاء (التفاف الأوراق)، الدودة (Tuta absoluta)، اللفحة المتأخرة، عفن الطرف الزهري. استعمل مخطط التسميد للطماطم.' },
    { k: ['بصل', 'oignon', 'onion'],
      ar: '🧅 <b>البصل:</b> بذور أو شتلات، كثافة 400–600 ألف نبتة/هكتار، دورة 4–5 أشهر. يحتاج كبريتاً وبوتاسيوماً ويتضرر من الأعشاب ومن زيادة الآزوت المتأخر. أوقف الري قبل الحصاد بـ 10–14 يوماً وجفّف البصل قبل التخزين. الأمراض: العفن الأبيض، تبقع الأوراق، والذبابة والثربس.' },
    { k: ['بطاطس', 'بطاطا', 'pomme de terre', 'patate', 'potato'],
      ar: '🥔 <b>البطاطس:</b> درنات بذرية معتمدة، 25–30 سم بين الدرنات، إنتاج 25–45 طن/هكتار. تحتاج ري منتظماً وتربة خفيفة وبوتاسيوماً عالياً. تُخفَّض الحرارة المثلى للدرنات 15–20°م؛ الحر الشديد يوقف التدرّن. أمراض: اللفحة، الذبول البكتيري، الجرب.' },
    { k: ['فلفل', 'خيار', 'كوسة', 'باذنجان', 'poivron', 'concombre', 'courgette', 'aubergine', 'pepper', 'cucumber'],
      ar: '🌶️ <b>الفلفل/الخيار/الكوسة/الباذنجان:</b> محاصيل ثمرية تحتاج ريّاً منتظماً وتسميداً أسبوعياً بالتنقيط (N:K ≈ 1:1.5 عند الإثمار) وكالسيوماً. الحر فوق 35° يخفض العقد. راقب الذبابة البيضاء والعنكبوت والبياض الدقيقي في الخيار والكوسة. استخدم المخطط لحساب الجرعات.' },
    { k: ['أرز', 'ارز', 'ذرة', 'قمح', 'riz', 'maïs', 'blé', 'rice', 'maize', 'wheat', 'حبوب'],
      ar: '🌾 <b>الحبوب (أرز/ذرة/قمح):</b> يُجزَّأ الآزوت على 3–4 دفعات (التأسيس، التفريع، الاستطالة، قبل الإسبال). الأرز المروي في الوادي: DAP أساسي + يوريا على دفعات مع التحكم في مستوى الماء؛ ويحتاج زنكاً (كبريتات الزنك 10–20 كغ/هكتار) عند ظهور اصفرار البادرات. الذرة تحتاج آزوتاً عالياً وري منتظم عند التزهير.' },
    { k: ['موعد الزراعة', 'متى أزرع', 'تقويم', 'موسم', 'calendrier', 'quand semer', 'season', 'planting date'],
      ar: '📅 <b>مواعيد الزراعة العامة (وادي النهر):</b> الموسم البارد (نوفمبر–فبراير) هو الأنسب للبطيخ والشمام والطماطم والبصل والجزر والبطاطس، والموسم الحار (فبراير–يونيو) للبطيخ المبكر مع الحذر من الحرارة فوق 40° أثناء التزهير. اضبط الموعد حسب آخر توقعات الحرارة وموعد السوق، وحدّد حصادك بحيث لا يصادف ذروة الحر والرياح.' }
  );

  /* ---------------- مخطط التسميد بالهكتار ---------------- */
  const PROD = {
    urea: { n: 'اليوريا (46-0-0)', N: .46 }, an: { n: 'نترات الأمونيوم (33.5-0-0)', N: .335 }, as: { n: 'كبريتات الأمونيوم (21-0-0 + 24% S)', N: .21 }, cn: { n: 'نترات الكالسيوم (15.5-0-0 + 26% CaO)', N: .155 },
    map: { n: 'MAP (12-61-0)', N: .12, P: .61 }, dap: { n: 'DAP (18-46-0)', N: .18, P: .46 },
    knp: { n: 'نترات البوتاسيوم (13-0-46)', N: .13, K: .46 }, sop: { n: 'سلفات البوتاسيوم (0-0-50)', K: .50 }, mop: { n: 'كلوريد البوتاسيوم (0-0-60)', K: .60 }
  };
  const PROFILES = {
    fruit: { stages: ['التأسيس (قبل الزراعة)', 'الانتعاش والتجذير', 'النمو الخضري', 'التزهير والعقد', 'تكوين وتحجيم الثمار', 'النضج والحصاد'],
      N: [10, 10, 30, 25, 20, 5], P: [40, 20, 15, 15, 10, 0], K: [5, 5, 10, 25, 35, 20], dur: [0, .15, .25, .2, .25, .15] },
    root: { stages: ['التأسيس (قبل الزراعة)', 'الانتعاش والتجذير', 'النمو الخضري', 'تكوين الدرنات/الأبصال/الجذور', 'التضخيم', 'النضج'],
      N: [15, 15, 30, 25, 15, 0], P: [50, 20, 15, 10, 5, 0], K: [10, 5, 15, 30, 30, 10], dur: [0, .15, .25, .25, .25, .10] },
    cereal: { stages: ['التأسيس (قبل الزراعة)', 'التفريع', 'الاستطالة', 'الإسبال والتزهير', 'امتلاء الحبوب', 'النضج'],
      N: [20, 30, 30, 15, 5, 0], P: [60, 25, 15, 0, 0, 0], K: [40, 20, 20, 10, 10, 0], dur: [0, .2, .25, .2, .25, .10] }
  };
  const CROPS = {
    watermelon: { ar: 'بطيخ أحمر', al: ['بطيخ', 'pastèque', 'watermelon'], weeks: 12, prof: 'fruit', N: 120, P: 70, K: 180 },
    melon: { ar: 'شمام', al: ['شمام', 'melon', 'cantaloup'], weeks: 12, prof: 'fruit', N: 140, P: 80, K: 220 },
    tomato: { ar: 'طماطم', al: ['طماطم', 'بندورة', 'tomate', 'tomato'], weeks: 18, prof: 'fruit', N: 230, P: 110, K: 330 },
    pepper: { ar: 'فلفل', al: ['فلفل', 'poivron', 'pepper'], weeks: 20, prof: 'fruit', N: 190, P: 90, K: 260 },
    cucumber: { ar: 'خيار', al: ['خيار', 'concombre', 'cucumber'], weeks: 12, prof: 'fruit', N: 150, P: 80, K: 200 },
    squash: { ar: 'كوسة', al: ['كوسة', 'courgette', 'squash'], weeks: 10, prof: 'fruit', N: 120, P: 70, K: 150 },
    onion: { ar: 'بصل', al: ['بصل', 'oignon', 'onion'], weeks: 20, prof: 'root', N: 130, P: 70, K: 130 },
    potato: { ar: 'بطاطس', al: ['بطاطس', 'بطاطا', 'pomme de terre', 'potato'], weeks: 14, prof: 'root', N: 200, P: 110, K: 280 },
    carrot: { ar: 'جزر', al: ['جزر', 'carotte', 'carrot'], weeks: 14, prof: 'root', N: 110, P: 70, K: 170 },
    cabbage: { ar: 'ملفوف', al: ['ملفوف', 'كرنب', 'chou', 'cabbage'], weeks: 12, prof: 'root', N: 200, P: 80, K: 200 },
    sweetpotato: { ar: 'بطاطا حلوة', al: ['بطاطا حلوة', 'patate douce', 'sweet potato'], weeks: 16, prof: 'root', N: 70, P: 50, K: 180 },
    maize: { ar: 'ذرة', al: ['ذرة', 'maïs', 'maize', 'corn'], weeks: 16, prof: 'cereal', N: 200, P: 80, K: 110 },
    rice: { ar: 'أرز', al: ['أرز', 'ارز', 'riz', 'rice'], weeks: 18, prof: 'cereal', N: 130, P: 50, K: 60 },
    wheat: { ar: 'قمح', al: ['قمح', 'blé', 'wheat'], weeks: 18, prof: 'cereal', N: 140, P: 60, K: 60 }
  };
  const findCrop = (txt) => {
    const t = String(txt || '').toLowerCase(); let best = null, bl = 0;
    Object.entries(CROPS).forEach(([k, c]) => c.al.forEach(a => { if (t.includes(a) && a.length > bl) { best = k; bl = a.length; } }));
    return best;
  };
  const toHa = (area, unit) => area * ({ 'هكتار': 10000, 'فدان': 4200, 'دونم': 1000, 'م²': 1 }[unit] || 10000) / 10000;

  const planStage = (idx, t, prof, saline, devis) => {
    const out = []; let N = t.N, P = t.P, K = t.K;
    if (P > 0.5) { const pr = (idx === 0 && !devis) ? 'dap' : 'map'; const kg = P / PROD[pr].P; out.push([pr, kg]); N -= kg * PROD[pr].N; }
    if (K > 0.5) {
      if (idx >= 1 && idx <= 3 && prof !== 'cereal') {
        const k1 = Math.min(K / PROD.knp.K, Math.max(0, t.N * 0.6) / PROD.knp.N);
        if (k1 > 0.5) { out.push(['knp', k1]); N -= k1 * PROD.knp.N; K -= k1 * PROD.knp.K; }
      }
      if (K > 0.5) { const pr = (prof === 'cereal' && !saline && !devis) ? 'mop' : 'sop'; out.push([pr, K / PROD[pr].K]); }
    }
    if (N > 0.5 && prof !== 'cereal' && (idx === 3 || idx === 4)) { const kg = Math.min(N * 0.5 / PROD.cn.N, 100); out.push(['cn', kg]); N -= kg * PROD.cn.N; }
    if (N > 0.5) { const pr = devis ? ((idx <= 1 || prof === 'cereal') ? 'as' : 'an') : 'urea'; out.push([pr, N / PROD[pr].N]); }
    return out;
  };

  const buildPlan = (cropKey, areaHa, opt) => {
    const c = CROPS[cropKey], pf = PROFILES[c.prof];
    const sandy = opt.soil === 'sandy', clay = opt.soil === 'clay';
    const fN = sandy ? 1.1 : clay ? 0.95 : 1, fK = sandy ? 1.1 : 1;
    const tot = { N: c.N * fN, P: c.P, K: c.K * fK };
    // توزيع الأسابيع على المراحل
    const wk = pf.dur.map(d => Math.round(d * c.weeks));
    const diff = c.weeks - wk.reduce((a, b) => a + b, 0); wk[wk.length - 1] += diff;
    let cur = 0;
    const stages = pf.stages.map((name, i) => {
      const w = wk[i], from = i === 0 ? 0 : cur + 1, to = i === 0 ? 0 : cur + w; if (i > 0) cur += w;
      const target = { N: tot.N * pf.N[i] / 100, P: tot.P * pf.P[i] / 100, K: tot.K * pf.K[i] / 100 };
      const items = planStage(i, target, c.prof, opt.saline, opt.devis).map(([p, kg]) => {
        const doses = i === 0 ? 1 : (opt.irr === 'drip' ? Math.max(1, w) : Math.max(1, Math.ceil(w / 2)));
        return { p, kg, doses, per: kg / doses };
      });
      return { name, from, to, w, target, items };
    }).filter(s => s.items.length || s.w > 0);
    const totals = {}; stages.forEach(s => s.items.forEach(it => { totals[it.p] = (totals[it.p] || 0) + it.kg; }));
    // المكملات
    const supp = [];
    if (c.prof === 'fruit') {
      supp.push(['كبريتات المغنيسيوم (16% MgO)', 40, 'كغ', 'مرحلتان: النمو الخضري والتزهير (20 كغ لكل منهما)']);
      supp.push(['البورون – سولوبور (20.5% B)', 1.5, 'كغ', 'قبل التزهير (0.75) وعند العقد (0.75) رشاً أو تسميداً']);
      supp.push(['نترات الكالسيوم رشاً/تسميداً', 6, 'كغ', 'إضافة لما في البرنامج: 3 كغ مرتين عند بداية العقد']);
          } else if (c.prof === 'root') {
      supp.push(['كبريتات المغنيسيوم (16% MgO)', 30, 'كغ', 'مرحلة النمو الخضري']);
      supp.push(['البورون – سولوبور', 1.5, 'كغ', 'عند بداية تكوين الدرنات/الأبصال']);
      supp.push(['الكبريت (جبس زراعي أو كبريتات)', 60, 'كغ S', 'مع التأسيس (مهم للبصل)']);
    } else {
            supp.push(['كبريتات الأمونيوم (بديل جزئي لليوريا)', 100, 'كغ', 'إن كانت التربة قلوية أو ناقصة الكبريت']);
    }
    if (c.prof === 'fruit') supp.push(['زنك Zn-EDTA (14%)', 1, 'كغ', 'مرحلة التجذير والنمو الخضري']);
    if (c.prof === 'cereal') supp.push(['كبريتات الزنك (21% Zn)', 15, 'كغ', 'مع التأسيس، خاصة للأرز في تربة الوادي']);
    supp.push(['الحديد المخلبي Fe-EDDHA (6%)', sandy || opt.alkaline ? 2 : 1, 'كغ', 'تربة رملية/كلسية: مرحلة التجذير والتزهير']);
    supp.push(['هيوميك أسيد سائل (12%)', 10, 'لتر', '3 مرات: بعد الزراعة، النمو الخضري، التزهير (3.3 لتر لكل مرة)']);
    supp.push(['مستخلص الطحالب / أحماض أمينية', 4, 'لتر', 'مرتان رشاً: التزهير، وقبل/بعد موجات الحر']);
    supp.push(['النحاس (Cuivre) – من قائمة DEVIS', 1, 'كغ', 'رشاً 0.5 كغ مرتين: النمو الخضري وقبل التزهير (وقائي للفطريات)']);
    supp.push(['حمض الكبريتيك / منظم pH – من قائمة DEVIS', 0, '', 'لضبط pH ماء الري عند 6–6.5 ومنع انسداد النقاطات (حسب قياس الماء)']);
    const base = [];
    base.push((opt.devis?'وضع قائمة DEVIS 2026: البرنامج يستعمل فقط MAP، نترات البوتاسيوم، سلفات البوتاسيوم، نترات الأمونيوم 33%، كبريتات الأمونيوم 21%، نترات الكالسيوم. الزنك والحديد غير مدرجَين في القائمة.':'يمكنك اختيار «أسمدة قائمة DEVIS فقط» من اللوحة لبرنامج يعتمد على ما اشتريته.'));
    base.push(`مادة عضوية متحللة: ${sandy ? '15–20' : '10–15'} طن/هكتار قبل الزراعة بـ 2–4 أسابيع.`);
    if (opt.saline) base.push('الملوحة مرتفعة: تجنّب كلوريد البوتاسيوم، أضف جبساً زراعياً 1–2 طن/هكتار، وأعطِ ريّة غسيل دورية.');
    if (opt.alkaline) base.push('التربة/الماء قلوي: فضّل MAP وكبريتات الأمونيوم وحمّض ماء الري إلى pH 6–6.5.');
    return { key: cropKey, c, area: areaHa, opt, tot, stages, totals, supp, base };
  };

  const f1 = (n) => n >= 100 ? Math.round(n).toLocaleString('en-US') : n >= 10 ? n.toFixed(0) : n.toFixed(1);
  const renderPlan = (pl) => {
    const A = pl.area, c = pl.c, o = pl.opt;
    const irrTxt = o.irr === 'drip' ? 'تنقيط (دفعات أسبوعية)' : 'رش/غمر (دفعات كل أسبوعين)';
    const soilTxt = { sandy: 'رملية', loam: 'طميية', clay: 'طينية' }[o.soil];
    let h = `<div style="font-weight:bold; color:#1a3622; font-size:14px;">📅 برنامج تسميد ${esc(c.ar)} — ${f1(A)} هكتار</div>
      <div style="font-size:11.5px; color:#475569; margin:3px 0 6px;">الدورة ~${c.weeks} أسبوعاً • تربة ${soilTxt} • ري ${irrTxt}${o.saline ? ' • ملوحة مرتفعة' : ''}</div>
      <div style="background:#ecfdf5; border-radius:8px; padding:6px 8px; font-size:12px;">🎯 الاحتياج الكلي: <b>N ${f1(pl.tot.N)}</b> • <b>P₂O₅ ${f1(pl.tot.P)}</b> • <b>K₂O ${f1(pl.tot.K)}</b> كغ/هكتار → للمساحة: N ${f1(pl.tot.N * A)} / P ${f1(pl.tot.P * A)} / K ${f1(pl.tot.K * A)} كغ</div>`;
    pl.base.forEach(b => { h += `<div style="font-size:12px; margin-top:4px;">🌿 ${esc(b)}</div>`; });
    pl.stages.forEach((s, i) => {
      h += `<div style="margin-top:8px; border-top:1px dashed #cbd5e1; padding-top:6px;"><b>${i + 1}) ${esc(s.name)}</b> <span style="color:#64748b; font-size:11px;">${s.w ? `(الأسبوع ${s.from}${s.to !== s.from ? '–' + s.to : ''})` : ''}</span>
        <div style="font-size:11px; color:#64748b;">هدف المرحلة: N ${f1(s.target.N)} / P ${f1(s.target.P)} / K ${f1(s.target.K)} كغ/هكتار</div>`;
      if (!s.items.length) h += '<div style="font-size:12px; color:#64748b;">• بدون تسميد في هذه المرحلة — ريّ فقط.</div>';
      s.items.forEach(it => {
        h += `<div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; padding:2px 0;"><span>• ${esc(PROD[it.p].n)}</span><span style="white-space:nowrap;"><b>${f1(it.kg)}</b> كغ/هـ${it.doses > 1 ? ` (${f1(it.per)} × ${it.doses} دفعة)` : ''} ← <b style="color:#b45309;">${f1(it.kg * A)} كغ</b></span></div>`;
      });
      h += '</div>';
    });
    h += `<div style="margin-top:10px; background:#fef3c7; border-radius:8px; padding:8px;"><b>🧾 مجموع المشتريات لـ ${f1(A)} هكتار:</b>`;
    Object.entries(pl.totals).forEach(([p, kg]) => { h += `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>${esc(PROD[p].n)}</span><b>${f1(kg * A)} كغ (${f1(kg)} كغ/هـ)</b></div>`; });
    h += '</div>';
    h += `<div style="margin-top:8px; background:#eef2ff; border-radius:8px; padding:8px;"><b>✨ المكملات والعناصر الصغرى:</b>`;
    pl.supp.forEach(s => { h += `<div style="font-size:12px; padding:2px 0;">• ${esc(s[0])}: <b>${f1(s[1])} ${s[2]}/هـ</b> ← ${f1(s[1] * A)} ${s[2]} <span style="color:#64748b;">— ${esc(s[3])}</span></div>`; });
    h += '</div>';
    h += '<div style="margin-top:8px; font-size:11px; color:#92400e;">⚠️ أرقام استرشادية عامة لتغطية الاحتياج المعتاد؛ عدّلها حسب تحليل التربة والماء والنسيج الورقي والإنتاج المستهدف. لا تخلط نترات الكالسيوم مع الفوسفات والكبريتات في خزان واحد.</div>';
    return h;
  };
  const planText = (pl) => {
    const A = pl.area; let t = `برنامج تسميد ${pl.c.ar} — ${f1(A)} هكتار (${pl.c.weeks} أسبوع)\nالاحتياج: N ${f1(pl.tot.N)} / P ${f1(pl.tot.P)} / K ${f1(pl.tot.K)} كغ/هـ\n`;
    pl.stages.forEach((s, i) => { t += `\n${i + 1}) ${s.name} ${s.w ? '(أسبوع ' + s.from + '–' + s.to + ')' : ''}\n`; s.items.forEach(it => { t += `  - ${PROD[it.p].n}: ${f1(it.kg)} كغ/هـ = ${f1(it.kg * A)} كغ${it.doses > 1 ? ' (' + it.doses + ' دفعات)' : ''}\n`; }); });
    t += '\nالمشتريات الكلية:\n'; Object.entries(pl.totals).forEach(([p, kg]) => { t += `  - ${PROD[p].n}: ${f1(kg * A)} كغ\n`; });
    t += '\nالمكملات:\n'; pl.supp.forEach(s => { t += `  - ${s[0]}: ${f1(s[1] * A)} ${s[2]} (${s[3]})\n`; });
    return t;
  };
  const planFromText = (q) => {
    if (!/تسميد|تسمين|سماد|تغذية|برنامج|fertilis|engrais|plan de/i.test(q)) return null;
    const ck = findCrop(q); if (!ck) return null;
    if (!/برنامج|خطة|مخطط|جدول|plan|programme|حساب|احسب/i.test(q) && !/\d\s*(هكتار|ha|hectare)/i.test(q)) return null;
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(هكتار|ha|hectare|فدان|دونم)/i);
    let a = m ? parseFloat(m[1].replace(',', '.')) : 1; const u = m ? m[2] : 'هكتار';
    if (/فدان/.test(u)) a = a * 4200 / 10000; else if (/دونم/.test(u)) a = a * 1000 / 10000;
    const pl = buildPlan(ck, a, { soil: /طين/.test(q) ? 'clay' : /طمي/.test(q) ? 'loam' : 'sandy', irr: /رش|غمر|aspersion|submersion/.test(q) ? 'flood' : 'drip', saline: /ملوح|salin/.test(q), alkaline: /قلوي|كلسي|alcalin/.test(q), devis: /devis|ديفي|القائمة|قائمة الشراء/i.test(q) });
    return { pl, html: (m ? '' : '<i style="color:#64748b">لم تُذكر مساحة فحسبتُ لهكتار واحد؛ اكتب مثلاً «برنامج تسميد بطيخ 5 هكتار».</i>') + renderPlan(pl) };
  };

  const isFrench = (q) => /[éèêàçùôîï]|\b(quel|quelle|comment|pour|les|des|est|mes|ma|mon|combien|bonjour|je|vous)\b/i.test(q);

  const dataAnswer = (q, fr) => {
    const F = farmFacts(), t = q.toLowerCase();
    const money = (n) => `${fmt(n)} ${F.cur}`;
    if (/ملخص|حالة المزرعة|وضع|résumé|bilan|état/.test(t)) {
      const nextH = F.harvest[0];
      return fr
        ? `📋 <b>Résumé de ${esc(F.farm)} :</b>\n• ${F.fields.length} champ(s), ${fmt(sum(F.fields, f => f.area))} ${esc(F.unit)}\n• Ce mois : revenus ${money(F.inc)}, dépenses ${money(F.exp)}, net <b>${money(F.inc - F.exp)}</b>\n• Créances ${money(F.receivable)} / dettes ${money(F.payable)}\n• Stocks bas : ${F.low.length}`
        : `📋 <b>ملخص ${esc(F.farm)}:</b>\n• ${F.fields.length} حقل بمساحة ${fmt(sum(F.fields, f => f.area))} ${esc(F.unit)} (${F.open.length} نشط)\n• هذا الشهر: إيرادات ${money(F.inc)}، مصروفات ${money(F.exp)}، الصافي <b>${money(F.inc - F.exp)}</b>\n• ديون لنا ${money(F.receivable)} | ديون علينا ${money(F.payable)}\n• أصناف مخزون منخفضة: ${F.low.length}${nextH ? `\n• أقرب حصاد: ${esc(nextH.f.name)} ${nextH.d < 0 ? 'متأخر ' + (-nextH.d) + ' يوم' : 'بعد ' + nextH.d + ' يوم'}` : ''}`;
    }
    if (/حقل|حقول|مساح|champ|surface|parcelle/.test(t) && /كم|عدد|مساح|combien|surface|liste|قائمة|أين|ما هي|what|quels/.test(t)) {
      if (!F.fields.length) return fr ? 'Aucun champ enregistré pour le moment.' : 'لا توجد حقول مسجلة بعد. أضفها من «الحقول والمحاصيل» أو ارسمها على «الخريطة».';
      return (fr ? '🌱 <b>Vos champs :</b>\n' : '🌱 <b>حقولك:</b>\n') + F.fields.slice(0, 15).map(f => `• ${esc(f.name)} — ${esc(f.crop || '')} — ${fmt(f.area)} ${esc(F.unit)} (${esc(f.status || '')})`).join('\n') + `\n<b>${fr ? 'Total' : 'الإجمالي'}: ${fmt(sum(F.fields, f => f.area))} ${esc(F.unit)}</b>`;
    }
    if (/ربح|رباح|إيراد|ايراد|مصروف|دخل|مبيعات|خسار|bénéfice|revenu|dépense|vente|profit/.test(t)) {
      const net = F.inc - F.exp;
      return fr ? `💰 <b>Ce mois :</b> revenus ${money(F.inc)}, dépenses ${money(F.exp)}, résultat <b>${money(net)}</b> ${net < 0 ? '⚠️ (déficit)' : '✅'}`
        : `💰 <b>هذا الشهر:</b> الإيرادات ${money(F.inc)}، المصروفات ${money(F.exp)}، الصافي <b>${money(net)}</b> ${net < 0 ? '⚠️ (عجز — راجع المصروفات الكبرى)' : '✅'}`;
    }
    if (/مخزون|مخزن|الناقص|ناقصة|stock|rupture/.test(t)) {
      if (!F.low.length) return fr ? '📦 Aucun stock sous le seuil.' : '📦 لا توجد أصناف أقل من حد التنبيه حالياً.';
      return (fr ? '📦 <b>Stocks bas :</b>\n' : '📦 <b>أصناف تحتاج توريداً:</b>\n') + F.low.map(i => `• ${esc(i.name)}: ${fmt(i.qty)} ${esc(i.unit || '')} (${fr ? 'seuil' : 'الحد'} ${fmt(i.min)})`).join('\n');
    }
    if (/موعد الحصاد|مواعيد.*حصاد|متى.*حصاد|أقرب حصاد|prochaine récolte|quand.*récolte/.test(t)) {
      if (!F.harvest.length) return fr ? 'Aucune date de récolte enregistrée.' : 'لا توجد مواعيد حصاد مسجلة في الحقول.';
      return (fr ? '🌾 <b>Récoltes :</b>\n' : '🌾 <b>مواعيد الحصاد:</b>\n') + F.harvest.slice(0, 8).map(h => `• ${esc(h.f.name)} (${esc(h.f.crop || '')}) — ${h.f.harvest} — ${h.d < 0 ? (fr ? 'en retard de ' : 'متأخر ') + (-h.d) + (fr ? ' j' : ' يوم') : (fr ? 'dans ' : 'بعد ') + h.d + (fr ? ' j' : ' يوم')}`).join('\n');
    }
    if (/طقس|حرارة اليوم|الجو|météo|temps|weather/.test(t) && F.W && F.W.current) {
      const c = F.W.current, tmp = Math.round(c.temperature_2m), wd = Math.round(c.wind_speed_10m);
      const adv = tmp >= 36 ? (fr ? 'Chaleur forte : allongez l’irrigation.' : 'حرارة عالية: زد وقت الري وظلّل الثمار.') : wd >= 25 ? (fr ? 'Vent fort : évitez les pulvérisations.' : 'رياح نشطة: تجنّب الرش الورقي.') : (fr ? 'Conditions normales.' : 'ظروف اعتيادية: ري صباحي.');
      return `⛅ ${tmp}°C | ${wd} km/h | ${c.relative_humidity_2m}%\n${adv}`;
    }
    if (/عمال|عامل|travailleur|ouvrier/.test(t) && /كم|عدد|combien/.test(t)) return fr ? `👷 ${F.workers.length} travailleur(s) permanent(s).` : `👷 عدد العمال الدائمين: ${F.workers.length}.`;
    if (/ديون|دين|مستحق|créance|dette/.test(t)) return fr ? `🧾 Créances : ${money(F.receivable)} — Dettes : ${money(F.payable)}` : `🧾 مستحقات لنا: ${money(F.receivable)} — مستحقات علينا: ${money(F.payable)}`;
    return null;
  };

  const builtIn = (q) => {
    const fr = isFrench(q), t = q.toLowerCase();
    const pf = planFromText(q); if (pf) return pf.html;
    const d = dataAnswer(q, fr);
    if (d) return d;
    let best = null, bs = 0;
    KB.forEach(e => { const s = e.k.reduce((a, k) => a + (t.includes(k) ? k.length : 0), 0); if (s > bs) { bs = s; best = e; } });
    if (best) return fr && best.fr ? best.fr : best.ar;
    return fr
      ? '🤖 Je peux répondre sur la fertilisation, l’irrigation, les ravageurs, les maladies, la récolte, et sur <b>vos données</b> (champs, finances, stocks). Pour des réponses libres, ajoutez une clé Gemini avec le bouton 🔑.'
      : '🤖 أستطيع الإجابة عن التسميد والري والآفات والأمراض والحصاد، وعن <b>بيانات مزرعتك</b> (الحقول، الحسابات، المخزون، مواعيد الحصاد). لأسئلة مفتوحة أكثر أضف مفتاح Gemini المجاني بزر 🔑.';
  };

  /* ---------------- عرض نص منسّق بأمان ---------------- */
  const renderText = (txt) => esc(txt)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^\s*[\*\-] /gm, '• ')
    .replace(/^#{1,4} (.+)$/gm, '<b>$1</b>');

  onReady(() => {
    if (document.getElementById('smeAiBtn')) return;

    const aiBtn = document.createElement('button');
    aiBtn.id = 'smeAiBtn';
    aiBtn.innerHTML = '🤖 المساعد الذكي';
    aiBtn.style.cssText = 'position:fixed; bottom:78px; right:16px; z-index:9998; background:#1a3622; color:#fff; border:2px solid #d97706; border-radius:25px; padding:10px 18px; font-weight:bold; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.25); cursor:pointer; font-family:inherit;';
    document.body.appendChild(aiBtn);

    const modal = document.createElement('div');
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; padding:12px; direction:rtl;';
    const quick = [['📋 ملخص مزرعتي', 'ملخص مزرعتي'], ['💰 أرباح الشهر', 'كم الأرباح هذا الشهر؟'], ['📦 نقص المخزون', 'ما الأصناف الناقصة في المخزون؟'], ['🌾 مواعيد الحصاد', 'ما هي مواعيد الحصاد؟'], ['⛅ الطقس', 'كيف الطقس اليوم؟'], ['📅 مخطط التسميد', '__plan'], ['🍉 تسميد', 'برنامج تسميد البطيخ 1 هكتار'], ['🧪 أنواع الأسمدة', 'ما هي أنواع الأسمدة الفوسفورية؟'], ['✨ المكملات', 'المكملات والمنشطات الحيوية'], ['🩺 نقص العناصر', 'أعراض نقص العناصر'], ['💧 الري', 'برنامج الري'], ['🐛 الآفات', 'مكافحة الآفات'], ['🍂 الأمراض', 'أمراض البطيخ والشمام'], ['🧂 الملوحة', 'التعامل مع ملوحة التربة والماء']];
    modal.innerHTML = `
      <div style="background:#fff; border-radius:16px; max-width:520px; height:calc(100% - 24px); margin:0 auto; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.3); color:#1e293b;">
        <div style="background:#1a3622; color:#fff; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #d97706;">
          <div>
            <h3 style="margin:0; font-size:16px;">🤖 مستشار SME Agri الذكي</h3>
            <span id="aiStatus" style="font-size:11px; color:#fde68a;"></span>
          </div>
          <div style="display:flex; gap:6px;">
            <button id="clearAiBtn" title="مسح المحادثة" style="background:#475569; color:#fff; border:none; border-radius:8px; padding:5px 8px; font-size:12px; cursor:pointer;">🗑</button>
            <button id="toggleApiKeyBtn" title="مفتاح Gemini" style="background:#d97706; color:#fff; border:none; border-radius:8px; padding:5px 8px; font-size:12px; cursor:pointer;">🔑</button>
            <button id="closeAiModal" style="background:#ef4444; color:#fff; border:none; border-radius:8px; padding:5px 10px; font-weight:bold; cursor:pointer;">✕</button>
          </div>
        </div>
        <div id="apiKeyBox" style="display:none; background:#fef3c7; padding:10px; border-bottom:1px solid #fcd34d; font-size:12px;">
          <div style="font-weight:bold; color:#92400e; margin-bottom:4px;">مفتاح Google Gemini (مجاني من aistudio.google.com) — يفعّل الإجابة الحرة والمعرفة بمزرعتك:</div>
          <div style="display:flex; gap:6px;">
            <input id="geminiApiInput" type="password" placeholder="AIza..." style="flex:1; padding:6px; border:1px solid #cbd5e1; border-radius:6px;">
            <button id="saveApiKeyBtn" style="background:#1a3622; color:#fff; border:none; border-radius:6px; padding:0 12px; font-weight:bold; cursor:pointer;">حفظ</button>
          </div>
          <div style="margin-top:4px; color:#78350f;">المفتاح يُحفظ على جهازك فقط. تُرسل ملخصات مزرعتك إلى Google عند السؤال.</div>
        </div>
        <div id="planPanel" style="display:none; background:#ecfdf5; padding:10px; border-bottom:1px solid #a7f3d0; font-size:12px; max-height:46%; overflow-y:auto;">
          <div style="font-weight:bold; color:#065f46; margin-bottom:6px;">📅 مخطط التسميد حسب المساحة (كغ/هكتار)</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <select id="plField" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;"></select>
            <select id="plCrop" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;">${Object.entries(CROPS).map(([k, c]) => `<option value="${k}">${c.ar}</option>`).join('')}</select>
            <input id="plArea" type="number" step="any" min="0" placeholder="المساحة بالهكتار" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;">
            <select id="plSoil" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;"><option value="sandy">تربة رملية</option><option value="loam">تربة طميية</option><option value="clay">تربة طينية</option></select>
            <select id="plIrr" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;"><option value="drip">ري بالتنقيط</option><option value="flood">رش / غمر</option></select>
            <select id="plSal" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;"><option value="0">ملوحة عادية</option><option value="1">ملوحة مرتفعة</option></select>
            <select id="plDevis" style="padding:7px; border:1px solid #cbd5e1; border-radius:6px;"><option value="0">كل الأسمدة المتاحة</option><option value="1">أسمدة قائمة DEVIS فقط</option></select>
          </div>
          <button id="plGo" style="width:100%; margin-top:8px; background:#065f46; color:#fff; border:none; border-radius:8px; padding:9px; font-weight:bold; cursor:pointer;">احسب البرنامج</button>
        </div>
        <div id="aiChatBox" style="flex:1; padding:12px; overflow-y:auto; background:#f8fafc; display:flex; flex-direction:column; gap:10px;"></div>
        <div style="padding:8px 10px; background:#f1f5f9; display:flex; gap:6px; overflow-x:auto; border-top:1px solid #e2e8f0;">
          ${quick.map(q => `<button class="quick-q" data-q="${esc(q[1])}" style="white-space:nowrap; background:#fff; border:1px solid #cbd5e1; border-radius:15px; padding:5px 10px; font-size:11px; color:#1a3622; cursor:pointer;">${q[0]}</button>`).join('')}
        </div>
        <div style="padding:10px; background:#fff; border-top:1px solid #e2e8f0; display:flex; gap:8px;">
          <input id="aiUserInput" type="text" placeholder="اسأل بالعربية أو الفرنسية..." style="flex:1; padding:10px; border:1px solid #cbd5e1; border-radius:10px; font-size:14px;">
          <button id="aiSendBtn" style="background:#d97706; color:#fff; border:none; border-radius:10px; padding:0 16px; font-weight:bold; font-size:14px; cursor:pointer;">إرسال</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const chatBox = document.getElementById('aiChatBox');
    const userInput = document.getElementById('aiUserInput');
    const apiBox = document.getElementById('apiKeyBox');
    const apiInput = document.getElementById('geminiApiInput');
    const status = document.getElementById('aiStatus');
    apiInput.value = lsGet('sme_gemini_key', '');

    let history = [];
    try { history = JSON.parse(lsGet(HIST_KEY, '[]')); if (!Array.isArray(history)) history = []; } catch (e) { history = []; }
    const saveHist = () => lsSet(HIST_KEY, JSON.stringify(history.slice(-40)));
    const updStatus = () => { status.textContent = lsGet('sme_gemini_key', '') ? '🟢 ذكاء متقدم (Gemini) + بيانات مزرعتك' : '🟡 مستشار مدمج يعمل بدون إنترنت — أضف 🔑 للذكاء المتقدم'; };

    const bubble = (html, isUser, raw) => {
      const m = document.createElement('div');
      m.style.cssText = isUser
        ? 'background:#1a3622; color:#fff; padding:10px 14px; border-radius:12px; font-size:13px; line-height:1.6; align-self:flex-end; max-width:88%; white-space:pre-line;'
        : 'background:#fff; border:1px solid #e2e8f0; color:#1e293b; padding:10px 14px; border-radius:12px; font-size:13px; line-height:1.7; align-self:flex-start; max-width:92%; white-space:pre-line;';
      if (raw) m.textContent = html; else m.innerHTML = html;
      chatBox.appendChild(m);
      chatBox.scrollTop = chatBox.scrollHeight;
      return m;
    };

    const welcome = () => {
      const F = farmFacts();
      bubble(`مرحباً بك في <strong>${esc(F.farm)}</strong>! 🌱<br>أعرف بيانات مزرعتك (${F.fields.length} حقل، الحسابات، المخزون، الحصاد) وأجيب عن الزراعة والإدارة بالعربية أو Français. جرّب الأزرار السريعة أسفل الشاشة.`, false);
    };
    const redraw = () => {
      chatBox.innerHTML = '';
      welcome();
      history.forEach(h => h.role === 'user' ? bubble(h.text, true, true) : bubble(h.html, false));
    };
    redraw(); updStatus();

    aiBtn.onclick = () => { modal.style.display = 'block'; updStatus(); chatBox.scrollTop = chatBox.scrollHeight; };
    document.getElementById('closeAiModal').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('toggleApiKeyBtn').onclick = () => { apiBox.style.display = apiBox.style.display === 'none' ? 'block' : 'none'; };
    document.getElementById('saveApiKeyBtn').onclick = () => {
      lsSet('sme_gemini_key', apiInput.value.trim());
      apiBox.style.display = 'none'; updStatus();
      bubble(apiInput.value.trim() ? '✅ تم حفظ المفتاح. اسألني أي سؤال.' : 'تم حذف المفتاح، سأعمل بالمستشار المدمج.', false);
    };
    document.getElementById('clearAiBtn').onclick = () => { if (confirm('مسح المحادثة؟')) { history = []; saveHist(); redraw(); } };

    const callGemini = async (apiKey, question) => {
      const sys = `أنت مستشار زراعي وإداري خبير لشركة SME Agri (Société Moulay Ely Pour Agricol) المتخصصة في البطيخ الأحمر والشمام وخضروات أخرى في منطقة كرمسين بولاية اترارزة، موريتانيا (مناخ حار وجاف، تربة رملية، مياه من النهر/آبار، ري بالتنقيط).
أجب بنفس لغة السؤال (العربية أو الفرنسية) بإيجاز ووضوح وبخطوات عملية. استخدم بيانات المزرعة أدناه عند الحاجة ولا تخترع أرقاماً غير موجودة فيها؛ إن نقصت البيانات فاطلبها. عند طلب برنامج تسميد بالهكتار وجّه المستخدم لزر «📅 مخطط التسميد» أو اطلب المحصول والمساحة ونوع التربة والري. لا تعطِ جرعات مبيدات دقيقة بلا ذكر قراءة ملصق المنتج وفترة ما قبل الحصاد. إن كان التشخيص غير مؤكد فاذكر الاحتمالات.
بيانات المزرعة الحالية:
${contextText()}`;
      const contents = history.filter(h => h.text).slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }));
      contents.push({ role: 'user', parts: [{ text: question }] });
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
          method: 'POST', signal: ctl.signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { temperature: 0.5, maxOutputTokens: 900 } })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || ('HTTP ' + res.status));
        const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
        const txt = parts ? parts.map(p => p.text || '').join('') : '';
        if (!txt) throw new Error('رد فارغ');
        return txt;
      } finally { clearTimeout(to); }
    };

    let busy = false;
    const askAI = async (question) => {
      question = (question || '').trim();
      if (!question || busy) return;
      busy = true;
      bubble(question, true, true); userInput.value = '';
      const loading = bubble('⏳ جاري التفكير...', false);
      const apiKey = lsGet('sme_gemini_key', '');
      let html;
      // أسئلة البيانات الدقيقة تُجاب محلياً دائماً (أدق وأسرع)
      const pfx = planFromText(question);
      const local = pfx ? pfx.html : dataAnswer(question, isFrench(question));
      if (local) html = local;
      else if (apiKey) {
        try { html = renderText(await callGemini(apiKey, question)); }
        catch (err) {
          const msg = /API key|API_KEY|permission|403|400/i.test(String(err.message)) ? 'المفتاح غير صالح أو غير مفعّل' : (err.name === 'AbortError' ? 'انتهت مهلة الاتصال' : 'تعذر الاتصال بالذكاء المتقدم');
          html = `<i style="color:#b45309">⚠️ ${esc(msg)} — هذه إجابة المستشار المدمج:</i>\n` + builtIn(question);
        }
      } else html = builtIn(question);
      loading.innerHTML = html;
      history.push({ role: 'user', text: question }, { role: 'model', html, text: loading.textContent });
      saveHist();
      chatBox.scrollTop = chatBox.scrollHeight;
      busy = false;
    };

    /* ---- مخطط التسميد ---- */
    const plPanel = document.getElementById('planPanel'), plField = document.getElementById('plField');
    const fillFields = () => {
      const F = farmFacts();
      plField.innerHTML = '<option value="">— اختر حقلاً من مزرعتك (اختياري) —</option>' + F.fields.map(f => `<option value="${esc(f.id)}">${esc(f.name)} (${esc(f.crop || '')}، ${fmt(f.area)} ${esc(F.unit)})</option>`).join('');
    };
    plField.onchange = () => {
      const F = farmFacts(), f = F.fields.find(x => x.id === plField.value); if (!f) return;
      const ck = findCrop(f.crop); if (ck) document.getElementById('plCrop').value = ck;
      document.getElementById('plArea').value = +toHa(+f.area || 0, F.unit).toFixed(3);
      if (/تنقيط/.test(f.irr || '')) document.getElementById('plIrr').value = 'drip'; else if (f.irr) document.getElementById('plIrr').value = 'flood';
    };
    document.getElementById('plGo').onclick = () => {
      const a = parseFloat(document.getElementById('plArea').value);
      if (!(a > 0)) return alert('أدخل مساحة صحيحة بالهكتار أو اختر حقلاً');
      const pl = buildPlan(document.getElementById('plCrop').value, a, { soil: document.getElementById('plSoil').value, irr: document.getElementById('plIrr').value, saline: document.getElementById('plSal').value === '1', alkaline: false, devis: document.getElementById('plDevis').value === '1' });
      plPanel.style.display = 'none';
      showPlan(pl, plField.value);
    };
    const showPlan = (pl, fieldId) => {
      const html = renderPlan(pl);
      const b = bubble(html, false);
      const bar = document.createElement('div'); bar.style.cssText = 'display:flex; gap:6px; margin-top:8px;';
      bar.innerHTML = '<button data-a="copy" style="flex:1; background:#1a3622; color:#fff; border:none; border-radius:8px; padding:7px; font-size:12px; cursor:pointer;">📋 نسخ البرنامج</button>' + (fieldId ? '<button data-a="save" style="flex:1; background:#d97706; color:#fff; border:none; border-radius:8px; padding:7px; font-size:12px; cursor:pointer;">💾 حفظ في ملاحظات الحقل</button>' : '');
      b.appendChild(bar);
      bar.querySelector('[data-a=copy]').onclick = () => { const txt = planText(pl); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(() => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); }); alert('✅ تم النسخ'); };
      const sv = bar.querySelector('[data-a=save]');
      if (sv) sv.onclick = () => { try { const f = S.fields.find(x => x.id === fieldId); f.notes = (f.notes ? f.notes + '\n\n' : '') + planText(pl); save(); toast('✓ حُفظ البرنامج في ملاحظات الحقل'); } catch (e) { alert('تعذر الحفظ'); } };
      history.push({ role: 'model', html, text: `برنامج تسميد ${pl.c.ar} لمساحة ${f1(pl.area)} هكتار` }); saveHist();
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    document.getElementById('aiSendBtn').onclick = () => askAI(userInput.value);
    userInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); askAI(userInput.value); } };
    document.querySelectorAll('.quick-q').forEach(btn => { btn.onclick = () => {
      if (btn.dataset.q === '__plan') { fillFields(); plPanel.style.display = plPanel.style.display === 'none' ? 'block' : 'none'; return; }
      askAI(btn.dataset.q);
    }; });
  });
})();
