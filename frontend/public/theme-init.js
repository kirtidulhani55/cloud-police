(function () {
  try {
    var saved = localStorage.getItem('cloud_police_theme_mode_v2');
    var prefersDark =
      !saved &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    document.documentElement.classList.toggle(
      'dark',
      saved === 'dark' || Boolean(prefersDark)
    );
  } catch (_error) {
    // The React application applies the saved preference after it starts.
  }
})();
