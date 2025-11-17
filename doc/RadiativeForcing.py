# File: RadiativeForcing.py - Simplified radiative transfer simulation
# Desc: En français, dans l'architecture, je suis le fichier principal de simulation du transfert radiatif
# Version 1.0.1
# Copyright 2025 - Basé sur le code original de la vidéo YouTube: https://www.youtube.com/watch?v=ewc8FBtEKPs
# Copyright 2025 - Dépôt GitHub: https://github.com/[auteur]/RadiativeForcing
# Licensed under Apache License 2.0 with Commons Clause.
# See LICENSE_HEADER.txt for full terms.
# Date: [January 2025]
# Logs:
#   - Added copyright headers for YouTube video and GitHub repository
#   - Removed bottom margin band from matplotlib plot
#   - Completely disabled matplotlib toolbar
#   - Added interactive CO2 slider with exponential scaling (×2 per step)
#   - Added CO2 percentage and multiplicative factor display
#   - Green curve represents pre-industrial CO2 (280 ppm, before human impact)

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import matplotlib.widgets as widgets
import numpy as np

# ----------------------------------------------------------------------------------------------------------------------

# ===================
# BLACKBODY RADIATION
# ===================

def planck_function(lambda_wavelength, T):
    h = 6.62607015e-34      # Planck's constant, J*s
    c = 2.998e8             # Speed of light, m/s
    kB = 1.380649e-23       # Boltzmann's constant, J/K
    term1 = (2 * h * c**2) / lambda_wavelength**5
    term2 = np.exp((h * c) / (lambda_wavelength * kB * T)) - 1
    return term1 / term2

# ----------------------------------------------------------------------------------------------------------------------

# ================
# ATMOSPHERE MODEL
# ================

def pressure(z):
    P0 = 101325     # Pressure at sea level in Pa
    H = 8500        # Scale height in m
    return P0 * np.exp(-z / H)

def temperature_uniform(z):
    T0 = 288.2
    return T0 * np.ones_like(z)

def temperature_simple(z):
    T0 = 288.2     # Temperature at sea level in K
    z_trop = 11000  # Tropopause height in m
    Gamma = -0.0065 # Temperature gradient in K/m
    T_trop = T0 + Gamma * z_trop
    return np.piecewise(z, [z < z_trop, z >= z_trop],
                        [lambda z: T0 + Gamma * z,
                         lambda z: T_trop])

def temperature_US1976(z):
    z_km = z/1000  # Convert altitude to km for easier comparisons

    # Troposphere (0 to 11 km)
    T0 = 288.15
    z_trop = 11

    # Tropopause (11 to 20 km)
    T_tropopause = 216.65
    z_tropopause = 20

    # Stratosphere 1 (20 to 32 km)
    T_strat1 = T_tropopause
    z_strat1 = 32

    # Stratosphere 2 (32 to 47 km)
    T_strat2 = 228.65
    z_strat2 = 47

    # Stratopause (47 to 51 km)
    T_stratopause = 270.65
    z_stratopause = 51

    # Mesosphere 1 (51 to 71 km)
    T_meso1 = T_stratopause
    z_meso1 = 71

    # Mesosphere 2 (71 to ...)
    T_meso2 = 214.65

    return np.piecewise(z_km,
                        [z_km < z_trop,
                         (z_km >= z_trop) & (z_km < z_tropopause),
                         (z_km >= z_tropopause) & (z_km < z_strat1),
                         (z_km >= z_strat1) & (z_km < z_strat2),
                         (z_km >= z_strat2) & (z_km < z_stratopause),
                         (z_km >= z_stratopause) & (z_km < z_meso1),
                         z_km >= z_meso1],
                        [lambda z: T0 - 6.5 * z,
                         lambda z: T_tropopause,
                         lambda z: T_strat1 + 1 * (z - z_tropopause),
                         lambda z: T_strat2 + 2.8 * (z - z_strat1),
                         lambda z: T_stratopause,
                         lambda z: T_meso1 - 2.8 * (z - z_stratopause),
                         lambda z: T_meso2 - 2 * (z - z_meso1)])


# ==> CHOOSE HERE THE TEMPERATURE MODEL
def temperature(z):
    return temperature_simple(z)

def air_number_density(z):
    kB = 1.380649e-23  # Boltzmann's constant, J/K
    return pressure(z) / (kB * temperature(z))

# ----------------------------------------------------------------------------------------------------------------------

# ==============
# CO2 ABSORPTION
# ==============

