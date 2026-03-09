// File: API_BILAN/workers/compute_worker.js - Worker pour cycles de calcul (amorce multithread)
// Desc: Thread dédié calcul ; main thread réservé GUI/DOM uniquement.
// Version 0.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-25
// Logs: v0.1.0 stub ready, run -> stub (compute à migrer depuis main)

'use strict';

self.postMessage({ type: 'ready' });

self.onmessage = function (e) {
    const msg = e.data;
    if (msg && msg.type === 'run') {
        // TODO: exécuter computeRadiativeTransfer / cycles ici, postMessage(result)
        self.postMessage({ type: 'stub', message: 'compute not yet in worker' });
    }
};
