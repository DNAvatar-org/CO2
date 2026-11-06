# File: CO2/scripts/mtckd_vers_js.py
# Desc: Continuum de la vapeur d'eau MT_CKD (AER, Mlawer et al. 2012, Phil. Trans. R. Soc. A 370:2520, doi:10.1098/rsta.2011.0295)
#       → API_BILAN/data/mtckd_h2o.js. Lit absco-ref_wv-mt-ckd.nc (netCDF classique, sans dépendance) :
#       https://raw.githubusercontent.com/AER-RC/MT_CKD_H2O/master/data/absco-ref_wv-mt-ckd.nc (version 4.3, 2024).
#       Usage : python3 scripts/mtckd_vers_js.py <absco-ref_wv-mt-ckd.nc>
# Version 1.0.0
# Date: [November 6, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import json
import os
import struct
import sys

TAILLE = {1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8}           # NC_BYTE, CHAR, SHORT, INT, FLOAT, DOUBLE
FMT = {1: "b", 2: "c", 3: "h", 4: "i", 5: "f", 6: "d"}


class Lecteur:
    """netCDF classique (CDF1 / CDF2), lecture des variables non illimitées."""

    def __init__(self, octets):
        self.b, self.i = octets, 4
        self.version = octets[3]

    def entier(self):
        v = struct.unpack(">i", self.b[self.i:self.i + 4])[0]
        self.i += 4
        return v

    def decalage(self):
        if self.version == 2:
            v = struct.unpack(">q", self.b[self.i:self.i + 8])[0]
            self.i += 8
            return v
        return self.entier()

    def nom(self):
        n = self.entier()
        s = self.b[self.i:self.i + n].decode()
        self.i += (n + 3) // 4 * 4
        return s

    def valeurs(self, t, n):
        brut = self.b[self.i:self.i + TAILLE[t] * n]
        self.i += (TAILLE[t] * n + 3) // 4 * 4
        return brut.decode() if t == 2 else list(struct.unpack(">" + FMT[t] * n, brut))

    def attributs(self):
        etiquette, n = self.entier(), self.entier()
        a = {}
        for _ in range(n):
            nom = self.nom()
            t = self.entier()
            a[nom] = self.valeurs(t, self.entier())
        return a

    def lire(self):
        self.entier()                                     # nombre d'enregistrements
        etiquette, n = self.entier(), self.entier()
        dims = []
        for _ in range(n):
            dims.append((self.nom(), self.entier()))
        globaux = self.attributs()
        etiquette, n = self.entier(), self.entier()
        variables = {}
        for _ in range(n):
            nom = self.nom()
            ids = [self.entier() for _ in range(self.entier())]
            attrs = self.attributs()
            t, taille, debut = self.entier(), self.entier(), self.decalage()
            nb = 1
            for d in ids:
                nb *= dims[d][1]
            variables[nom] = (t, nb, debut, attrs)
        sortie = {}
        for nom, (t, nb, debut, attrs) in variables.items():
            self.i = debut
            sortie[nom] = (self.valeurs(t, nb), attrs)
        return globaux, sortie


def main():
    g, v = Lecteur(open(sys.argv[1], "rb").read()).lire()
    nu = v["wavenumbers"][0]
    pas = nu[1] - nu[0]
    assert all(abs((nu[k + 1] - nu[k]) - pas) < 1e-6 for k in range(len(nu) - 1)), "grille en ν non uniforme"
    donnees = {
        "version": g["Title"].strip(),
        "nu0": nu[0], "pas": pas, "n": len(nu),           # [cm⁻¹] grille uniforme
        "self": v["self_absco_ref"][0],                   # [cm² molécule⁻¹ (cm⁻¹)⁻¹] à 296 K, rapporté à ρ_ref
        "foreign": v["for_absco_ref"][0],                 # [cm² molécule⁻¹ (cm⁻¹)⁻¹] à 296 K
        "texp": v["self_texp"][0],                        # [-] C_self(T) = C_self(296) (296/T)^texp
        "pRefHpa": v["ref_press"][0][0], "tRef": v["ref_temp"][0][0]
    }
    racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    chemin = os.path.join(racine, "API_BILAN", "data", "mtckd_h2o.js")
    with open(chemin, "w") as f:
        f.write("// " + donnees["version"] + " (AER ; Mlawer et al. 2012, doi:10.1098/rsta.2011.0295), absco-ref_wv-mt-ckd.nc lu par\n"
                "// CO2/scripts/mtckd_vers_js.py. Copyright AER : redistribution libre à des fins scientifiques, avec cette mention.\n")
        f.write("window.MTCKD_H2O=" + json.dumps(donnees, separators=(",", ":")) + ";\n")
    print("%s : %d points, %g–%g cm⁻¹ (pas %g), P_ref %g hPa, T_ref %g K → %s" % (donnees["version"], donnees["n"], nu[0], nu[-1], pas,
                                                                                donnees["pRefHpa"], donnees["tRef"], chemin))


if __name__ == "__main__":
    main()
