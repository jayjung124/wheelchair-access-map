async function fetchLocations() {
  const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Z2qzOUo5U5RZ5-cV79UeGsO6SzYY7GbJenPWVLKhx8-8S-yWZ0z6UFDd07_bHZ5mT3pFA6FP-r8b/pub?output=csv";

  const response = await fetch(sheetURL);
  const csvText = await response.text();
  const rows = csvText.split("\n").map(row => row.split(","));

  console.log("RAW rows:", rows);

  const locations = rows.slice(1) // 헤더 제외
    .map(row => ({
      name: row[0],
      lat: parseFloat(row[1]),
      lng: parseFloat(row[2]),
      accessible: row[3]?.trim().toLowerCase() === "true",
      imageUrl: row[4] ? row[4].trim() : ""
    }))
    .filter(loc => !isNaN(loc.lat) && !isNaN(loc.lng));

  console.log("Parsed locations:", locations);
  return locations;
}

function convertDriveLink(url) {
  const match = url.match(/\/d\/(.+?)\//);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
}

async function initMap() {
  const locations = await fetchLocations();
  if (!locations.length) {
    alert("No location data found. Please check the sheet link.");
    return;
  }

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: locations[0].lat, lng: locations[0].lng }
  });

  locations.forEach(location => {
    const marker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map,
      icon: location.accessible
        ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });

    const imageHTML = location.imageUrl
      ? `<img src="${convertDriveLink(location.imageUrl)}" alt="${location.name}" width="200"/>`
      : "";

    const content = `
      <div>
        <h3><strong>${location.name}</strong></h3>
        <p>🦽 Wheelchair ${location.accessible ? "Accessible ✅" : "Inaccessible ❌"}</p>
        ${imageHTML}
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  });
}
