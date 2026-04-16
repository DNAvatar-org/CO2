# Timeline — Proposition v2 (3 hystérésis)

Réf. source : `CO2/paleoclimat_complet_750Ma_0Ma.csv`
Objectif : découpe cohérente des transitions non-linéaires (hystérésis), prête à recevoir les sorties API pour comparaison graphique.

---

## 1. Table des époques (bornes + cibles attendues)

| # | Logo | Nom | ▶ début (Ma) | ◀ fin (Ma) | Durée (Ma) | T°_ref (°C) | T°_ref (K) | CO₂_ref (ppm) | CH₄_ref (ppb) | H₂O_vap_ref | CCN_ref | Type | Commentaire |
|---|------|-----|-------------:|----------:|----------:|-----------:|----------:|-------------:|-------------:|------------:|--------:|------|-------------|
| 1  | ⚫ | Corps Noir                    | 5000      | 4500      | 500   | −18   | 255   | —    | —    | —   | —     | proto     | Équilibre σT⁴ = S/4 |
| 2  | 🔥 | Hadéen                        | 4500      | 4000      | 500   | 2177  | 2450  | très élevé | très élevé | 0 liq | —  | proto | Océan de magma |
| 3  | 🦠 | Archéen                       | 4000      | 2500      | 1500  | 15    | 288   | ~3000 | ~1000 | variable | bas | stable | Procaryotes, soleil faible |
| 4  | 🪸 | Protérozoïque                 | 2500      | 750       | 1750  | 12    | 285   | ~1000 | ~500  | 1.0      | moyen | stable | Grande Oxydation, eucaryotes, multicellularité |
| 5  | ☃  | Entrée Sturtienne (hyst 1a)   | 750       | 720       | 30    | −40   | 233   | ~200  | ~100  | 0.2      | bas   | **hystérésis ↓** | Bascule albédo-glace descendante |
| 6  | ⛄ | Plein Snowball                | 720       | 690       | 30    | −40   | 233   | accumulation | —  | 0.2 | bas | plateau | Volcanisme sous glace accumule CO₂ |
| 7  | ⛈  | Sortie Marinoen (hyst 1b)     | 690       | 600       | 90    | 22    | 295   | ~5000 | ~1500 | 1.1      | moyen | **hystérésis ↑** | Déglaciation brutale, hyper-greenhouse, pluies acides |
| 8  | 🪼 | Paléozoïque marin             | 600       | 420       | 180   | 16    | 289   | ~2500 | ~700  | 0.9      | moyen | stable | Explosion cambrienne, Hirnantienne (−445 : −8°C pic froid) |
| 9  | 🍄 | Paléozoïque terrestre         | 420       | 280       | 140   | 18    | 291   | ~1500 | ~600  | 1.0      | haut  | stable | Forêts Dévonien, Prototaxites, Karoo (fin : 12°C) |
| 10 | 💀 | Limite P/T                    | 280       | 250       | 30    | 28    | 301   | ~3000 | ~2000 | 1.5      | bas   | **extinction massive** | Trapps sibériens, anoxie |
| 11 | 🦕 | Mésozoïque                    | 250       | 66        | 184   | 24    | 297   | ~1200 | ~1000 | 1.3      | moyen | stable | Pas de glaces polaires |
| 12 | 🦤 | Cénozoïque                    | 66        | 50        | 16    | 18    | 291   | ~650  | ~700  | 1.1      | moyen | recovery | Post-K/Pg, radiation mammifères/oiseaux |
| 13 | 🐊 | Éocène                        | 50        | 35        | 15    | 26    | 299   | ~2000 | ~3000 | 1.4      | haut  | pic chaud | PETM, clathrates CH₄ |
| 14 | 🐧 | E-O (hyst 2)                  | 35        | 33        | 2     | 15    | 288   | ~450  | ~500  | 0.8      | moyen | **hystérésis ↓** | Calotte Antarctique |
| 15 | 🏔 | Grande Coupure                | 33        | 2         | 31    | 13    | 286   | ~350  | ~450  | 0.7      | moyen | refroidissement | Himalaya, altération silicates |
| 16 | 🦣 | Quaternaire                   | 2         | 0.010     | ~2    | 13    | 286   | 180–280 | 400–700 | 0.7 | moyen | cycles Milankovitch | Glaciations Pléistocène, mammouths |
| 17 | 🛖 | Holocène                      | 0.010     | −0.0002   | ~0.01 | 14    | 287   | 270   | 700   | 0.9      | moyen | interglaciaire stable | Agriculture, villages (0 Ma = −1800 CE ici) |
| 18 | 🚂 | Industriel                    | −0.0002   | −0.000025 | 225 a | 14.5  | 287.6 | 280→420 | 700→1900 | 0.95 | haut | forçage anthropique | De 1800 à 2025 |
| 19 | 📱 | Aujourd'hui                   | −0.000025 | +0.0001   | 100 a | 15.1  | 288.3 | 420→?  | 1900→? | 1.0    | haut  | scénarios RCP | 2000 → 2100 |

