# EDS vs Albédo — Clarification

## Vocabulaire

**Diagnostic ΔF** (convention affichage, climate.js) = différence de flux (W/m²) par rapport à une référence. Pas utilisé pour le calcul de T.

## Deux mécanismes distincts

### 1. Albédo (en amont)
- **Définition** : fraction du rayonnement solaire réfléchie vers l’espace.
- **Effet** : ce qui est réfléchi ne chauffe pas la surface.
- **Ordre** : Soleil → Géométrie → **Albédo** (réflexion) → Espace.
- **Résultat** : seul `(1 − albedo) × flux_solaire` atteint la surface.

### 2. EDS — Effet de serre (en aval)
- **Définition** : gaz (CO₂, H₂O, CH₄) qui absorbent l’IR émis par la surface et le renvoient vers elle.
- **Effet** : la surface émet plus qu’elle ne perd vers l’espace.
- **Ordre** : Surface → Atmosphère (absorption IR) → **EDS** (back-radiation) → Surface.

## `forcing_Albedo` dans le code

Ce n’est **pas** l’albédo lui-même, mais le **diagnostic ΔF (convention affichage) dû à un changement d’albédo** :

```
ΔF_albedo = −(S/4) × (A − A_ref)
```

- Si albedo augmente → ΔF < 0 (refroidissement).
- Si albedo diminue → ΔF > 0 (réchauffement).
- Référence : `albedo_base` de l’époque (ex. 0.3 pour Terre moderne).

## H₂O : double rôle

- **Vapeur (gaz)** → EDS (absorption IR).
- **Nuages (condensé)** → albédo (réflexion visible) + effet IR.

Le facteur `getH2OVaporEDSScale()` (`API_BILAN/physics/physics.js`) est calculé dynamiquement depuis T, P, vapor, CO2 — formule physique, pas de hack par époque. Réf. Schmidt 2010. (Anciennement : part de H₂O dans l’EDS, constante par époque.)

## Résumé

| Concept      | Rôle                          | Unité |
|-------------|-------------------------------|-------|
| Albédo      | Ce qui ne chauffe pas (réflexion) | 0–1   |
| EDS         | Ce qui réchauffe (gaz IR)     | W/m²  |
| forcing_Albedo | Diagnostic ΔF albédo (affichage, convention) | W/m²  |
