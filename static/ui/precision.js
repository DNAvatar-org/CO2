// File: CO2/static/ui/precision.js
// Desc: Le réglage « Précision » du bandeau du bas : la précision sur T que la page demande au moteur (api.run precisionK,
//       DATA['🔘']['🔘🔬'], en K). Plus lâche = moins de pas du solveur : sur 📱, ~40 s au plus fin, ~20 s à 0,5 K.
// Version 1.0.0
// Date: 2026-11-17
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.PRECISION = (function () {
    'use strict';
    /** Choix offerts [K] ; 0 = la plus fine que l'époque permet (EPOCH.🧲🔬). */
    const CHOIX = [
        { k: 0, libelle: 'Fine' },
        { k: 0.05, libelle: '0,05 °C' },
        { k: 0.1, libelle: '0,1 °C' },
        { k: 0.5, libelle: '0,5 °C' }
    ];
    /** La cellule du bandeau : un titre et une liste ; le choix va dans DATA['🔘']['🔘🔬'], lu au prochain calcul. */
    function cellule() {
        const cell = document.createElement('div');
        cell.id = 'bandeau-bas-precision';
        cell.className = 'bandeau-bas-precision';
        cell.title = 'Précision demandée sur la température : plus lâche, le calcul fait moins de pas';
        const titre = document.createElement('span');
        titre.className = 'bandeau-bas-precision__titre';
        titre.textContent = 'Précision';
        const liste = document.createElement('select');
        liste.className = 'bandeau-bas-precision__liste';
        liste.setAttribute('aria-label', 'Précision du calcul');
        for (const c of CHOIX) {
            const o = document.createElement('option');
            o.value = String(c.k);
            o.textContent = c.libelle;
            o.selected = c.k === window.DATA['🔘']['🔘🔬'];
            liste.append(o);
        }
        liste.addEventListener('change', function () { window.DATA['🔘']['🔘🔬'] = Number(liste.value); });
        cell.append(titre, liste);
        return cell;
    }
    return { cellule: cellule };
})();
