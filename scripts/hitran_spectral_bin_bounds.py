# File: hitran_spectral_bin_bounds.py - Bornes bins spectaux depuis HITRAN (une fois, puis en dur)
# Desc: Calcule stepMax_m et nMin à partir des largeurs de raie (γ_L, γ_D) pour la plage LW.
#       Même logique que hitran.js getSpectralBinBoundsFromHITRAN. Exécuter une fois, copier les bornes dans config.
# Version 1.0.0
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: 2025-02-06
# Logs:
# - Initial: lecture hitran_lines_*.json, formules γ_L/γ_D (HITRAN.txt), sortie stepMax_m et nMin.

"""
Usage (depuis la racine du projet CO2):
  python scripts/hitran_spectral_bin_bounds.py

Sortie: stepMax_m (m), nMin (entier). Copier nMin dans configTimeline.js (spectralBinsMinFromHITRAN)
        ou utiliser pour borner DATA['🧮']['🔬🌈'] : N_min <= 🔬🌈 <= N_max.

Réf. static/hitran.js getSpectralBinBoundsFromHITRAN, doc/HITRAN.txt.
"""

import json
import os
import math

# Plage spectrale utilisée par calculations.js (m)
LAMBDA_MIN_M = 0.1e-6
LAMBDA_MAX_M = 100e-6
T_REF_K = 296
P_REF_PA = 101325
P_REF_ATM = P_REF_PA / 101325

# Masses molaires (kg/mol), cohérent physics.js
M = {"CO2": 0.04401, "H2O": 0.01802, "CH4": 0.01604}
X_SELF = {"CO2": 0, "H2O": 0.01, "CH4": 0}
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "data")
FILES = {"CO2": "hitran_lines_CO2.json", "H2O": "hitran_lines_H2O.json", "CH4": "hitran_lines_CH4.json"}


def nu_to_lambda_m(nu_cm):
    return 0.01 / nu_cm


def gamma_lorentz_air(T_k, gamma_air_ref, n_air):
    return gamma_air_ref * (T_REF_K / T_k) ** n_air


def gamma_lorentz_self(T_k, gamma_self_ref, n_self):
    return gamma_self_ref * (T_REF_K / T_k) ** n_self


def gamma_lorentz_total(P_atm, gamma_air_T, gamma_self_T, x_self, x_air):
    return P_atm * (x_self * gamma_self_T + x_air * gamma_air_T)


def gamma_doppler(nu_cm, T_k, M_kg_mol):
    return 3.58e-7 * nu_cm * math.sqrt(T_k / M_kg_mol)


def main():
    nu_min_cm = 0.01 / LAMBDA_MAX_M
    nu_max_cm = 0.01 / LAMBDA_MIN_M
    span_m = LAMBDA_MAX_M - LAMBDA_MIN_M
    step_min_m = float("inf")

    for gas, filename in FILES.items():
        path = os.path.join(DATA_DIR, filename)
        if not os.path.isfile(path):
            print(f"[skip] {path} absent")
            continue
        with open(path, "r", encoding="utf-8") as f:
            lines = json.load(f)
        x_self = X_SELF[gas]
        x_air = 1 - x_self
        M_kg = M[gas]
        for line in lines:
            nu = line.get("nu")
            if nu is None or nu < nu_min_cm or nu > nu_max_cm:
                continue
            g_air_ref = line.get("gamma_air", 0.07)
            g_self_ref = line.get("gamma_self", 0.1)
            n_air = line.get("n_air", 0.75)
            n_self = n_air
            g_air_T = gamma_lorentz_air(T_REF_K, g_air_ref, n_air)
            g_self_T = gamma_lorentz_self(T_REF_K, g_self_ref, n_self)
            gamma_L = gamma_lorentz_total(P_REF_ATM, g_air_T, g_self_T, x_self, x_air)
            gamma_D = gamma_doppler(nu, T_REF_K, M_kg)
            half_width_cm = gamma_L + gamma_D
            lambda_m = nu_to_lambda_m(nu)
            delta_lambda_m = 100 * (lambda_m ** 2) * half_width_cm
            if delta_lambda_m > 0 and delta_lambda_m < step_min_m:
                step_min_m = delta_lambda_m

    if not math.isfinite(step_min_m) or step_min_m <= 0:
        print("Aucune ligne dans la plage ou step_min invalide.")
        return
    n_min = max(2, math.ceil(span_m / step_min_m))
    print("# Bornes spectrales HITRAN (une fois, puis copier en dur dans config)")
    print(f"stepMax_m = {step_min_m:.6e}")
    print(f"nMin      = {n_min}")
    print("# Utilisation: CONFIG_COMPUTE.spectralBinsMinFromHITRAN = nMin (optionnel);")
    print("#             🔬🌈 doit rester >= nMin pour respecter la résolution des raies.")
    print("# Note: nMin peut être très grand; en pratique on borne 🔬🌈 par N_max (ex. 10000) pour la perf.")


if __name__ == "__main__":
    main()