### Conventions
- **Ma** = millions d'années avant présent (positif = passé). Bornes post-1950 en Ma négatifs (ex. 2000 = −0.00005 Ma).
- **T°_ref** = moyenne/cible littérature pondérée par les points CSV tombant dans l'intervalle.
- **3 hystérésis** : lignes 5 (Sturtienne↓), 7 (Marinoen↑), 14 (E-O↓). Ligne 10 = extinction massive (pas une hystérésis d'albédo).
- **CCN** : niveau qualitatif (bas / moyen / haut) — bioactivité + aérosols.

---

## 2. Points CSV mappés aux époques

Chaque point du CSV est assigné à une époque. `T_sim` = colonne à remplir depuis l'API pour comparaison.

| Age_Ma | Époque (#) | Logo | T°_csv (°C) | CO₂_csv (ppm) | CH₄_csv (ppb) | H₂O_csv | CCN_csv | T_sim_K (API) | T_sim_°C (API) | ΔT (sim−csv) | Commentaire CSV |
|-------:|-----------:|:----:|------------:|--------------:|--------------:|:-------:|:-------:|--------------:|---------------:|-------------:|-----------------|
| −750 | 4  | 🪸 | 25  | 4000 | 1000 | 1.2 | Moyen | _TBD_ | _TBD_ | _TBD_ | Avant Snowball, GES élevés |
| −720 | 5  | ☃  | −40 | 200  | 100  | 0.2 | Bas   | _TBD_ | _TBD_ | _TBD_ | Hyst 1 entrée Sturtienne |
| −690 | 7  | ⛈  | 22  | 5000 | 1500 | 1.1 | Moyen | _TBD_ | _TBD_ | _TBD_ | Déglaciation brutale (Map92a) |
| −600 | 7/8| ⛈/🪼| 10 | 1000 | 500  | 0.8 | Moyen | _TBD_ | _TBD_ | _TBD_ | Gaskiers / Édiacarien (Map90a) |
| −540 | 8  | 🪼 | 22  | 4500 | 1000 | 1.2 | Haut  | _TBD_ | _TBD_ | _TBD_ | Explosion cambrienne |
| −480 | 8  | 🪼 | 20  | 3500 | 800  | 1.1 | Moyen | _TBD_ | _TBD_ | _TBD_ | Ordovicien inf. |
| −461 | 8  | 🪼 | 16  | 2500 | 600  | 0.9 | Moyen | _TBD_ | _TBD_ | _TBD_ | Début refroidissement (Map80a) |
| −460 | 8  | 🪼 | 18  | 2800 | 700  | 1.0 | Moyen | _TBD_ | _TBD_ | _TBD_ | Intermède doux |
| −450 | 8  | 🪼 | 10  | 1500 | 400  | 0.7 | Bas   | _TBD_ | _TBD_ | _TBD_ | Hirnantienne |
| −445 | 8  | 🪼 | 8   | 1200 | 300  | 0.6 | Bas   | _TBD_ | _TBD_ | _TBD_ | Pic de froid Hirnantien |
| −440 | 8  | 🪼 | 14  | 2000 | 500  | 0.8 | Moyen | _TBD_ | _TBD_ | _TBD_ | Fin glaciation |
| −400 | 9  | 🍄 | 22  | 2000 | 800  | 1.1 | Haut  | _TBD_ | _TBD_ | _TBD_ | Dévonien greenhouse, forêts |
| −370 | 9  | 🍄 | 20  | 1500 | 700  | 1.0 | Haut  | _TBD_ | _TBD_ | _TBD_ | Pas de glace |
| −360 | 9  | 🍄 | 16  | 1200 | 500  | 0.8 | Moyen | _TBD_ | _TBD_ | _TBD_ | Crise biologique |
| −350 | 9  | 🍄 | 19  | 1400 | 600  | 1.0 | Haut  | _TBD_ | _TBD_ | _TBD_ | Post-crise |
| −330 | 9  | 🍄 | 14  | 600  | 400  | 0.7 | Haut  | _TBD_ | _TBD_ | _TBD_ | Début Karoo, chute CO₂ |
| −280 | 9/10| 🍄/💀| 12 | 300 | 300 | 0.6 | Haut  | _TBD_ | _TBD_ | _TBD_ | Max Karoo, CO₂ minimum |
| −250 | 10 | 💀 | 28  | 3000 | 2000 | 1.5 | Bas   | _TBD_ | _TBD_ | _TBD_ | Limite P/T, anoxie |
| −100 | 11 | 🦕 | 24  | 1200 | 1000 | 1.3 | Moyen | _TBD_ | _TBD_ | _TBD_ | Crétacé, pas de glaces |
| −56  | 13 | 🐊 | 26  | 2000 | 3000 | 1.4 | Haut  | _TBD_ | _TBD_ | _TBD_ | PETM, pic CH₄ clathrates |
| −40  | 13 | 🐊 | 18  | 600  | 600  | 1.0 | Moyen | _TBD_ | _TBD_ | _TBD_ | Retour glace Sud |
| −34  | 14 | 🐧 | 15  | 450  | 500  | 0.8 | Moyen | _TBD_ | _TBD_ | _TBD_ | Hyst 2 E-O, calotte Antarctique |
| −4   | 15 | 🏔 | 13  | 350  | 450  | 0.7 | Moyen | _TBD_ | _TBD_ | _TBD_ | Glace Nord, Milankovitch |
| 0    | 19 | 📱 | 15  | 420  | 1800 | 1.0 | Haut  | _TBD_ | _TBD_ | _TBD_ | Actuel (anthropocène) |

---

## 3. Format d'export API attendu (pour remplir `T_sim`)

CSV enrichi proposé — `paleoclimat_comparatif.csv` :

```csv
Age_Ma,Epoch_id,Epoch_name,T_csv_C,T_sim_K,T_sim_C,dT_K,CO2_csv_ppm,CO2_sim_ppm,CH4_csv_ppb,CH4_sim_ppb,H2O_csv,H2O_sim,CCN_csv,Commentaire
-750,🪸,Protérozoïque,25,,,,4000,,1000,,1.2,,Moyen,"Avant Snowball"
-720,☃,Entrée Sturtienne,-40,,,,200,,100,,0.2,,Bas,"Hyst 1"
...
```

**Hook API suggéré** (JS, à brancher dans `scie_compute.html` ou nouveau bouton `💾📊`) :

```js
// Pour chaque ligne CSV : setEpoch(epochId), setDateMa(age), runCompute(), capture plotData
async function exportComparativeCSV() {
  const rows = await fetch('paleoclimat_complet_750Ma_0Ma.csv').then(r => r.text());
  const out = [];
  for (const row of parseCsv(rows)) {
    const epoch = mapAgeToEpoch(row.Age_Ma);   // cf. colonne "Époque" table §2
    window.setEpoch(epoch.name);
    window.DATA['📜']['📅'] = row.Age_Ma * 1e6;
    await window.runComputeInParent();
    const T_sim_K = window.plotData.T_surface_K;
    out.push({ ...row, Epoch_id: epoch.id, T_sim_K, T_sim_C: T_sim_K - 273.15,
               dT_K: T_sim_K - (row.Temp_C + 273.15) });
  }
  download('paleoclimat_comparatif.csv', toCsv(out));
}
```

---

## 4. Impact — fichiers à modifier

| Priorité | Fichier | Nature du changement |
|---------:|---------|----------------------|
| 🔴 | `API_BILAN/config/configTimeline.js` | Ajout époques 7 (⛈), 9 (🍄), 10 (💀), 12 (🦤), 17 (🛖). Redécoupage bornes Protéro/Paléo/Méso. Recalibrage 🌡️🧮. |
| 🔴 | `CO2/organigramme/configOrganigramme.js` | Blocs `radiation[]` + `terre.epoch[]` + `ACTION_BY_EPOCH` pour nouvelles époques. Remplacement 🥟→🪸, ❄️→🦣. |
| 🟠 | `CO2/static/timeline/events.js` | `idToName` (2 occurrences L190 + L350) : ajouter `⛈`, `🪸`, `🍄`, `💀`, `🦤`, `🐧`, `🛖`, `🦣`. |
| 🟠 | `CO2/fonts/pics/` | Vérifier PNG logos manquants (⛈, 🪸, 🍄, 💀, 🦤, 🐧, 🛖) — fallback emoji sinon. |
| 🟡 | `CO2/static/courbes/plot.js` | Nouvelle courbe overlay "CSV réf" + export `paleoclimat_comparatif.csv`. |
| 🟡 | `CO2/static/compute/scie_/scie_hysteresis_search.js` | Renommage "hysteresis 1" → "hysteresis 1a" + ajout "hysteresis 1b" si cherché. |
| 🟢 | `CO2/fonds/` textures PaléoMap | Vérifier indexation par bornes d'époque (Map92a/Map90a/Map80a/Map00200) — ajuster si bornes décalées. |

---

## 5. Arbitrages validés

- [x] 3 hystérésis : Sturtienne (entrée) + Marinoen (sortie) + E-O
- [x] P/T : ajoutée comme **extinction massive** 💀 (pas hystérésis)
- [x] Protérozoïque : 🪸 (multicellularité)
- [x] Sortie Marinoen : ⛈
- [x] Paléozoïque scindé : 🪼 marin + 🍄 terrestre
- [x] Cénozoïque : 🦤
- [x] E-O : 🐧
- [x] Quaternaire : 🦣 (déplacé depuis ❄️)
- [x] Holocène : 🛖 (nouveau)
- [x] ☃/⛄ : paire ordonnée Snowball

## 6. À confirmer avant patch

- Frontière **420 Ma** (Silurien/Dévonien) pour scission Paléo marin/terrestre — ou préférence pour 443 Ma (Ordovicien/Silurien, après Hirnantienne) ?
- Frontière **Holocène** : −10 ka → 1800, ou on scinde 1800 exact (début industriel strict) ?
- Valeurs `T°_ref` / `CO₂_ref` table §1 : OK ou à recalibrer sur ta biblio (`model_tuning_biblio.js`) ?
