(function () {
  if (typeof window === "undefined") return;

  const STORAGE_KEY = "elb_lang_pref_v3";
  const DEFAULT_LANG = "ar";
  const SUPPORTED = ["ar", "tr"];

  const FLAG_IMAGES = {
    ar: { src: "img/flags/egypt.svg", alt: "علم مصر" },
    tr: { src: "img/flags/turkey.svg", alt: "Türk bayrağı" },
  };
  const FALLBACK_FLAG = { src: "img/flags/globe.svg", alt: "" };

  let gateEl;
  let fabEl;
  let fabToggle;
  let fabMenu;
  let fabFlag;
  let gateVisible = false;
  let fabMenuOpen = false;

  const translations = {
    ar: {
      "common.brandName": "مزارع البركات",
      "common.langSwitch.label": "تغيير اللغة",
      "common.lang.ar": "عربي",
      "common.lang.tr": "تركي",
      "common.actions.close": "إغلاق",
      "common.actions.cancel": "إلغاء",
      "common.actions.addToCart": "أضف للسلة",
      "common.actions.confirmOrder": "تأكيد الطلب",
      "common.actions.clearCart": "تفريغ السلة",
      "common.actions.viewMenu": "الرجوع إلى المنيو",
      "common.actions.sendWhatsApp": "تأكيد وإرسال على واتساب",
      "common.actions.detectLocation": "تحديد موقعي الحالي",
      "common.aria.backToTop": "العودة إلى أعلى الصفحة",
      "common.aria.openMenu": "فتح القائمة",
      "common.contact.joinGroup": "انضم للجروب",
      "common.contact.openPage": "زر الصفحة",
      "common.contact.copy": "نسخ الرقم",
      "common.contact.copyEmail": "نسخ البريد",
      "common.contact.openWhatsApp": "فتح واتساب",
      "common.note.unpriced": "تنبيه: يوجد أصناف تُباع كاملة وسيتم تحديد سعرها النهائي بعد الوزن الفعلي.",

      "nav.home": "الصفحة الرئيسية",
      "nav.menu": "المنيو",
      "nav.about": "من نحن",
      "nav.contact": "تواصل معنا",
      "nav.aria.main": "القائمة الرئيسية",
      "nav.aria.mobile": "قائمة الموبايل",

      "home.meta.title": "مزارع البركات | الصفحة الرئيسية",
      "home.hero.title": "مزارع البركات",
      "home.hero.body":
        "بفضل الذبح الحلال واليومي نحصل على لحوم طازجة دائمًا، وبفضل أفضل طرق التغليف تبقى نظيفة وآمنة في كل الأوقات. يمكنكم اختيار لحومنا بكل اطمئنان، فهي تصل إلى موائدكم بطعمها الطبيعي الأصيل.",
      "home.hero.cta": "افتح المنيو الآن",
      "home.about.title": "من نحن",
      "home.about.body":
        "\"مزارع البركات تأسست لتقديم أجود أنواع اللحوم الطازجة من مزارعنا في أدرنة إلى منازلكم في إسطنبول. نذبح يوميًا تحت إشراف بيطري، ونوفر تغليف محكم وتوصيل سريع إلى بشاك شهير وكايا شهير.\"",
      "home.contact.title": "تواصل معنا",
      "home.contact.phone.title": "رقم الهاتف",
      "home.contact.phone.subtitle": "متاح عبر المكالمات",
      "home.contact.whatsapp.title": "واتساب",
      "home.contact.whatsapp.subtitle": "راسلنا مباشرة",
      "home.contact.feedback.title": "الشكاوى والاقتراحات",
      "home.contact.feedback.subtitle": "نرحب بملاحظاتكم",
      "home.contact.group.title": "جروب واتساب",
      "home.contact.group.subtitle": "عروض يومية وتحديثات",
      "home.contact.telegram.title": "تليجرام",
      "home.contact.telegram.subtitle": "قناتنا الرسمية",
      "home.contact.email.title": "البريد الإلكتروني",
      "home.contact.email.subtitle": "للطلبات والشكاوى",
      "home.contact.instagram.title": "إنستجرام",
      "home.contact.instagram.subtitle": "تابع أحدث الصور",
      "home.contact.facebook.title": "فيسبوك",
      "home.contact.facebook.subtitle": "صفحتنا الرسمية",
      "toast.copy.success": "تم النسخ ✅",
      "toast.copy.error": "لم يتم النسخ، انسخ يدويًا",

      "menu.meta.title": "المنيو – مزارع البركات",
      "menu.filters.all": "الكل",
      "menu.filters.search": "ابحث عن منتج...",
      "menu.filters.prev": "تصنيفات سابقة",
      "menu.filters.next": "تصنيفات إضافية",
      "menu.offers.title": "عروض اليوم",
      "menu.products.title": "قائمة المنتجات",
      "menu.badge.offer": "عرض",
      "menu.product.unavailable": "غير متاح",
      "menu.product.callForPrice": "اتصل للتسعير",
      "menu.flags.sellByKg": "يباع بالكيلو",
      "menu.flags.sellWhole": "يباع كامل • السعر/كجم",
      "menu.flags.sellWholeApprox": " • ~{{kg}}كجم/قطعة",
      "menu.modal.title": "تفاصيل الطلب",
      "menu.modal.cutLabel": "اختر طريقة التقطيع",
      "menu.modal.cutPlaceholder": "اختر طريقة التقطيع",
      "menu.modal.quantity": "الكمية",
      "menu.modal.noteLabel": "ملاحظة (اختياري)",
      "menu.modal.notePlaceholder":
        "يمكنك كتابة ملاحظة قصيرة بحد أقصى 160 حرفًا. مثال: قطع صغيرة؛ بدون دهن؛ تعبئة مزدوجة.",
      "menu.modal.helper.sellByKg": "سيتم حساب السعر حسب الكيلو.",
      "menu.modal.helper.sellWhole":
        "هذا المنتج يُباع كاملًا والسعر الظاهر هو سعر الكيلو. {{text}}",
      "menu.modal.helper.sellWhole.withApprox":
        "الوزن التقريبي للقطعة ~{{kg}} كجم. السعر النهائي بعد الوزن.",
      "menu.modal.helper.sellWhole.noApprox": "سيتم تحديد السعر النهائي بعد الوزن.",
      "menu.modal.helper.sellPiece": "الكمية تحسب بالقطعة.",
      "menu.modal.cutError": "من فضلك اختر طريقة التقطيع قبل المتابعة.",
      "menu.cart.title": "سلتك",
      "menu.cart.empty": "السلة فارغة",
      "menu.cart.totalLabel": "الإجمالي التقريبي:",
      "menu.cart.totalNote": "الإجمالي تقريبي وقد تختلف القيمة النهائية بعد الوزن الفعلي.",
      "menu.cart.totalNoteEm": "احتمال فروقات بسيطة باختلاف الوزن.",
      "menu.cart.clear": "تفريغ السلة",
      "menu.cart.confirm": "تأكيد الطلب",
      "menu.cart.meta.cut": "طريقة التقطيع",
      "menu.cart.meta.quantity": "الكمية",
      "menu.cart.meta.none": "بدون تحديد",
      "menu.cart.meta.delete": "حذف",
      "menu.cart.meta.note": "ملاحظة",
      "menu.alert.loadFail": "تعذر تحميل القائمة الآن. جرّب التحديث لاحقًا.",
      "menu.alert.noPapa": "تعذر تحميل القائمة (مكتبة PapaParse غير متاحة).",
      "menu.units.piece": "قطعة",
      "menu.units.piecePlural": "قطعة",
      "menu.units.kg": "كجم",
      "menu.units.count": "عدد",
      "menu.units.approxPieceKg": " (~{{kg}} كجم/قطعة)",
      "menu.price.unitPiece": "سعر القطعة",
      "menu.price.unitKg": "سعر الكيلو",
      "menu.whatsapp.header": "طلب جديد من {{brand}} 🌾🥩",
      "menu.whatsapp.details": "🧾 تفاصيل الطلب:",
      "menu.whatsapp.total": "💰 الإجمالي التقريبي: {{total}}",
      "menu.whatsapp.totalChange": " (قد تتغير الأصناف الكاملة بعد الوزن)",
      "menu.whatsapp.note":
        "ℹ️ ملاحظة: الإجمالي تقريبي وقد يحدث فرق بسيط باختلاف الوزن.",
      "menu.whatsapp.unitPrice": "السعر/وحدة",
      "menu.whatsapp.quantity": "الكمية",
      "menu.whatsapp.cut": "طريقة التقطيع",
      "menu.whatsapp.noteLabel": "ملاحظة",
      "menu.alert.cartEmpty": "السلة فارغة",

      "menu.categories.ارز و بقوليات": "أرز و بقوليات",
      "menu.categories.اسماك": "أسماك",
      "menu.categories.بهارات و توابل": "بهارات و توابل",
      "menu.categories.خضروات و فواكه مجمده": "خضروات و فواكه مجمدة",
      "menu.categories.سقطات": "سقطات",
      "menu.categories.شيبسي": "شيبسي",
      "menu.categories.لحم خروف": "لحم خروف",
      "menu.categories.لحم عجل": "لحم عجل",
      "menu.categories.لحوم بيضاء": "لحوم بيضاء",
      "menu.categories.مخبوزات": "مخبوزات",
      "menu.categories.مشروبات": "مشروبات",
      "menu.categories.منتجات مزارع البركات": "منتجات مزارع البركات",
      "menu.categories.منتجات مصريه": "منتجات مصرية",
      "menu.categories.مياه شرب": "مياه شرب",

      "confirm.meta.title": "تأكيد الطلب – مزارع البركات",
      "confirm.heading.title": "تأكيد الطلب",
      "confirm.heading.badge": "خطوة أخيرة",
      "confirm.heading.body":
        "راجِع الأصناف ثم أدخل بيانات الاستلام واختر طريقة الدفع وحدِّد موقع التسليم على الخريطة.",
      "confirm.summary.title": "ملخص الطلب",
      "confirm.summary.store": "المتجر: {{brand}}",
      "confirm.summary.table.item": "الصنف",
      "confirm.summary.table.qty": "الكمية",
      "confirm.summary.table.price": "السعر/وحدة",
      "confirm.summary.table.total": "الإجمالي التقريبي",
      "confirm.summary.table.delete": "حذف",
      "confirm.summary.totalLabel": "الإجمالي التقريبي",
      "confirm.summary.totalNote": "الإجمالي تقريبي وقد تختلف القيمة النهائية عد الوزن الفعلي.",
      "confirm.summary.totalNoteEm": "احتمال فروقات بسيطة باختلاف الوزن.",
      "confirm.form.title": "بيانات الاستلام والدفع",
      "confirm.form.name": "الاسم",
      "confirm.form.namePlaceholder": "اسم المستلم",
      "confirm.form.phone": "رقم الهاتف",
      "confirm.form.address": "العنوان التفصيلي",
      "confirm.form.addressRequired": "(مطلوب)",
      "confirm.form.addressPlaceholder":
        "مثال: باشاك شهير - الحي - الشارع - المبنى/الدور/الشقة",
      "confirm.form.addressHint":
        "اكتب العنوان بالتفصيل حتى مع تحديد الموقع من الخريطة.",
      "confirm.form.delivery": "طريقة الاستلام",
      "confirm.form.delivery.delivery": "توصيل للمنزل",
      "confirm.form.delivery.pickup": "استلام من المحل",
      "confirm.form.payment": "طريقة الدفع",
      "confirm.form.payment.placeholder": "اختر طريقة الدفع",
      "confirm.form.payment.cash": "نقدًا",
      "confirm.form.payment.pos": "كريدي كارت (POS)",
      "confirm.map.title": "موقع التسليم على الخريطة",
      "confirm.map.instructions": "أو اضغط على الخريطة لاختيار نقطة التسليم.",
      "confirm.map.hint.empty": "لم يتم اختيار موقع بعد.",
      "confirm.map.hint.loading": "جاري تحميل خريطة OpenStreetMap...",
      "confirm.map.hint.selected": "الموقع المحدد: {{lat}}, {{lng}}",
      "confirm.actions.back": "الرجوع إلى المنيو",
      "confirm.actions.submit": "تأكيد وإرسال على واتساب",
      "confirm.actions.sendPickup": "تأكيد الطلب (استلام من المحل)",
      "confirm.toast.noDraft": "لا يوجد طلب قيد التأكيد. سيتم الرجوع للمنيو.",
      "confirm.toast.allRemoved": "تم حذف جميع الأصناف.",
      "confirm.toast.mapLoadError":
        "تعذّر تحميل خريطة OpenStreetMap. تأكد من الاتصال بالإنترنت ثم حدِّث الصفحة.",
      "confirm.toast.mapLoading":
        "جاري تحميل خريطة OpenStreetMap، برجاء المحاولة بعد لحظات.",
      "confirm.toast.geoUnsupported": "المتصفح لا يدعم تحديد الموقع.",
      "confirm.toast.geoFailed": "تعذّر تحديد الموقع. اختره يدويًا من الخريطة.",
      "confirm.toast.needName": "من فضلك أدخل الاسم.",
      "confirm.toast.needPhone": "من فضلك أدخل رقم الهاتف.",
      "confirm.toast.needAddress": "من فضلك اكتب العنوان التفصيلي.",
      "confirm.toast.needPayment": "من فضلك اختر طريقة الدفع المناسبة.",
      "confirm.whatsapp.header": "طلب جديد من {{brand}} 🌿🐄",
      "confirm.whatsapp.details": "🧾 تفاصيل الطلب:",
      "confirm.whatsapp.cut": "طريقة التقطيع",
      "confirm.whatsapp.note": "ملاحظة",
      "confirm.whatsapp.total": "💰 الإجمالي التقريبي: {{total}}",
      "confirm.whatsapp.noteLine":
        "ℹ️ ملاحظة: الإجمالي تقريبي وقد يحدث فرق بسيط باختلاف الوزن.",
      "confirm.whatsapp.customer": "👤 الاسم: {{name}}",
      "confirm.whatsapp.phone": "📞 الهاتف: {{phone}}",
      "confirm.whatsapp.payment": "💳 طريقة الدفع: {{method}}",
      "confirm.whatsapp.pickup": "🏪 طريقة الاستلام: استلام من المحل",
      "confirm.whatsapp.address": "🏠 العنوان: {{address}}",
      "confirm.whatsapp.addressFallback": "لم يُذكر",
      "confirm.whatsapp.location": "🧭 اللوكيشن: {{link}}",
      "confirm.whatsapp.delivery": "🚚 طريقة الاستلام: {{method}}",
    },
    tr: {
      "common.brandName": "El Bereket Çiftliği",
      "common.langSwitch.label": "Dil seçimi",
      "common.lang.ar": "Arapça",
      "common.lang.tr": "Türkçe",
      "common.actions.close": "Kapat",
      "common.actions.cancel": "İptal",
      "common.actions.addToCart": "Sepete ekle",
      "common.actions.confirmOrder": "Siparişi onayla",
      "common.actions.clearCart": "Sepeti boşalt",
      "common.actions.viewMenu": "Menüye dön",
      "common.actions.sendWhatsApp": "WhatsApp ile onayla ve gönder",
      "common.actions.detectLocation": "Mevcut konumumu al",
      "common.aria.backToTop": "Sayfanın başına dön",
      "common.aria.openMenu": "Menüyü aç",
      "common.contact.joinGroup": "Gruba katıl",
      "common.contact.openPage": "Sayfayı ziyaret et",
      "common.contact.copy": "Numarayı kopyala",
      "common.contact.copyEmail": "E-postayı kopyala",
      "common.contact.openWhatsApp": "WhatsApp'ı aç",
      "common.note.unpriced":
        "Uyarı: Bazı ürünler bütün satılmaktadır ve nihai fiyat tartımdan sonra belirlenecektir.",

      "nav.home": "Ana sayfa",
      "nav.menu": "Menü",
      "nav.about": "Hakkımızda",
      "nav.contact": "İletişim",
      "nav.aria.main": "Ana menü",
      "nav.aria.mobile": "Mobil menü",

      "home.meta.title": "El Bereket Çiftliği | Ana Sayfa",
      "home.hero.title": "El Bereket Çiftliği",
      "home.hero.body":
        "Her gün helal kesim sayesinde daima taze et elde ediyor, en iyi paketleme yöntemleriyle ürünlerimizi her zaman temiz ve güvenli tutuyoruz. Etlerimizi gönül rahatlığıyla seçebilirsiniz; sofralarınıza doğal ve özgün tadıyla ulaşıyor.",
      "home.hero.cta": "Menüyü şimdi aç",
      "home.about.title": "Biz kimiz",
      "home.about.body":
        "\"El Bereket Çiftliği, Edirne'deki çiftliklerimizden İstanbul'daki evlerinize en kaliteli taze etleri ulaştırmak için kuruldu. Her gün veteriner gözetiminde kesim yapıyor, özenli paketleme ve Başakşehir ile Kayaşehir'e hızlı teslimat sağlıyoruz.\"",
      "home.contact.title": "Bizimle iletişime geçin",
      "home.contact.phone.title": "Telefon",
      "home.contact.phone.subtitle": "Aramalar için uygundur",
      "home.contact.whatsapp.title": "WhatsApp",
      "home.contact.whatsapp.subtitle": "Bize hemen yazın",
      "home.contact.feedback.title": "Şikayet ve Öneriler",
      "home.contact.feedback.subtitle": "Görüşlerinizi bizimle paylaşın",
      "home.contact.group.title": "WhatsApp grubu",
      "home.contact.group.subtitle": "Günlük kampanyalar ve güncellemeler",
      "home.contact.telegram.title": "Telegram",
      "home.contact.telegram.subtitle": "Resmi kanalımız",
      "home.contact.email.title": "E-posta",
      "home.contact.email.subtitle": "Sipariş ve şikâyetler için",
      "home.contact.instagram.title": "Instagram",
      "home.contact.instagram.subtitle": "En yeni görselleri takip edin",
      "home.contact.facebook.title": "Facebook",
      "home.contact.facebook.subtitle": "Resmî sayfamız",
      "toast.copy.success": "Kopyalandı ✅",
      "toast.copy.error": "Kopyalanamadı, lütfen elle kopyalayın",

      "menu.meta.title": "Menü – El Bereket Çiftliği",
      "menu.filters.all": "Tümü",
      "menu.filters.search": "Ürün ara...",
      "menu.filters.prev": "Önceki kategoriler",
      "menu.filters.next": "Diğer kategoriler",
      "menu.offers.title": "Günün kampanyaları",
      "menu.products.title": "Ürün listesi",
      "menu.badge.offer": "Kampanya",
      "menu.product.unavailable": "Mevcut değil",
      "menu.product.callForPrice": "Fiyat için arayın",
      "menu.flags.sellByKg": "Kilo ile satılır",
      "menu.flags.sellWhole": "Tüm halde satılır • Fiyat/kg",
      "menu.flags.sellWholeApprox": " • ~{{kg}} kg/adet",
      "menu.modal.title": "Sipariş detayları",
      "menu.modal.cutLabel": "Kesim şeklini seçin",
      "menu.modal.cutPlaceholder": "Kesim şeklini seçin",
      "menu.modal.quantity": "Miktar",
      "menu.modal.noteLabel": "Not (isteğe bağlı)",
      "menu.modal.notePlaceholder":
        "En fazla 160 karakterlik kısa bir not yazabilirsiniz. Örn: Küçük parçalar; yağsız; çift paket.",
      "menu.modal.helper.sellByKg": "Fiyat kilo üzerinden hesaplanacaktır.",
      "menu.modal.helper.sellWhole":
        "Bu ürün bütün satılır ve görünen fiyat kilogram fiyatıdır. {{text}}",
      "menu.modal.helper.sellWhole.withApprox":
        "Tahmini ağırlık ~{{kg}} kg/adet. Nihai fiyat tartımdan sonra belirlenir.",
      "menu.modal.helper.sellWhole.noApprox":
        "Nihai fiyat tartımdan sonra belirlenecektir.",
      "menu.modal.helper.sellPiece": "Miktar adet üzerinden hesaplanır.",
      "menu.modal.cutError": "Lütfen devam etmeden önce kesim şeklini seçin.",
      "menu.cart.title": "Sepetin",
      "menu.cart.empty": "Sepet boş",
      "menu.cart.totalLabel": "Tahmini toplam:",
      "menu.cart.totalNote":
        "Toplam tutar tahminidir, nihai fiyat gerçek tartımdan sonra değişebilir.",
      "menu.cart.totalNoteEm": "Ağırlık farkına bağlı küçük sapmalar olabilir.",
      "menu.cart.clear": "Sepeti boşalt",
      "menu.cart.confirm": "Siparişi onayla",
      "menu.cart.meta.cut": "Kesim şekli",
      "menu.cart.meta.quantity": "Miktar",
      "menu.cart.meta.none": "Seçilmedi",
      "menu.cart.meta.delete": "Sil",
      "menu.cart.meta.note": "Not",
      "menu.alert.loadFail": "Menü şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.",
      "menu.alert.noPapa": "Menü yüklenemedi (PapaParse kütüphanesi mevcut değil).",
      "menu.units.piece": "Adet",
      "menu.units.piecePlural": "Adet",
      "menu.units.kg": "Kg",
      "menu.units.count": "Adet",
      "menu.units.approxPieceKg": " (~{{kg}} kg/adet)",
      "menu.price.unitPiece": "Adet fiyatı",
      "menu.price.unitKg": "Kilogram fiyatı",
      "menu.whatsapp.header": "{{brand}} tarafından yeni sipariş 🌾🥩",
      "menu.whatsapp.details": "🧾 Sipariş detayları:",
      "menu.whatsapp.total": "💰 Tahmini toplam: {{total}}",
      "menu.whatsapp.totalChange": " (tüm ürünlerin fiyatı tartım sonrası değişebilir)",
      "menu.whatsapp.note":
        "ℹ️ Not: Toplam tutar tahminidir, gerçek tartımdan sonra küçük farklar olabilir.",
      "menu.whatsapp.unitPrice": "Birim fiyatı",
      "menu.whatsapp.quantity": "Miktar",
      "menu.whatsapp.cut": "Kesim şekli",
      "menu.whatsapp.noteLabel": "Not",
      "menu.alert.cartEmpty": "Sepet boş",

      "menu.categories.ارز و بقوليات": "Pirinç ve bakliyat",
      "menu.categories.اسماك": "Balık",
      "menu.categories.بهارات و توابل": "Baharat ve çeşniler",
      "menu.categories.خضروات و فواكه مجمده": "Dondurulmuş sebze & meyve",
      "menu.categories.سقطات": "Sakatatlar",
      "menu.categories.شيبسي": "Cips",
      "menu.categories.لحم خروف": "Kuzu eti",
      "menu.categories.لحم عجل": "Dana eti",
      "menu.categories.لحوم بيضاء": "Beyaz et",
      "menu.categories.مخبوزات": "Fırın ürünleri",
      "menu.categories.مشروبات": "İçecekler",
      "menu.categories.منتجات مزارع البركات": "El Bereket ürünleri",
      "menu.categories.منتجات مصريه": "Mısır ürünleri",
      "menu.categories.مياه شرب": "İçme suyu",

      "confirm.meta.title": "Siparişi onayla – El Bereket Çiftliği",
      "confirm.heading.title": "Siparişi onayla",
      "confirm.heading.badge": "Son adım",
      "confirm.heading.body":
        "Ürünleri kontrol edin, teslimat bilgilerini ve ödeme yöntemini girin, ardından haritada teslimat noktasını işaretleyin.",
      "confirm.summary.title": "Sipariş özeti",
      "confirm.summary.store": "Mağaza: {{brand}}",
      "confirm.summary.table.item": "Ürün",
      "confirm.summary.table.qty": "Miktar",
      "confirm.summary.table.price": "Birim fiyat",
      "confirm.summary.table.total": "Tahmini toplam",
      "confirm.summary.table.delete": "Sil",
      "confirm.summary.totalLabel": "Tahmini toplam",
      "confirm.summary.totalNote":
        "Toplam tutar tahminidir, nihai fiyat gerçek tartımdan sonra değişebilir.",
      "confirm.summary.totalNoteEm": "Ağırlık farkına bağlı küçük sapmalar olabilir.",
      "confirm.form.title": "Teslimat ve ödeme bilgileri",
      "confirm.form.name": "İsim",
      "confirm.form.namePlaceholder": "Teslim alacak kişi",
      "confirm.form.phone": "Telefon",
      "confirm.form.address": "Detaylı adres",
      "confirm.form.addressRequired": "(Zorunlu)",
      "confirm.form.addressPlaceholder":
        "Örn: Başakşehir - mahalle - sokak - bina/kat/daire",
      "confirm.form.addressHint":
        "Haritadan konum seçseniz bile adresi ayrıntılı yazın.",
      "confirm.form.delivery": "Teslimat şekli",
      "confirm.form.delivery.delivery": "Adrese teslim",
      "confirm.form.delivery.pickup": "Mağazadan teslim",
      "confirm.form.payment": "Ödeme yöntemi",
      "confirm.form.payment.placeholder": "Ödeme yöntemi seçin",
      "confirm.form.payment.cash": "Nakit",
      "confirm.form.payment.pos": "Kredi kartı (POS)",
      "confirm.map.title": "Haritada teslimat noktası",
      "confirm.map.instructions": "Ya da haritaya tıklayarak teslimat noktasını seçin.",
      "confirm.map.hint.empty": "Henüz konum seçilmedi.",
      "confirm.map.hint.loading": "OpenStreetMap haritası yükleniyor...",
      "confirm.map.hint.selected": "Seçilen konum: {{lat}}, {{lng}}",
      "confirm.actions.back": "Menüye dön",
      "confirm.actions.submit": "WhatsApp ile onayla ve gönder",
      "confirm.actions.sendPickup": "Mağazadan teslim için onayla",
      "confirm.toast.noDraft": "Bekleyen bir sipariş bulunamadı. Menüye dönülüyor.",
      "confirm.toast.allRemoved": "Tüm ürünler silindi.",
      "confirm.toast.mapLoadError":
        "OpenStreetMap yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.",
      "confirm.toast.mapLoading":
        "OpenStreetMap yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.",
      "confirm.toast.geoUnsupported": "Tarayıcınız konum belirlemeyi desteklemiyor.",
      "confirm.toast.geoFailed": "Konum alınamadı. Lütfen haritadan elle seçin.",
      "confirm.toast.needName": "Lütfen ismi girin.",
      "confirm.toast.needPhone": "Lütfen telefon numarasını girin.",
      "confirm.toast.needAddress": "Lütfen adresi ayrıntılı yazın.",
      "confirm.toast.needPayment": "Lütfen bir ödeme yöntemi seçin.",
      "confirm.whatsapp.header": "{{brand}} için yeni sipariş 🌿🐄",
      "confirm.whatsapp.details": "🧾 Sipariş detayları:",
      "confirm.whatsapp.cut": "Kesim şekli",
      "confirm.whatsapp.note": "Not",
      "confirm.whatsapp.total": "💰 Tahmini toplam: {{total}}",
      "confirm.whatsapp.noteLine":
        "ℹ️ Not: Toplam tutar tahminidir, gerçek tartımdan sonra küçük farklar olabilir.",
      "confirm.whatsapp.customer": "👤 İsim: {{name}}",
      "confirm.whatsapp.phone": "📞 Telefon: {{phone}}",
      "confirm.whatsapp.payment": "💳 Ödeme yöntemi: {{method}}",
      "confirm.whatsapp.pickup": "🏪 Teslimat şekli: Mağazadan teslim",
      "confirm.whatsapp.address": "🏠 Adres: {{address}}",
      "confirm.whatsapp.addressFallback": "Belirtilmedi",
      "confirm.whatsapp.location": "🧭 Konum: {{link}}",
      "confirm.whatsapp.delivery": "🚚 Teslimat şekli: {{method}}",
    },
  };

  const listeners = new Set();

  const ensureGateRef = () => {
    if (!gateEl) gateEl = document.querySelector("[data-lang-gate]");
    return gateEl;
  };

  const ensureFabRefs = () => {
    if (!fabEl) fabEl = document.querySelector("[data-lang-fab]");
    if (fabEl && !fabToggle)
      fabToggle = fabEl.querySelector("[data-lang-fab-toggle]");
    if (fabEl && !fabMenu)
      fabMenu = fabEl.querySelector("[data-lang-fab-menu]");
    if (fabEl && !fabFlag) fabFlag = fabEl.querySelector("[data-lang-flag-img]");
  };

  const hasStoredLang = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && SUPPORTED.includes(stored);
    } catch (_) {
      return false;
    }
  };

  const showGate = () => {
    const el = ensureGateRef();
    if (!el) return;
    el.hidden = false;
    gateVisible = true;
    ensureFabRefs();
    if (fabEl) fabEl.hidden = true;
    requestAnimationFrame(() => el.classList.add("is-visible"));
  };

  const hideGate = () => {
    const el = ensureGateRef();
    if (!el) return;
    el.classList.remove("is-visible");
    gateVisible = false;
    ensureFabRefs();
    if (fabEl) fabEl.hidden = false;
    window.setTimeout(() => {
      if (!gateVisible && el) el.hidden = true;
    }, 240);
  };

  const setGateVisible = (visible) => {
    if (visible) showGate();
    else hideGate();
  };

  const setFabMenuOpen = (open) => {
    ensureFabRefs();
    if (!fabEl) return;
    fabMenuOpen = Boolean(open);
    fabEl.classList.toggle("is-open", fabMenuOpen);
    if (fabToggle)
      fabToggle.setAttribute("aria-expanded", fabMenuOpen ? "true" : "false");
  };

  const format = (template, params) => {
    if (!params) return template;
    return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
      return key in params ? params[key] : m;
    });
  };

  const getInitialLang = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) {}
    const htmlLang = (document.documentElement.getAttribute("lang") || "").split("-")[0];
    if (SUPPORTED.includes(htmlLang)) return htmlLang;
    return DEFAULT_LANG;
  };

  let currentLang = getInitialLang();

  const t = (key, params) => {
    const dict = translations[currentLang] || {};
    let template = dict[key];
    if (template == null) template = translations[DEFAULT_LANG]?.[key];
    if (template == null) return params ? format(key, params) : key;
    return typeof template === "function" ? template(params || {}, currentLang) : format(template, params);
  };

  const updateDirection = () => {
    const dir = currentLang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", currentLang);
    if (document.body) {
      document.body.classList.toggle("lang-ar", currentLang === "ar");
      document.body.classList.toggle("lang-tr", currentLang === "tr");
    }
  };

  const updateFab = () => {
    ensureFabRefs();
    if (!fabEl) return;
    fabEl.hidden = gateVisible;
    const flagMeta = FLAG_IMAGES[currentLang] || FALLBACK_FLAG;
    if (fabFlag) {
      fabFlag.setAttribute("src", flagMeta.src);
      fabFlag.setAttribute("alt", flagMeta.alt || "");
      fabFlag.setAttribute("data-lang-code", currentLang);
    }
    if (fabToggle) {
      const label = t("common.langSwitch.label");
      if (label && label !== "common.langSwitch.label") {
        fabToggle.setAttribute("aria-label", label);
        fabToggle.setAttribute("title", label);
      } else {
        fabToggle.setAttribute("aria-label", "Change language");
        fabToggle.setAttribute("title", "Change language");
      }
    }
  };

  const applyTranslations = (root = document) => {
    const textNodes = root.querySelectorAll("[data-i18n]");
    textNodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const value = t(key);
      if (value == null) return;
      if (el.tagName === "TITLE") {
        document.title = value;
      } else {
        el.textContent = value;
      }
    });

    const htmlNodes = root.querySelectorAll("[data-i18n-html]");
    htmlNodes.forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (!key) return;
      const value = t(key);
      if (value == null) return;
      el.innerHTML = value;
    });

    const placeholderNodes = root.querySelectorAll("[data-i18n-placeholder]");
    placeholderNodes.forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      const value = t(key);
      if (value == null) return;
      el.setAttribute("placeholder", value);
    });

    const titleNodes = root.querySelectorAll("[data-i18n-title]");
    titleNodes.forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      const value = t(key);
      if (value == null) return;
      el.setAttribute("title", value);
    });

    root.querySelectorAll("[data-i18n-value]").forEach((el) => {
      const key = el.getAttribute("data-i18n-value");
      if (!key) return;
      const value = t(key);
      if (value == null) return;
      el.setAttribute("value", value);
    });

    root.querySelectorAll("[data-i18n-attrs]").forEach((el) => {
      const entries = (el.getAttribute("data-i18n-attrs") || "").split(",");
      entries.forEach((entry) => {
        const [attr, key] = entry.split(":").map((s) => s.trim());
        if (!attr || !key) return;
        const value = t(key);
        if (value == null) return;
        el.setAttribute(attr, value);
      });
    });

    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const raw = el.getAttribute("data-i18n-attr");
      if (!raw) return;
      try {
        const map = JSON.parse(raw);
        Object.entries(map).forEach(([attr, key]) => {
          const value = t(key);
          if (value == null) return;
          el.setAttribute(attr, value);
        });
      } catch (_) {}
    });
  };

  const updateSwitchers = () => {
    document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
      const lang = btn.getAttribute("data-lang");
      const active = lang === currentLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    updateFab();
  };

  const notify = () => {
    listeners.forEach((fn) => {
      try {
        fn(currentLang);
      } catch (_) {}
    });
  };

  const setLang = (lang) => {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, currentLang);
    } catch (_) {}
    updateDirection();
    applyTranslations(document);
    updateSwitchers();
    notify();
    hideGate();
    setFabMenuOpen(false);
  };

  const getLang = () => currentLang;

  const onChange = (fn) => {
    if (typeof fn !== "function") return () => {};
    listeners.add(fn);
    try {
      fn(currentLang);
    } catch (_) {}
    return () => listeners.delete(fn);
  };

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-lang-fab-toggle]");
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      setFabMenuOpen(!fabMenuOpen);
      return;
    }

    const btn = e.target.closest(".lang-switch [data-lang]");
    if (btn) {
      e.preventDefault();
      const lang = btn.getAttribute("data-lang");
      if (lang) setLang(lang);
      return;
    }

    ensureFabRefs();
    if (fabEl && fabMenuOpen && !fabEl.contains(e.target)) {
      setFabMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setFabMenuOpen(false);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureGateRef();
    ensureFabRefs();
    if (fabToggle && !fabToggle.getAttribute("aria-expanded")) {
      fabToggle.setAttribute("aria-expanded", "false");
    }
    setGateVisible(!hasStoredLang());
    updateDirection();
    applyTranslations(document);
    updateSwitchers();
    notify();
  });

  updateDirection();

  window.i18n = {
    t,
    setLang,
    getLang,
    onChange,
    apply: () => applyTranslations(document),
  };
})();
