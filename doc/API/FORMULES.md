# Formules du Modèle de Transfert Radiatif

## 1. Fonction de Planck

La luminance spectrale d'un corps noir à la température $T$ et à la longueur d'onde $\lambda$ est donnée par :

$$B_\lambda(T) = \frac{2hc^2}{\lambda^5} \frac{1}{e^{hc/(\lambda k_B T)} - 1}$$

où :
- $h = 6.62607015 \times 10^{-34}$ J·s (constante de Planck)
- $c = 2.998 \times 10^8$ m/s (vitesse de la lumière)
- $k_B = 1.380649 \times 10^{-23}$ J/K (constante de Boltzmann)
- $T$ : température en Kelvin
- $\lambda$ : longueur d'onde en mètres

Le flux spectral émis par la surface terrestre (intégré sur l'hémisphère) est :

$$F_\lambda = \pi B_\lambda(T)$$

## 2. Modèle Atmosphérique

### Pression atmosphérique

La pression décroît exponentiellement avec l'altitude :

$$P(z) = P_0 e^{-z/H}$$

où :
- $P_0 = 101325$ Pa (pression au niveau de la mer)
- $H = 8500$ m (échelle de hauteur)
- $z$ : altitude en mètres

### Température atmosphérique

Modèle de température avec gradient dans la troposphère :

$$T(z) = \begin{cases}
T_0 + \Gamma z & \text{si } z < z_{\text{trop}} \\
T_{\text{trop}} & \text{si } z \geq z_{\text{trop}}
\end{cases}$$

où :
- $T_0 = 288.2$ K (température au niveau de la mer)
- $\Gamma = -0.0065$ K/m (gradient de température)
- $z_{\text{trop}} = 11000$ m (hauteur de la tropopause)
- $T_{\text{trop}} = T_0 + \Gamma z_{\text{trop}} \approx 216$ K

### Densité numérique de l'air

$$n_{\text{air}}(z) = \frac{P(z)}{k_B T(z)}$$

### Densité numérique du CO₂

$$n_{\text{CO}_2}(z) = n_{\text{air}}(z) \times f_{\text{CO}_2}$$

où $f_{\text{CO}_2}$ est la fraction molaire de CO₂ (par exemple, 280 ppm = $280 \times 10^{-6}$).

## 3. Absorption du CO₂

### Section efficace d'absorption

La section efficace d'absorption du CO₂ en fonction de la longueur d'onde est modélisée par :

$$\sigma_{\text{CO}_2}(\lambda) = 10^{-22.5 - 24 \left|\frac{\lambda - \lambda_0}{\lambda_0}\right|}$$

où :
- $\lambda_0 = 15 \times 10^{-6}$ m (centre de la bande d'absorption du CO₂)

### Coefficient d'absorption

$$\kappa(\lambda, z) = \sigma_{\text{CO}_2}(\lambda) \times n_{\text{CO}_2}(z)$$

### Épaisseur optique

Pour une couche d'épaisseur $\Delta z$ :

$$\tau(\lambda, z) = \kappa(\lambda, z) \times \Delta z$$

## 4. Équation de Transfert Radiatif

Pour chaque couche atmosphérique à l'altitude $z$ et chaque longueur d'onde $\lambda$ :

### Flux absorbé

$$F_{\text{absorbé}}(\lambda, z) = \min(\kappa(\lambda, z) \Delta z \times F_{\text{in}}(\lambda), F_{\text{in}}(\lambda))$$

### Flux émis

$$F_{\text{émis}}(\lambda, z) = \tau(\lambda, z) \times \pi B_\lambda(T(z)) \times \Delta \lambda$$

### Flux sortant

$$F_{\text{out}}(\lambda, z) = F_{\text{in}}(\lambda) - F_{\text{absorbé}}(\lambda, z) + F_{\text{émis}}(\lambda, z)$$

Le flux sortant d'une couche devient le flux entrant de la couche suivante :

$$F_{\text{in}}(\lambda, z + \Delta z) = F_{\text{out}}(\lambda, z)$$

### Condition limite (surface terrestre)

$$F_{\text{in}}(\lambda, z=0) = \pi B_\lambda(T(0)) \times \Delta \lambda$$

## 5. Flux Total et Température Effective

### Flux total au sommet de l'atmosphère

Le flux total sortant est la somme sur toutes les longueurs d'onde :

$$F_{\text{total}} = \sum_{\lambda} F_{\text{out}}(\lambda, z_{\text{max}})$$

### Loi de Stefan-Boltzmann

Le flux total est lié à la température effective par :

$$F_{\text{total}} = \sigma T_{\text{eff}}^4$$

où :
- $\sigma = 5.670374419 \times 10^{-8}$ W/(m²·K⁴) (constante de Stefan-Boltzmann)

### Température effective

$$T_{\text{eff}} = \left(\frac{F_{\text{total}}}{\sigma}\right)^{1/4}$$

Cette température effective correspond à la température d'un corps noir qui émettrait le même flux total. C'est pourquoi chaque courbe de flux observée "descend" sur sa courbe Planck correspondante : elles ont la même intégrale (surface sous la courbe), garantie par la conservation de l'énergie.

## 6. Forçage Radiatif

Le diagnostic ΔF (convention affichage, climate.js) est la différence de flux total entre deux scénarios :

$$\Delta F = F_{\text{total}}(f_{\text{CO}_2}) - F_{\text{total}}(f_{\text{CO}_2, \text{ref}})$$

où $f_{\text{CO}_2, \text{ref}}$ est généralement la concentration de référence (0 ppm ou 280 ppm).

## 7. Variation de Température

La variation de température effective est :

$$\Delta T = T_{\text{eff}}(f_{\text{CO}_2}) - T_{\text{eff}}(f_{\text{CO}_2, \text{ref}})$$

## Notes

- Toutes les intégrales sur les longueurs d'onde sont discrétisées avec un pas $\Delta \lambda$
- Toutes les intégrales sur l'altitude sont discrétisées avec un pas $\Delta z$
- Le modèle suppose un équilibre : le flux total sortant doit égaler le flux total entrant (loi de conservation de l'énergie)
- Chaque courbe de flux observée correspond à une température effective unique, déterminée par la loi de Stefan-Boltzmann

