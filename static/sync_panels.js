// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime entre panneau Visuel et iframe Scientifique
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-03
// Logs:
// - Initial: sync epoch, anim, ticTime via postMessage

(function () {
    'use strict';

    // État partagé (source de vérité côté parent)
    window.SYNC_STATE = {
        epochId: '⚫',
        animEnabled: true,
        ticTime: 0
    };

    function getIframe() {
        return document.getElementById('scie-iframe');
    }

    function syncToScie(payload) {
        var s = payload || window.SYNC_STATE;
        if (s.epochId !== undefined) window.SYNC_STATE.epochId = s.epochId;
        if (s.animEnabled !== undefined) window.SYNC_STATE.animEnabled = s.animEnabled;
        if (s.ticTime !== undefined) window.SYNC_STATE.ticTime = s.ticTime;

        var iframe = getIframe();
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({
                    type: 'sync:state',
                    payload: {
                        epochId: window.SYNC_STATE.epochId,
                        animEnabled: window.SYNC_STATE.animEnabled,
                        ticTime: window.SYNC_STATE.ticTime
                    }
                }, '*');
            } catch (e) {}
        }
    }

    function applyToVisu(payload) {
        if (!payload) return;
        var visuPanel = document.getElementById('visu-panel');
        if (!visuPanel) return;

        if (payload.epochId !== undefined) {
            window.SYNC_STATE.epochId = payload.epochId;
            try {
                if (typeof window.setEpoch === 'function') {
                    window.setEpoch(payload.epochId);
                }
            } catch (e) {}
            var epochBtns = visuPanel.querySelectorAll('.epoch-btn');
            epochBtns.forEach(function (btn) {
                btn.classList.toggle('selected', btn.getAttribute('data-epoch') === payload.epochId);
            });
        }
        if (payload.animEnabled !== undefined) {
            window.SYNC_STATE.animEnabled = payload.animEnabled;
            var animBtn = document.getElementById('plot-anim-toggle');
            if (animBtn) {
                animBtn.classList.toggle('selected', payload.animEnabled);
            }
            var cb = document.getElementById('plot-anim-toggle-checkbox');
            if (cb) cb.checked = payload.animEnabled;
            if (window.DATA && window.DATA['🔘']) {
                window.DATA['🔘']['🔘🎬'] = payload.animEnabled;
            }
            if (typeof window.isAnim !== 'undefined') window.isAnim = payload.animEnabled;
        }
        if (payload.ticTime !== undefined) {
            window.SYNC_STATE.ticTime = payload.ticTime;
            if (typeof window.infoTimeMa !== 'undefined') {
                window.infoTimeMa = payload.ticTime * 50;
            }
            if (window.DATA && window.DATA['📜']) {
                window.DATA['📜']['📿💫'] = payload.ticTime;
            }
            var infoTimeEl = document.getElementById('info-time');
            if (infoTimeEl) {
                infoTimeEl.textContent = '+' + (payload.ticTime * 50).toFixed(0) + ' Ma';
            }
        }
    }

    function initSyncPanels() {
        window.syncToScie = syncToScie;

        window.addEventListener('message', function (event) {
            if (!event.data || event.data.type !== 'sync:state') return;
            var p = event.data.payload;
            if (!p) return;
            applyToVisu(p);
        });

        if (window.CO2_EVENTS) {
            window.CO2_EVENTS.on('sync:state', function (payload) {
                if (payload) {
                    if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
                    if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
                    if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
                    syncToScie();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
