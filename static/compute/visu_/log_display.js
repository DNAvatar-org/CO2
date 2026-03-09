// File: static/compute/visu_/log_display.js - Helper affichage / logs (visu)
// Desc: Formatage objet → chaîne pour logs (nombres en scientifique ou 2 décimales). Vue visu + contexte index/API.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-03-08

(function () {
    'use strict';
    const STRINGIFY_MAX_DEPTH = 4;
    function stringifyScientific(obj, depth) {
        if (depth == null) depth = 0;
        if (depth > STRINGIFY_MAX_DEPTH) return '…';
        if (obj === null) return 'null';
        if (typeof obj === 'number') {
            if (Number.isNaN(obj)) return 'null';
            if (!Number.isFinite(obj)) return obj > 0 ? 'Infinity' : '-Infinity';
            if (Math.abs(obj) >= 1e3 || (Math.abs(obj) < 1e-3 && obj !== 0)) return obj.toExponential(2);
            return obj.toFixed(2);
        }
        if (typeof obj === 'string') return JSON.stringify(obj);
        if (typeof obj === 'boolean') return obj ? 'true' : 'false';
        if (Array.isArray(obj)) return '[' + obj.slice(0, 5).map(function (v) { return stringifyScientific(v, depth + 1); }).join(',') + (obj.length > 5 ? ',…' : '') + ']';
        if (typeof obj === 'object') {
            const keys = Object.keys(obj).slice(0, 15);
            const pairs = keys.map(function (k) { return JSON.stringify(k) + ':' + stringifyScientific(obj[k], depth + 1); });
            return '{' + pairs.join(',') + (Object.keys(obj).length > 15 ? ',…' : '') + '}';
        }
        return String(obj);
    }
    window.stringifyScientificForLog = function (o) { return stringifyScientific(o, 0); };
})();
