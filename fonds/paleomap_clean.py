#!/usr/bin/env python3
"""
paleomap_clean.py
- Extrait la date du nom de fichier (ex: Map93a MIddle Cryogenian_750.jpg → 750.png)
- Supprime les traits noirs (frontières) par inpainting OpenCV
- Redimensionne en 1000×500 et enregistre en PNG
"""

import os
import re
import cv2
import numpy as np

INPUT_DIR  = os.path.join(os.path.dirname(__file__), 'PALEOMAP')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'PALEOMAP_clean')

TARGET_W, TARGET_H = 1000, 500

# ── Paramètres du masque "traits noirs" ─────────────────────────────────────
# Les traits sont quasi noirs (max canal < seuil).
# On évite de toucher les zones naturellement sombres (océan profond, ombre terrain)
# en cherchant les pixels TRES sombres ET entourés de pixels plus clairs.
DARK_THRESHOLD  = 45    # max(R,G,B) < 45 → candidat "noir"
DILATE_PX       = 1     # élargissement du masque (anti-aliasing des traits)
INPAINT_RADIUS  = 4     # rayon d'inpainting (pixels)

os.makedirs(OUTPUT_DIR, exist_ok=True)

files = sorted(f for f in os.listdir(INPUT_DIR) if f.lower().endswith('.jpg'))
print(f'{len(files)} fichiers trouvés dans {INPUT_DIR}')

for fname in files:
    # ── 1. Extraire la date ──────────────────────────────────────────────────
    m = re.search(r'_(\d+)\.jpg$', fname, re.IGNORECASE)
    if not m:
        print(f'  SKIP (pas de date): {fname}')
        continue
    date_str = m.group(1)
    out_path = os.path.join(OUTPUT_DIR, f'{date_str}.png')

    # ── 2. Charger l'image ───────────────────────────────────────────────────
    in_path = os.path.join(INPUT_DIR, fname)
    img = cv2.imread(in_path)
    if img is None:
        print(f'  ERREUR lecture: {fname}')
        continue

    # ── 3. Construire le masque des traits noirs ─────────────────────────────
    # max canal : les pixels vraiment noirs ont les 3 canaux < seuil
    max_channel = img.max(axis=2)
    dark = (max_channel < DARK_THRESHOLD).astype(np.uint8)

    # Affiner : un vrai trait est entouré de pixels plus clairs.
    # On exclut les zones où le voisinage 5×5 est lui aussi très sombre
    # (évite de masquer l'océan profond homogène).
    kernel_5 = np.ones((5, 5), np.uint8)
    neighborhood_dark = cv2.erode(dark, kernel_5, iterations=1)
    # On ne masque que les pixels noirs dont le voisinage ÉLARGI n'est pas tout noir
    line_mask = dark & (~neighborhood_dark & 1)

    # Dilater légèrement pour couvrir les bords anti-aliasés du trait
    if DILATE_PX > 0:
        kernel_d = np.ones((DILATE_PX * 2 + 1, DILATE_PX * 2 + 1), np.uint8)
        line_mask = cv2.dilate(line_mask, kernel_d, iterations=1)

    line_mask_u8 = (line_mask * 255).astype(np.uint8)

    # ── 4. Inpainting ────────────────────────────────────────────────────────
    # INPAINT_TELEA : rapide, bons résultats sur traits fins
    img_clean = cv2.inpaint(img, line_mask_u8, INPAINT_RADIUS, cv2.INPAINT_TELEA)

    # ── 5. Redimensionner 1000×500 ───────────────────────────────────────────
    img_resized = cv2.resize(img_clean, (TARGET_W, TARGET_H),
                             interpolation=cv2.INTER_LANCZOS4)

    # ── 6. Enregistrer en PNG ────────────────────────────────────────────────
    cv2.imwrite(out_path, img_resized)
    mask_px = int(line_mask_u8.sum() // 255)
    print(f'  {fname}  →  {date_str}.png  (masque: {mask_px} px)')

print(f'\nTerminé — {len(os.listdir(OUTPUT_DIR))} fichiers dans {OUTPUT_DIR}')
