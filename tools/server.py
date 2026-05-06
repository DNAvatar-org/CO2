#!/usr/bin/env python3
# File: tools/server.py - Serveur HTTP sur le port 8000 (http://localhost:8000/index.html)
# Desc: Sert le projet. Sans COOP/COEP pour permettre scripts/fonts cross-origin (signature, Plotly CDN).
#       Workers utilisent Transferable, pas SharedArrayBuffer → pas besoin de COEP.
#       POST /_log : append par topic vers ../logs/<topic>.txt (logs_to_server.js, debug miroir CONFIG_COMPUTE.log*).
# Version 1.3.0
# Copyright 2025-2026 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: May 06, 2026
# Logs:
# - v1.3.0 POST /_log → bilan_radiatif/logs/{topic}.txt (whitelist albedoUi, eds, …) + reset { "reset": topic }
# - v1.2.0 Retrait COOP/COEP : bloque scripts externes (dnavatar.org, cdn.plot.ly) ; workers = Transferable
# - v1.1.0 Add Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy headers for SharedArrayBuffer
import http.server
import json
import os
import socketserver
import sys
from urllib.parse import urlparse

PORT = 8000
# Servir depuis CO2/ (répertoire parent de tools/)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(_root)

# Racine du dépôt bilan_radiatif (parent de CO2/)
_SITE_ROOT = os.path.normpath(os.path.join(_root, ".."))
_LOG_DIR = os.path.join(_SITE_ROOT, "logs")

# Aligné sur CO2/static/logs_to_server.js CONFIG_LOG_FILE_TOPIC.values()
_ALLOWED_LOG_TOPICS = frozenset({
    "eds", "iceFixed", "iceFraction", "co2Rad", "cloudProxy", "iris", "co2Partition",
    "hyst", "epoch", "albedoUi",
})


class RadiatifLogHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.rstrip("/") != "/_log":
            self.send_error(404, "POST only /_log")
            return
        try:
            n = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            n = 0
        raw = self.rfile.read(n) if n > 0 else b"{}"
        try:
            data = json.loads(raw.decode("utf-8", errors="replace"))
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            return

        if isinstance(data, dict) and "reset" in data:
            topic = data.get("reset")
            if isinstance(topic, str) and topic in _ALLOWED_LOG_TOPICS:
                os.makedirs(_LOG_DIR, exist_ok=True)
                path = os.path.join(_LOG_DIR, topic + ".txt")
                with open(path, "w", encoding="utf-8"):
                    pass
            self.send_response(204)
            self.end_headers()
            return

        if not isinstance(data, list):
            self.send_response(400)
            self.end_headers()
            return

        os.makedirs(_LOG_DIR, exist_ok=True)
        for entry in data:
            if not isinstance(entry, dict):
                continue
            topic = entry.get("topic")
            if topic not in _ALLOWED_LOG_TOPICS:
                continue
            msg = entry.get("msg")
            if msg is None:
                continue
            line = str(msg).replace("\r\n", "\n").replace("\r", "\n")
            path = os.path.join(_LOG_DIR, topic + ".txt")
            with open(path, "a", encoding="utf-8") as f:
                f.write(line + "\n")

        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), RadiatifLogHandler) as httpd:
        print("Serveur sur http://localhost:{}/ (racine CO2: {})".format(PORT, _root))
        print("Logs POST /_log → {}".format(_LOG_DIR))
        httpd.serve_forever()
