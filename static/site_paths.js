// File: static/site_paths.js - Racines URL absolues (OVH / localhost:8001)
// Desc: Chemins partagés hors CO2 ; évite ../../ relatif à la profondeur pages/bilan_radiatif/
// Version 1.0.1
// Date: July 13, 2025
// Logs:
// - v1.0.1: CO2 racine — /CO2/ local (alias serve_site), /pages/bilan_radiatif/CO2/ OVH
// - v1.0.0: INTERFACES → /_interfaces/ (www/_interfaces OVH ; site/_interfaces local)

(function () {
    var host = window.location.hostname;
    var local = host === 'localhost' || host === '127.0.0.1';
    window.SITE_PATHS = {
        INTERFACES: '/_interfaces/',
        CO2: local ? '/CO2/' : '/pages/bilan_radiatif/CO2/',
    };
})();