def cross_section_CO2(wavelength):
    LAMBDA_0 = 15.0e-6  # Band center in m
    exponent = -22.5 - 24 * np.abs((wavelength - LAMBDA_0) / LAMBDA_0)
    sigma = 10 ** exponent
    return sigma

# ----------------------------------------------------------------------------------------------------------------------

# =============================
# RADIATIVE TRANSFER SIMULATION
# =============================

# All wavelengths are treated in parallel using vectorization

def simulate_radiative_transfer(CO2_fraction, z_max = 80000, delta_z = 10, lambda_min = 0.1e-6, lambda_max = 100e-6, delta_lambda = 0.01e-6):

    # Altitude and wavelength grids
    z_range = np.arange(0, z_max, delta_z)
    lambda_range = np.arange(lambda_min, lambda_max, delta_lambda)

    # Initialize arrays
    upward_flux = np.zeros((len(z_range), len(lambda_range)))
    optical_thickness = np.zeros((len(z_range), len(lambda_range)))

    # Boundary condition : Compute the outward vertical flux emitted by the Earth's surface for all wavelengths
    earth_flux = np.pi * planck_function(lambda_range, temperature(0)) * delta_lambda
    print(f"Total earth surface flux in wavelength range: {earth_flux.sum():.2f} W/m^2")

    flux_in = earth_flux
    for i, z in enumerate(z_range):

        # Number density of CO2 molecules and absorption coefficient
        n_CO2 = air_number_density(z) * CO2_fraction
        kappa = cross_section_CO2(lambda_range) * n_CO2

        # Compute fluxes within the layer
        optical_thickness[i,:] = kappa * delta_z
        absorbed_flux = np.minimum(kappa * delta_z * flux_in , flux_in)
        emitted_flux = optical_thickness[i,:] * np.pi * planck_function(lambda_range, temperature(z)) * delta_lambda
        upward_flux[i, :] = flux_in - absorbed_flux + emitted_flux

        # The flux leaving the layer becomes the flux entering the next layer
        flux_in = upward_flux[i, :]

    total_flux = upward_flux[-1,:].sum()
    print(f"Total outgoing flux at the top of the atmosphere: {total_flux:.2f} W/m^2")
    
    # Calcul de la température effective moyenne à partir du flux (loi de Stefan-Boltzmann)
    # Flux = σ × T^4, donc T = (Flux / σ)^(1/4)
    sigma_sb = 5.670374419e-8  # Constante de Stefan-Boltzmann, W/(m²·K⁴)
    effective_temperature = (total_flux / sigma_sb) ** 0.25
    print(f"Température effective moyenne: {effective_temperature:.2f} K ({effective_temperature - 273.15:.2f} °C)")

    return lambda_range, z_range, upward_flux, optical_thickness, effective_temperature

# ----------------------------------------------------------------------------------------------------------------------

# ============================================================================
# MAIN - PHASE 1 : INITIALISATION
# ============================================================================

print("--------- version -------")

# Valeurs de référence
CO2_preindustrial = 280e-6  # Niveau pré-industriel (avant 1750)
CO2_current = 420e-6  # Niveau actuel (environ 420 ppm en 2024)

# ============================================================================
# PHASE 2 : CRÉATION DE L'INTERFACE GRAPHIQUE (avant les calculs)
# ============================================================================

# Création de la figure et de l'axe (affichage immédiat)
plt.rcParams['toolbar'] = 'None'
fig = plt.figure(figsize=(14, 8))  # Hauteur réduite de 10 à 8
ax = plt.subplot(111)

# Afficher la figure vide d'abord pour que l'utilisateur voie quelque chose
plt.ion()  # Mode interactif pour afficher avant les calculs
plt.show(block=False)
fig.canvas.draw()

# Fonction pour obtenir une couleur basée sur la température (bleu foncé -> vert clair)
# Utilise un colormap personnalisé similaire à l'image
def temp_to_color(temp, temp_min=200, temp_max=320):
    # Normalisation de la température entre 0 et 1
    normalized = (temp - temp_min) / (temp_max - temp_min)
    normalized = np.clip(normalized, 0, 1)
    # Gradient bleu foncé -> cyan -> vert clair (comme dans l'image)
    # Bleu foncé (0.0) -> Cyan (0.5) -> Vert clair (1.0)
    if normalized < 0.5:
        # Bleu foncé -> Cyan
        r = 0.0
        g = normalized * 2 * 0.6
        b = 0.4 + normalized * 2 * 0.6
    else:
        # Cyan -> Vert clair
        r = 0.0
        g = 0.6 + (normalized - 0.5) * 2 * 0.4
        b = 1.0 - (normalized - 0.5) * 2 * 0.4
    return (r, g, b)

