(function () {
  if (typeof window === "undefined") {
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      })
      .catch(function () {
        // Ignore cleanup failures in development.
      });
  }

  if ("caches" in window) {
    caches
      .keys()
      .then(function (keys) {
        keys.forEach(function (key) {
          if (key.indexOf("bathala-") === 0) {
            caches.delete(key);
          }
        });
      })
      .catch(function () {
        // Ignore cleanup failures in development.
      });
  }
})();
