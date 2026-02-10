# File: hitran_fetch_lines.py - Fetch HITRAN lines (CO2, H2O, CH4) et export JSON
# Desc: Utilise HAPI (hitran-api) pour télécharger les lignes dans les bandes LW, export pour hitran.js.
# Version 1.0.0
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: 2025-02-06
# Logs:
# - Initial: fetch CO2 (100-850), H2O (100-850, 1200-2000), CH4 (900-1600, 2600-3400) cm-1, export JSON.

"""
Usage: depuis la racine du projet CO2:
  python scripts/hitran_fetch_lines.py

Sortie: static/data/hitran_lines_CO2.json, hitran_lines_H2O.json, hitran_lines_CH4.json
Chaque fichier contient un tableau de lignes: nu, sw, elower, gamma_air, gamma_self, n_air, delta_air.
Réf. doc/HITRAN.txt, doc/PLAN_HITRAN_CROSS_SECTIONS.md.
"""

import json
import os
import sys

# HAPI (hitran-api)
try:
    import hapi
except ImportError:
    print("[hitran_fetch_lines] hapi non trouvé. Installer: pip install hitran-api")
    sys.exit(1)

# Bandes wavenumber (cm-1) pour LW / bandes clés (doc/PLAN_HITRAN_CROSS_SECTIONS.md)
BANDS = {
    "CO2": [(100, 850)],                                    # 15 µm
    "H2O": [(100, 850), (1200, 2000)],                      # 17 µm, 6.3 µm
    "CH4": [(900, 1600), (2600, 3400)],                     # 7.7 µm, 3.3 µm
}
# HITRAN molecule ID: 1=H2O, 2=CO2, 6=CH4. Isotopologue 1 = principal.
MOL_ID = {"CO2": 2, "H2O": 1, "CH4": 6}
PARAM_NAMES = ["nu", "sw", "elower", "gamma_air", "gamma_self", "n_air", "delta_air"]


def _to_float(x):
    return float(x) if x is not None else 0.0


def fetch_molecule(name, mol_id, bands):
    table_name = "hitran_" + name
    lines = []
    for (numin, numax) in bands:
        tbl = table_name + "_" + str(numin)
        hapi.fetch(tbl, mol_id, 1, numin, numax)
        cols = hapi.getColumns(tbl, PARAM_NAMES)
        n = len(cols[0])
        for i in range(n):
            lines.append({
                "nu": round(_to_float(cols[0][i]), 4),
                "sw": _to_float(cols[1][i]),
                "elower": _to_float(cols[2][i]),
                "gamma_air": _to_float(cols[3][i]),
                "gamma_self": _to_float(cols[4][i]),
                "n_air": _to_float(cols[5][i]),
                "delta_air": _to_float(cols[6][i]),
            })
    return lines


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "static", "data")
    os.makedirs(out_dir, exist_ok=True)

    for name in ["CO2", "H2O", "CH4"]:
        mol_id = MOL_ID[name]
        bands = BANDS[name]
        lines = fetch_molecule(name, mol_id, bands)
        out_path = os.path.join(out_dir, "hitran_lines_" + name + ".json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(lines, f, separators=(",", ":"))
        print("[hitran_fetch_lines] %s: %d lignes -> %s" % (name, len(lines), out_path))
        js_path = os.path.join(out_dir, "hitran_lines_" + name + ".js")
        with open(js_path, "w", encoding="utf-8") as f:
            f.write("window.HITRAN_LINES_%s=" % name + json.dumps(lines, separators=(",", ":")) + ";\n")
        print("[hitran_fetch_lines] %s -> %s" % (name, js_path))

    print("[hitran_fetch_lines] Terminé.")


if __name__ == "__main__":
    main()
