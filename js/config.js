window.CONFIG = window.CONFIG || {};
// ضع هنا مفتاح Google Maps API الخاص بالمتصفح بعد تفعيل الخرائط في Google Cloud.
// خطوات مهمة:
// 1) فعّل Maps JavaScript API (وأي API إضافي تحتاجه مثل Geolocation/Geocoding/Places).
// 2) اربط المشروع بحساب فوترة فعّال وإلا ستظهر رسالة الخطأ مرة أخرى.
// 3) أضف قيود HTTP referrers للمفاتيح: http://localhost:8000/* ،
//    https://*.netlify.app/* ، https://elbereketciftligi.org/*.
// مثال:
// window.CONFIG.GOOGLE_MAPS_KEY = "AIzaSy...your_key_here...";
if (typeof window.CONFIG.GOOGLE_MAPS_KEY === "undefined") {
  window.CONFIG.GOOGLE_MAPS_KEY = "";
}
