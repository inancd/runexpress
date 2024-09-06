async function fetchData(username) {
    const response = await fetch(`/data/${username}`);
    if (!response.ok) {
        throw new Error('User not found');
    }
    const data = await response.json();
    return data.map(item => ({
        lat: item.coords.latitude,
        lng: item.coords.longitude,
        title: item.activityType
    }));
}

async function initMap() {
    try {
        const username = window.location.pathname.split('/')[1];
        const jsonData = await fetchData(username);


        const firstPin = jsonData[0];
        const lastPin = jsonData[jsonData.length - 1];

        const mapCenter = { lat: (firstPin.lat + lastPin.lat) / 2, lng: (firstPin.lng + lastPin.lng) / 2 };

        const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 22,
            center: mapCenter
        });


        new google.maps.Marker({
            position: { lat: firstPin.lat, lng: firstPin.lng },
            map: map,
            title: firstPin.title,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#000000',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#000000'
            }
        });


        new google.maps.Marker({
            position: { lat: lastPin.lat, lng: lastPin.lng },
            map: map,
            title: lastPin.title,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#00FF00',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#00FF00'
            }
        });


        const routePath = new google.maps.Polyline({
            path: jsonData.map(point => ({
                lat: point.lat,
                lng: point.lng
            })),
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });


        routePath.setMap(map);

    } catch (error) {
        document.body.innerHTML = '<p>Böyle bir kullanıcı yok</p>';
    }
}