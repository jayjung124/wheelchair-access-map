// 🔗 Google Sheet에서 공개된 CSV 파일 링크
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Z2qzOUo5U5RZ5-cV79UeGsO6SzYY7GbJenPWVLKhx8-8S-yWZ0z6UFDd07_bHZ5mT3pFA6FP-r8b/pub?output=csv';

// ✅ 이미지 링크 변환 함수
function convertImageLink(url) {
  // 구글 드라이브 링크이면 변환, 아니면 그대로 사용 (예: GitHub raw 이미지 링크)
  const match = url.match(/\/d\/(.*?)\//);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
}

// ✅ CSV 파싱 함수
function parseCSV(text) {
  const rows = text.trim().split('\n').map(r => r.split(','));
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const obj = {};
    row.forEach((val, i) => {
      obj[headers[i]] = val.trim();
    });
    return obj;
  });
}

// ✅ Google Map 초기화 및 마커 생성
function initMap() {
  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      const locations = parseCSV(csvText);
      console.log("Parsed locations:", locations);

      // 지도 생성
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: { lat: 42.35, lng: -71.08 },
      });

      // 각 위치마다 마커 및 정보창 생성
      locations.forEach(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const isAccessible = loc.accessible.toLowerCase() === 'true';
        const icon = isAccessible
          ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          icon,
        });

        const imageUrl = convertImageLink(loc.Image_url || '');

        const infoContent = `
          <div>
            <h3>${loc.name}</h3>
            <p>
              ♿ Wheelchair ${isAccessible ? 'Accessible ✅' : 'Inaccessible ❌'}
            </p>
            ${imageUrl ? `<img src="${imageUrl}" width="200"/>` : ''}
          </div>
        `;

        const infowindow = new google.maps.InfoWindow({
          content: infoContent,
        });

        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });
      });
    })
    .catch(error => {
      alert("Failed to load data.");
      console.error("Fetch or Parse Error:", error);
    });
}
