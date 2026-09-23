// File: CO2/static/histoire/interaction.js
// Desc: Glisser pour naviguer ; molette = zoom du temps (X) ; Shift + molette = zoom de la température (Y).
//       Chaque geste est suivi de H.borner() : on ne voit jamais avant −5000 Ma ni après 2025.
// Version 1.1.0
// Date: 2026-09-23
// logs :
//   - v1.1.0: survol → bulle avec la SOURCE de ce qui est sous le curseur (H.survol, rendu.js).
//   - v1.0.0: Shift + molette ne zoomait que dans un sens. Avec Shift, macOS convertit la molette
//     verticale en HORIZONTALE : deltaY vaut 0 et le sens passe dans deltaX. On lit l'un ou l'autre.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.brancherInteractions = function (canvas, redessiner) {
        const v = H.vue;
        let isDragging = false, lastX = 0, lastY = 0;
        canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener('mouseup', () => { isDragging = false; });
        const bulle = document.getElementById('bulle');
        canvas.addEventListener('mousemove', e => {
            if (isDragging || !bulle) return;
            const t = H.survol(e.clientX, e.clientY);
            bulle.hidden = !t;
            if (t) { bulle.textContent = t; bulle.style.left = (e.clientX + 14) + 'px'; bulle.style.top = (e.clientY + 14) + 'px'; }
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
