// File: CO2/static/histoire/interaction.js
// Desc: Glisser pour naviguer ; molette = zoom du temps (X) ; Shift + molette = zoom de la température (Y).
//       Chaque geste est suivi de H.borner() : on ne voit jamais avant −5000 Ma ni après 2025.
// Version 1.3.0
// Date: 2026-10-26
// logs :
//   - v1.3.0: clic sur le bouton « 65° N » : affiche ou masque l'insolation d'été (H.insolVisible, rendu.js).
//     Bulle retournée à gauche / au-dessus du curseur quand elle déborderait de la page.
//   - v1.2.0: clic (sans glisser) sur un logo d'époque → l'index lance l'époque, comme la frise (histoire:epoque).
//   - v1.1.0: survol → bulle avec la SOURCE de ce qui est sous le curseur (H.survol, rendu.js).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.brancherInteractions = function (canvas, redessiner) {
        const v = H.vue;
        let isDragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0;
        canvas.addEventListener('mousedown', e => { isDragging = true; lastX = downX = e.clientX; lastY = downY = e.clientY; });
        // Clic sur un logo d'époque, sans avoir glissé : l'index (static/ui/onglets_graphe.js) le joue comme un clic de frise.
        canvas.addEventListener('click', e => {
            if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) return;
            if (H.surBoutonInsolation(e.clientX, e.clientY)) { H.insolVisible = !H.insolVisible; redessiner(); return; }
            const id = H.cible(e.clientX, e.clientY);
            if (id !== null) window.parent.postMessage({ type: 'histoire:epoque', id: id }, '*');
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
        const bulle = document.getElementById('bulle');
        canvas.addEventListener('mousemove', e => {
            if (isDragging || !bulle) return;
            canvas.style.cursor = H.cible(e.clientX, e.clientY) === null && !H.surBoutonInsolation(e.clientX, e.clientY) ? '' : 'pointer';
            const t = H.survol(e.clientX, e.clientY);
            bulle.hidden = !t;
            if (t) {
                // Mesurée sans contrainte (au coin de la page), puis posée à droite du curseur — à gauche si elle déborderait
                // (bouton « 65° N » au bord droit) ; de même sous le curseur, ou au-dessus.
                bulle.textContent = t; bulle.style.left = '0px'; bulle.style.top = '0px';
                const w = bulle.offsetWidth, h = bulle.offsetHeight;
                bulle.style.left = (e.clientX + 14 + w > window.innerWidth ? e.clientX - 14 - w : e.clientX + 14) + 'px';
                bulle.style.top = (e.clientY + 14 + h > window.innerHeight ? e.clientY - 14 - h : e.clientY + 14) + 'px';
            }
        });
        canvas.addEventListener('mouseleave', () => { if (bulle) bulle.hidden = true; });
        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            v.xOffset += (e.clientX - lastX) / v.xScale;
            v.yOffset += (e.clientY - lastY) / v.yScale;
            lastX = e.clientX; lastY = e.clientY;
            H.borner(); redessiner();
        });
        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
            if (delta === 0) return;
            const zoomFactor = delta > 0 ? 0.85 : 1.15;
            if (e.shiftKey) {            // température (Y), centrée sur le curseur
                const mouseTemp = v.yOffset + (v.height / 2 - e.clientY) / v.yScale;
                v.yScale *= zoomFactor;
                v.yOffset = mouseTemp - (v.height / 2 - e.clientY) / v.yScale;
            } else {                     // temps (X), centré sur le curseur
                const mouseTime = v.xOffset - e.clientX / v.xScale;
                v.xScale *= zoomFactor;
                v.xOffset = mouseTime + e.clientX / v.xScale;
            }
            H.borner(); redessiner();
        }, { passive: false });
    };
})();