# Initialisation des courbes fixes (Planck) - créées avec données vides pour l'instant
T_surface = temperature(0)
T_tropopause = 216
color_surface = temp_to_color(T_surface)
color_tropopause = temp_to_color(T_tropopause)

# Créer les courbes Planck avec des données temporaires (seront mises à jour après calculs)
lambda_temp = np.linspace(0.1e-6, 100e-6, 1000)  # Plage temporaire pour créer les courbes
line_planck_surface, = ax.plot(1e6 * lambda_temp, np.pi * planck_function(lambda_temp, T_surface)/1e6, '--', 
        color=color_surface, linewidth=1.5, label=f'Planck {T_surface:.0f}K')
line_planck_tropopause, = ax.plot(1e6 * lambda_temp, np.pi * planck_function(lambda_temp, T_tropopause)/1e6, '--', 
        color=color_tropopause, linewidth=1.5, label=f'Planck {T_tropopause:.0f}K')

# Courbes de référence (seront mises à jour après calculs)
line_preindustrial, = ax.plot([], [], '-g', linewidth=2, label='280 ppm CO₂ (pré-industriel)')
line_current_ref, = ax.plot([], [], '-', color='gray', linewidth=1, label='420 ppm CO₂ (actuel)')

# Courbes qui seront mises à jour dynamiquement
line_current, = ax.plot([], [], '-r', linewidth=2, label='CO₂ sélectionné')
fill_forcing = None  # Sera créé dans update()

# Texte d'information CO2 et température
text_co2_info = ax.text(0.02, 0.15, '', transform=ax.transAxes, fontsize=11,
                        bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8),
                        verticalalignment='top')

ax.set_xlabel("Longueur d'onde (μm)")
ax.set_ylabel("Luminance spectrale (W/m²/μm/sr)")
ax.set_xlim(0, 50)
ax.set_ylim(0, 30)
ax.grid(True)

# Légende simplifiée avec 5 lignes (vide pour l'instant, sera remplie après)
legend = ax.legend(loc='upper right', fontsize=10, framealpha=0.9)

