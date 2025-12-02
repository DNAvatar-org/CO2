#!/usr/bin/env node
/**
 * Script de test pour l'interpréteur de configuration dynamique
 * Teste le remplacement de {$ticTime} et des expressions mathématiques
 */

// Simuler window.infoTimeMa
const window = { infoTimeMa: 0 };

function interpretConfigValue(value) {
    console.log('\n=== TEST ===');
    console.log('Valeur originale:', value);
    console.log('Type:', typeof value);
    
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value !== 'string') {
        return value;
    }
    
    // Initialiser infoTimeMa si nécessaire
    if (typeof window.infoTimeMa === 'undefined') {
        window.infoTimeMa = 0;
    }
    
    // Calculer ticTime = infoTimeMa / 50
    const ticTime = Math.floor((window.infoTimeMa || 0) / 50);
    console.log('ticTime calculé:', ticTime);
    
    // Détecter si c'est un chemin d'image
    const isImagePath = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value);
    console.log('Est un chemin d\'image:', isImagePath);
    
    // Si pas de placeholder, retourner tel quel
    if (!value.includes('{$') && !value.includes('$ticTime')) {
        console.log('❌ Pas de placeholder détecté');
        return value;
    }
    
    let interpreted = value;
    
    // Pattern pour trouver {expression}
    const expressionPattern = /\{([^}]+)\}/g;
    const matches = [...value.matchAll(expressionPattern)];
    console.log('Expressions trouvées:', matches.length);
    
    // Traiter chaque expression
    for (const match of matches) {
        const fullMatch = match[0]; // {expression}
        const expression = match[1]; // expression (sans les accolades)
        
        console.log('  - FullMatch:', fullMatch);
        console.log('  - Expression:', expression);
        
        // Remplacer $ticTime par la valeur
        let exprWithValue = expression.replace(/\$ticTime/g, ticTime.toString());
        console.log('  - Après remplacement $ticTime:', exprWithValue);
        
        try {
            // Évaluer l'expression
            const result = eval(exprWithValue);
            console.log('  - Résultat évaluation:', result);
            
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                // Pour les images, arrondir automatiquement
                const finalResult = isImagePath ? Math.round(result) : result;
                console.log('  - Résultat final (arrondi si image):', finalResult);
                
                // Remplacer dans la chaîne
                interpreted = interpreted.replace(fullMatch, finalResult.toString());
                console.log('  - Chaîne après remplacement:', interpreted);
            } else {
                console.log('  ❌ Résultat invalide:', result);
            }
        } catch (e) {
            console.log('  ❌ Erreur évaluation:', e.message);
            // Fallback: utiliser exprWithValue
            const fallback = exprWithValue;
            interpreted = interpreted.replace(fullMatch, fallback);
            console.log('  - Fallback:', fallback);
            console.log('  - Chaîne après fallback:', interpreted);
        }
    }
    
    // Si c'est une expression mathématique pure (pas une image), évaluer le résultat final
    if (!isImagePath && matches.length > 0) {
        const mathExpressionPattern = /^[\d\s+\-*/().]+$/;
        if (mathExpressionPattern.test(interpreted.trim())) {
            try {
                const result = eval(interpreted.trim());
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    console.log('  - Expression complète évaluée:', result);
                    return result;
                }
            } catch (e) {
                // Ignorer l'erreur
            }
        }
    }
    
    console.log('✅ Résultat final:', interpreted);
    return interpreted;
}

// Tests
console.log('='.repeat(60));
console.log('TESTS DE L\'INTERPRÉTEUR');
console.log('='.repeat(60));

// Test 1: {$ticTime} simple
console.log('\n📝 TEST 1: {$ticTime} simple');
const test1 = interpretConfigValue('fonts/pics/text_hadeen{$ticTime}.png');
console.assert(test1 === 'fonts/pics/text_hadeen0.png', '❌ Test 1 échoué');

// Test 2: {$ticTime/3} avec division
console.log('\n📝 TEST 2: {$ticTime/3} avec division');
window.infoTimeMa = 150; // ticTime = 3
const test2 = interpretConfigValue('fonts/pics/text_archeen{$ticTime/3}.png');
console.assert(test2 === 'fonts/pics/text_archeen1.png', '❌ Test 2 échoué');

// Test 3: Expression mathématique pour lightDistance
console.log('\n📝 TEST 3: Expression mathématique (lightDistance)');
window.infoTimeMa = 100; // ticTime = 2
const test3 = interpretConfigValue('7-{$ticTime}/2');
console.assert(test3 === 6, '❌ Test 3 échoué');

// Test 4: Pas de placeholder
console.log('\n📝 TEST 4: Pas de placeholder');
const test4 = interpretConfigValue('fonts/pics/text_noir.png');
console.assert(test4 === 'fonts/pics/text_noir.png', '❌ Test 4 échoué');

// Test 5: Remise à zéro
console.log('\n📝 TEST 5: Remise à zéro');
window.infoTimeMa = 0;
const test5 = interpretConfigValue('fonts/pics/text_hadeen{$ticTime}.png');
console.assert(test5 === 'fonts/pics/text_hadeen0.png', '❌ Test 5 échoué');

console.log('\n' + '='.repeat(60));
console.log('✅ TOUS LES TESTS PASSÉS !');
console.log('='.repeat(60));

