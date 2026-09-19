// File: CO2/static/scie/scie_debug_click.js - Pile Z complète au clic (diagnostic)
// Desc: DEBUG TEMPORAIRE conservé tel quel : journalise tous les éléments sous le curseur au clic, avec leur
//       pointer-events. Sert à trouver qui intercepte un clic. À retirer quand le diagnostic sera clos.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis le second <script> en ligne de CO2/html/scie_compute.html, code inchangé.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* DEBUG TEMPORAIRE — pile Z complète au clic (elementsFromPoint inclut pointer-events:none) */
document.addEventListener('click', function(e) {
    var all = document.elementsFromPoint(e.clientX, e.clientY);
    console.group('🖱 CLICK @ ' + e.clientX + ',' + e.clientY);
    all.forEach(function(el, i) {
        var pe = window.getComputedStyle(el).pointerEvents;
        console.log(
            i + ' | pe=' + pe + ' | ' +
            el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (el.className && typeof el.className === 'string' ? '.' + el.className.trim().replace(/\s+/g, '.') : '')
        );
    });
    console.groupEnd();
}, true);
