// ✅ دوال تحديد الموقع الجغرافي
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371000; // نصف قطر الأرض بالمتر
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function isUserInRange() {
  const locationSelect = document.getElementById("location");
  const selected = locationSelect.value;

  const locations = {
    "المركز 1": { lat: 21.484817101900646, lng: 39.25697692973232, radius: 100 },
    "المركز 4": { lat: 21.382217207576137, lng: 39.871421802484626, radius: 100 },
    "مكتب أ. محمد": { lat: 21.358667827435426, lng: 39.91056507116383, radius: 100 }
  };

  if (!locations[selected]) return false;

  const { lat: targetLat, lng: targetLng, radius } = locations[selected];

  try {
    const pos = await getCurrentPosition();
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const distance = haversine(userLat, userLng, targetLat, targetLng);
    return distance <= radius;
  } catch (error) {
    alert("⚠️ حدث خطأ أثناء تحديد الموقع: " + error.message);
    return false;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  let actionType = "تسجيل حضور";

  const checkInBtn = document.querySelector(".btn-checkin");
  const checkOutBtn = document.querySelector(".btn-checkout");
  const form = document.querySelector("#attendanceForm");
  const statusMessage = document.getElementById("statusMessage");

  // تحديد نوع العملية
  checkInBtn.addEventListener("click", () => {
    actionType = "تسجيل حضور";
  });

  checkOutBtn.addEventListener("click", () => {
    actionType = "تسجيل انصراف";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
  });

  // إرسال البيانات بعد التحقق الجغرافي
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inRange = await isUserInRange();
    if (!inRange) {
      alert("❌ يجب أن تكون في نطاق الموقع المحدد لتسجيل الحضور أو الانصراف.");
      return;
    }

    const formData = new FormData(form);
    formData.append("actionType", actionType);

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbzXrWg58-NIO_AGPM9khLbRvkvoc586vOIKQMiAX7B4PrfbGj7FUGgdY6PT2PdnbAF6KA/exec", {
        method: "POST",
        body: formData,
      });

      const msg = await res.text();
      statusMessage.textContent = msg;
      statusMessage.style.display = "block";
      statusMessage.style.backgroundColor = msg.includes("✅") ? "#e8f5e9" : "#ffebee";
      statusMessage.style.color = msg.includes("✅") ? "#2e7d32" : "#c62828";
      form.reset();
    } catch (err) {
      statusMessage.textContent = "❌ فشل الاتصال بالخادم";
      statusMessage.style.display = "block";
      statusMessage.style.backgroundColor = "#ffebee";
      statusMessage.style.color = "#c62828";
    }
  });
});