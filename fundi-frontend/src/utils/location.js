export const validCoordinate = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
};

export const hasCoordinates = (location) =>
  validCoordinate(location?.latitude, -90, 90) &&
  validCoordinate(location?.longitude, -180, 180);

export const getBrowserLocation = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
        ...options,
      }
    );
  });

export const savedAccountLocation = () => {
  const latitude = localStorage.getItem("latitude");
  const longitude = localStorage.getItem("longitude");

  return hasCoordinates({ latitude, longitude })
    ? {
        latitude: Number(latitude),
        longitude: Number(longitude),
      }
    : null;
};
