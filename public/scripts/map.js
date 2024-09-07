async function fetchData(username) {
    const response = await fetch(`/data/${username}`);
    if (!response.ok) {
        throw new Error('User not found');
    }
    const the_response = await response.json();

    // the_response is either the data itself or the_response.data is the one we are expecting
    const data = the_response.data || the_response;
    
    // Check if the data is indeed an array
    if (!Array.isArray(data)) {
        throw new Error('Expected an array of data but received something else');
    }

    return data.map(item => ({
        lat: item.coords.latitude,
        lng: item.coords.longitude,
        title: item.activityType
    }));
}


async function initMap() {
    try {
        const fullPath = window.location.pathname.split('/');
        const username = fullPath[1];
        //const queryParams = window.location.search.slice(1).split('?');
        // Log the username and query parameters
        // console.log(`Username1: ${username}`);
        // console.log(`queryParams1: ${queryParams}`);

        // queryParams.forEach(param => {
        //     const [key, value] = param.split(':');
        //     console.log(`1-${key} is ${value}`);
        // });

        // Fetch the data and assign it to jsonData
        const jsonData = await fetchData(username);

        const firstPin = jsonData[0];
        const lastPin = jsonData[jsonData.length - 1];

        const mapCenter = { lat: (firstPin.lat + lastPin.lat) / 2, lng: (firstPin.lng + lastPin.lng) / 2 };

        const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 15,
            center: mapCenter,
            mapId: `${username}_map`,
        });

        // Create a pin element.
        const firstPinContent = new google.maps.marker.PinElement({
            scale: 2,
            background: '#000000',
            borderColor: '#000000',
            glyphColor: '#FFFFFF',
            glyph: "S",
        });
        // A marker with a with a URL pointing to a PNG.
        // const startImg = document.createElement("img");
        // startImg.src = "../images/start.png";        
        new google.maps.marker.AdvancedMarkerElement({
            position: { lat: firstPin.lat, lng: firstPin.lng },
            map: map,
            title: firstPin.title,
            content: firstPinContent.element,
        });
        // const endImg = document.createElement("img");
        // endImg.src = "../images/end.webp";     
        const lastPinContent = new google.maps.marker.PinElement({
            scale: 2,
            background: '#0000ff',
            borderColor: '#0000ff',
            glyphColor: '#FFFFFF',
            glyph: "E",
        });
        new google.maps.marker.AdvancedMarkerElement({
            position: { lat: lastPin.lat, lng: lastPin.lng },
            map: map,
            title: lastPin.title,
            content: lastPinContent.element,
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
        let errorMessage = `
            <p>Böyle bir kullanıcı yok</p>
            <p>Error: ${error.message}</p>
            <pre>${error.stack}</pre>
        `;
        document.body.innerHTML = errorMessage;
    }
}
