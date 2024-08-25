const dayjs = require('dayjs');

function searchNearbyCarpools(carpoolList, from_lat, from_lon, to_lat, to_lon, dateTime) {
    // Calculate distances to each place
    carpoolList.forEach(carpool => {
        carpool.fromDistance = calculateDistance(from_lat, from_lon, carpool.from_lat, carpool.from_long);
    });

    carpoolList.forEach(carpool => {
        carpool.toDistance = calculateDistance(to_lat, to_lon, carpool.to_lat, carpool.to_long);
    });

    carpoolList.sort((a, b) => {
        if (a.from_lat === b.from_lat && a.from_long === b.from_long) {

            if (a.to_lat === b.to_lat && a.to_long === b.to_long) {
                const dateA = dayjs(a.carpool_dateTime)
                const dateB = dayjs(b.carpool_dateTime)
                const diffA = Math.abs(dateA.diff(dateTime, 'second'));
                const diffB = Math.abs(dateB.diff(dateTime, 'second'));

                return diffA - diffB;
            }
            else {
                return a.toDistance - b.toDistance
            }
        }
        else {
            return a.fromDistance - b.fromDistance
        }
    })
    return carpoolList;
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

module.exports = { searchNearbyCarpools }
