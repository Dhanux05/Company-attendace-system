const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.isWithinOffice = (userLat, userLng) => {
  const officeLat = parseFloat(process.env.OFFICE_LAT || '12.9716');
  const officeLng = parseFloat(process.env.OFFICE_LNG || '77.5946');
  const radius = parseFloat(process.env.OFFICE_RADIUS || '100');
  const distance = haversineDistance(officeLat, officeLng, userLat, userLng);
  return { withinRange: distance <= radius, distance: Math.round(distance) };
};
