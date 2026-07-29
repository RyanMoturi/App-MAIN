const parseCoordinate = (value, min, max) => {
  if (value === null || value === undefined || value === "") return null;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null;
};

const locationFields = (source = {}) => ({
  location: String(source.location || "").trim(),
  apartment: String(source.apartment || "").trim() || null,
  latitude: parseCoordinate(source.latitude, -90, 90),
  longitude: parseCoordinate(source.longitude, -180, 180),
  place_id: String(source.place_id || source.placeId || "").trim() || null,
});

const hasCoordinates = ({ latitude, longitude } = {}) =>
  parseCoordinate(latitude, -90, 90) !== null &&
  parseCoordinate(longitude, -180, 180) !== null;

const distanceInKilometres = (from, to) => {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(Number(to.latitude) - Number(from.latitude));
  const longitudeDelta = toRadians(
    Number(to.longitude) - Number(from.longitude)
  );
  const fromLatitude = toRadians(Number(from.latitude));
  const toLatitude = toRadians(Number(to.latitude));

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

module.exports = {
  distanceInKilometres,
  hasCoordinates,
  locationFields,
  parseCoordinate,
};