# Ajout de l'équation de Planck comme annotation
ax.text(0.02, 0.98, r'$B_\lambda(T) = \frac{2hc^2}{\lambda^5} \frac{1}{e^{hc/(\lambda k_B T)} - 1}$', 
        transform=ax.transAxes, fontsize=9, verticalalignment='top',
        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

# Variable pour stocker l'exposant actuel (0 = 280 ppm, 1 = 560 ppm, etc.)
current_exponent = 1  # Commence à 560 ppm (×2 par rapport à 280)

# Fonction de mise à jour
def update(exponent):
    global current_exponent, lambda_range, delta_lambda, upward_flux_preindustrial, temp_eff_preindustrial, fill_forcing
    current_exponent = exponent
    CO2_current = CO2_preindustrial * (2 ** exponent)
    CO2_ppm = CO2_current * 1e6
    factor = 2 ** exponent
    
    # Recalculer le flux pour la valeur actuelle
    _, _, upward_flux_current, _, temp_eff_current = simulate_radiative_transfer(CO2_current)
    
    # Mettre à jour la courbe actuelle (lambda_range et delta_lambda sont globaux)
    line_current.set_data(1e6 * lambda_range, upward_flux_current[-1, :]/delta_lambda/1e6)
    
    # Mettre à jour le fill_between (forçage radiatif)
    # Supprimer l'ancien fill_between s'il existe
    if fill_forcing is not None:
        fill_forcing.remove()
    fill_forcing = ax.fill_between(1e6 * lambda_range, upward_flux_preindustrial[-1, :]/delta_lambda/1e6, 
                    upward_flux_current[-1, :]/delta_lambda/1e6, 
                    color='yellow', alpha=0.9, label='Forçage radiatif')
    
    # Calcul du forçage radiatif (différence de flux)
    forcing = upward_flux_current[-1, :].sum() - upward_flux_preindustrial[-1, :].sum()
    delta_temp = temp_eff_current - temp_eff_preindustrial
    
    # Mettre à jour le texte d'information
    info_text = f'CO₂: {CO2_ppm:.0f} ppm\n'
    info_text += f'Facteur: ×{factor:.0f} (vs 280 ppm)\n'
    info_text += f'Temp. effective: {temp_eff_current:.1f} K ({temp_eff_current - 273.15:.1f} °C)\n'
    info_text += f'ΔT: {delta_temp:+.2f} K\n'
    info_text += f'Forçage: {forcing:+.2f} W/m²'
    text_co2_info.set_text(info_text)
    
    # Mettre à jour la légende
    line_current.set_label(f'{CO2_ppm:.0f} ppm CO₂')
    # Recréer la légende pour mettre à jour le label
    global legend
    legend = ax.legend(loc='upper right', fontsize=10, framealpha=0.9)
    
    fig.canvas.draw_idle()

# Fonctions pour les boutons
def multiply_by_2(event):
    global current_exponent
    current_exponent += 1
    if current_exponent > 8:  # Limite max
        current_exponent = 8
    update(current_exponent)

def divide_by_2(event):
    global current_exponent
    current_exponent -= 1
    if current_exponent < 0:  # Limite min
        current_exponent = 0
    update(current_exponent)

# Variables globales pour stocker les valeurs initiales
button_init_done = False
WW0_init = None
HW0_init = None
XB0_init = None
YB0_init = None

# Variables globales pour stocker les références aux boutons
btn_x2 = None
btn_div2 = None
text_x2 = None
text_div2 = None
updating_buttons = False  # Flag pour éviter les mises à jour multiples

# Fonction pour calculer les propriétés des boutons avec zoom inverse
# Applique un zoom inverse pour maintenir une taille fixe en pixels
# S'applique en groupe aux 2 boutons
def calculate_button_properties():
    global button_init_done, WW0_init, HW0_init, XB0_init, YB0_init
    
    # Obtenir les tailles actuelles de la fenêtre (en pixels)
    # Utiliser le canvas pour obtenir les dimensions réelles
    fig.canvas.draw()
    canvas_width = fig.canvas.get_width_height()[0]
    canvas_height = fig.canvas.get_width_height()[1]
    
    # Si disponible, utiliser les dimensions de la fenêtre, sinon utiliser figsize * dpi
    try:
        WW = fig.canvas.manager.window.winfo_width() if hasattr(fig.canvas.manager, 'window') else canvas_width
        HW = fig.canvas.manager.window.winfo_height() if hasattr(fig.canvas.manager, 'window') else canvas_height
    except:
        # Fallback : utiliser figsize * dpi
        WW = fig.get_figwidth() * fig.dpi
        HW = fig.get_figheight() * fig.dpi
    
    # Initialiser les valeurs de référence au premier appel
    if not button_init_done:
        WW0_init = WW  # WW0 = WW au début
        HW0_init = HW  # HW0 = HW au début
        button_init_done = True
    
    WW0 = WW0_init
    HW0 = HW0_init
    RW = WW / WW0  # Ratio appliqué par matplotlib (largeur)
    RH = HW / HW0  # Ratio appliqué par matplotlib (hauteur)
    # Tailles des boutons (en pixels)
    WB0 = 15  # Largeur bouton initiale (W bouton init)# Ratios appliqués par matplotlib
    HB0 = 15  # Hauteur bouton initiale (H bouton init)
    
    # Obtenir la position de la légende pour calculer XB0, YB0
    legend_bbox = legend.get_window_extent(fig.canvas.get_renderer())
    legend_bbox_fig = legend_bbox.transformed(fig.transFigure.inverted())
    
    # Position initiale des boutons (en coordonnées de figure)
    posX_fig = legend_bbox_fig.x1  # Position relative à la légende
    posY_fig = legend_bbox_fig.y1   # Position relative à la légende
    
    # Initialiser XB0 et YB0 au premier appel (en coordonnées de figure)
    if XB0_init is None or YB0_init is None:
        XB0_init = posX_fig  # XB0 = posX au début (en coordonnées de figure)
        YB0_init = posY_fig  # YB0 = posY au début (en coordonnées de figure)
    
    XB0 = XB0_init
    YB0 = YB0_init
 
    # Convertir XB0 et YB0 en pixels initiaux (selon vos formules)
    XB0_pixels = XB0 * WW0  # XB0 en pixels depuis la gauche
    YB0_pixels_fig = YB0 * HW0  # YB0 en pixels depuis le bas (coordonnées figure)
    YB0_pixels = HW0 - YB0_pixels_fig  # YB0 en pixels depuis le haut (pixels fenêtre)
    
    # Formules corrigées : WB=WB0/RW, HB=HB0, XB=XB0/RW, YB=YB0*RH
    WB = WB0  # Largeur bouton ajustée (en pixels) - zoom inverse
    HB = HB0  # Hauteur bouton fixe (en pixels) - pas de zoom inverse
    XB = XB0_pixels * RW  # Position X ajustée (en pixels) - zoom inverse
    YB = YB0_pixels # * RH  # Position Y ajustée (en pixels) - multiplié par RH
    
    # Convertir en coordonnées de figure pour matplotlib
    scaleX = WB / WW  # Largeur en fraction de figure
    scaleY = HB / HW  # Hauteur en fraction de figure
    posX = XB / WW    # Position X en fraction de figure
    posY = (HW - YB) / HW  # Position Y en fraction de figure (inverser depuis pixels)
    
    # Logs pour débugger
    print(f"DEBUG calculate_button_properties:")
    print(f"  WW0={WW0:.0f}, HW0={HW0:.0f}, WB0={WB0}, HB0={HB0}")
    print(f"  WW={WW:.0f}, HW={HW:.0f}, RW={RW:.3f}, RH={RH:.3f}")
    print(f"  XB0_pixels={XB0_pixels:.1f}, YB0_pixels={YB0_pixels:.1f}")
    print(f"  WB={WB:.1f}, HB={HB:.1f}, XB={XB:.1f}, YB={YB:.1f}")
    print(f"  scaleX={scaleX:.6f}, scaleY={scaleY:.6f}, posX={posX:.6f}, posY={posY:.6f}")
    
    return posX, posY, scaleX, scaleY

# Fonction pour mettre à jour les transformations des boutons
def update_button_transforms():
    global btn_x2, btn_div2, text_x2, text_div2, updating_buttons
    if btn_x2 is None or btn_div2 is None:
        return  # Boutons pas encore créés
    
    # Éviter les mises à jour multiples simultanées
    if updating_buttons:
        return
    updating_buttons = True
    
    try:
        # Recalculer les propriétés avec les nouvelles dimensions
        posX, posY, scaleX, scaleY = calculate_button_properties()
        button_spacing = 0.005
        posX2 = posX + scaleX + button_spacing
        
        # Mettre à jour les transformations des patches
        from matplotlib.transforms import Affine2D
        btn_x2.set_transform(Affine2D().scale(scaleX, scaleY).translate(posX, posY) + fig.transFigure)
        btn_div2.set_transform(Affine2D().scale(scaleX, scaleY).translate(posX2, posY) + fig.transFigure)
        
        # Mettre à jour les positions des textes
        text_x2.set_position((posX + scaleX/2, posY + scaleY/2))
        text_div2.set_position((posX2 + scaleX/2, posY + scaleY/2))
        
        # Redessiner (draw_idle pour éviter les appels multiples)
        fig.canvas.draw_idle()
    finally:
        updating_buttons = False

# Création de boutons cliquables avec annotations matplotlib
# Utilisation de transformations personnalisées pour contrôler posX, posY, scaleX, scaleY
def create_clickable_buttons():
    global btn_x2, btn_div2, text_x2, text_div2
    
    # Calculer les propriétés des boutons avec zoom inverse
    posX, posY, scaleX, scaleY = calculate_button_properties()
    button_spacing = 0.005
    
    # Créer des patches cliquables comme boutons
    from matplotlib.patches import FancyBboxPatch
    from matplotlib.transforms import Affine2D
    
    # Bouton ×2 avec transformation personnalisée
    btn_x2 = FancyBboxPatch((0, 0), 1, 1,  # Taille unitaire, l'échelle est dans la transformation
                           boxstyle="round,pad=0.1", 
                           facecolor='lightcoral', edgecolor='gray', linewidth=0.5,
                           transform=Affine2D().scale(scaleX, scaleY).translate(posX, posY) + fig.transFigure,
                           zorder=10)
    fig.patches.append(btn_x2)
    text_x2 = fig.text(posX + scaleX/2, posY + scaleY/2, '×2',
                      ha='center', va='center', fontsize=7, weight='bold',
                      transform=fig.transFigure, zorder=11)
    
    # Bouton ÷2 avec transformation personnalisée
    posX2 = posX + scaleX + button_spacing
    btn_div2 = FancyBboxPatch((0, 0), 1, 1,  # Taille unitaire
                             boxstyle="round,pad=0.1",
                             facecolor='lightblue', edgecolor='gray', linewidth=0.5,
                             transform=Affine2D().scale(scaleX, scaleY).translate(posX2, posY) + fig.transFigure,
                             zorder=10)
    fig.patches.append(btn_div2)
    text_div2 = fig.text(posX2 + scaleX/2, posY + scaleY/2, '÷2',
                        ha='center', va='center', fontsize=7, weight='bold',
                        transform=fig.transFigure, zorder=11)
    
    # Connecter les événements de clic
    def on_click(event):
        if event.inaxes is None and event.x is not None and event.y is not None:
            # Convertir en coordonnées de figure
            x_fig = event.x / fig.get_figwidth()
            y_fig = event.y / fig.get_figheight()
            
            # Vérifier si le clic est dans le bouton ×2
            if (posX <= x_fig <= posX + scaleX and 
                posY <= y_fig <= posY + scaleY):
                multiply_by_2(event)
            # Vérifier si le clic est dans le bouton ÷2
            elif (posX2 <= x_fig <= posX2 + scaleX and 
                  posY <= y_fig <= posY + scaleY):
                divide_by_2(event)
    
    fig.canvas.mpl_connect('button_press_event', on_click)
    
    # Connecter l'événement de redimensionnement pour mettre à jour les transformations
    def on_resize(event):
        # Utiliser un délai pour éviter les appels multiples rapides
        import time
        if not hasattr(on_resize, 'last_update'):
            on_resize.last_update = 0
        current_time = time.time()
        if current_time - on_resize.last_update > 0.1:  # Délai de 100ms
            update_button_transforms()
            on_resize.last_update = current_time
    
    fig.canvas.mpl_connect('resize_event', on_resize)
    
    return btn_x2, btn_div2, text_x2, text_div2

# ============================================================================
# PHASE 3 : CALCULS DES FLUX DE RÉFÉRENCE
# ============================================================================

print("Phase 3 : Calcul des flux pré-industriels (280 ppm)...")
lambda_range, z_range, upward_flux_preindustrial, optical_thickness, temp_eff_preindustrial = simulate_radiative_transfer(CO2_preindustrial)

print("Phase 3 : Calcul des flux actuels (420 ppm)...")
_, _, upward_flux_current_ref, _, temp_eff_current_ref = simulate_radiative_transfer(CO2_current)

# ============================================================================
# PHASE 4 : MISE À JOUR DES COURBES DE RÉFÉRENCE
# ============================================================================

delta_lambda = lambda_range[1] - lambda_range[0]

# Mettre à jour les courbes Planck avec la bonne plage de longueurs d'onde
line_planck_surface.set_data(1e6 * lambda_range, np.pi * planck_function(lambda_range, T_surface)/1e6)
line_planck_tropopause.set_data(1e6 * lambda_range, np.pi * planck_function(lambda_range, T_tropopause)/1e6)

# Mettre à jour les courbes de référence avec les données calculées
line_preindustrial.set_data(1e6 * lambda_range, upward_flux_preindustrial[-1, :]/delta_lambda/1e6)
line_current_ref.set_data(1e6 * lambda_range, upward_flux_current_ref[-1, :]/delta_lambda/1e6)

# Redessiner
fig.canvas.draw()

# ============================================================================
# PHASE 5 : CRÉATION DES BOUTONS INTERACTIFS
# ============================================================================

print("Phase 5 : Création des boutons interactifs...")
create_clickable_buttons()
fig.canvas.draw()  # Redessiner pour afficher les boutons

# ============================================================================
# PHASE 6 : INITIALISATION AVEC LA PREMIÈRE VALEUR
# ============================================================================

print("Phase 6 : Initialisation avec 560 ppm (×2)...")
update(current_exponent)

# Ajout du copyright sur le graphique (en bas) - discret, thin, tiny
fig.text(0.5, 0.005, 'Basé sur: https://www.youtube.com/watch?v=ewc8FBtEKPs | GitHub: RadiativeForcing (David Louapre © Science étonnante)', 
         ha='center', va='bottom', fontsize=6, style='normal', color='gray', weight='normal')

# Suppression complète de la bande en bas - position précise de l'axe
ax.set_position([0.08, 0.10, 0.87, 0.88])  # [left, bottom, width, height]

# Suppression complète de la toolbar si elle existe encore
try:
    fig.canvas.manager.toolbar.hide()
except:
    pass

# Passer en mode bloquant pour l'interaction
plt.ioff()
plt.show()
# ----------------------------------------------------------------------------------------------------------------------