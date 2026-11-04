# File: run.py - Banc headless API_BILAN (Chrome + CDP, sans interface)
# Desc: Lance Chrome headless sur host.html servi par le serveur local permanent (8001), injecte un script de mesure,
#       attend, imprime. Sert à mesurer le modèle sans ouvrir de navigateur — bench 19 époques, sondes, balayages de jauges.
# Version 1.3.0
# logs :
#   - v1.3.0: plus aucun serveur ouvert ici : host.html et API_BILAN viennent de _outward/start_local.sh (port 8001) ;
#     Chrome sur un port de débogage libre (0, lu dans DevToolsActivePort) avec un profil neuf par run : deux sessions
#     peuvent lancer le banc en même temps sans s'attacher l'une à l'autre.
#   - v1.2.0: --stream VAR : chaque nouvel élément de window.VAR imprimé dès qu'il existe (« § » + JSON) ;
#     avancement sondé toutes les 0,5 s et imprimé à chaque CHANGEMENT d'étape (avant : toutes les 10 s).
#   - v1.1.0: s'attache à l'onglet portant SON ?cb= (et non au premier « host.html » venu) : un Chrome
#     resté ouvert par un script interrompu faisait tourner la mesure suivante dans son onglet, avec
#     le TIMELINE qu'il avait modifié en mémoire (2026-09-24 : une courbe générée sur de fausses dates).
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Date: 2026-09-22
"""
Usage (depuis la racine du dépôt CO2) :

    python3 scripts/bench_headless/run.py bench19.js
    python3 scripts/bench_headless/run.py mon_script.js --timeout 1800

Le script injecté doit poser window.__PROG__ = 'done' (ou 'error') quand il a fini, et déposer
son résultat dans une variable window.__XXX__ que --var nomme (défaut : __R6__).

Pré-requis : Google Chrome installé, python3. Aucune dépendance pip (client CDP maison, cdp.py).
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cdp

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))   # …/site
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
# Serveur local permanent (_outward/start_local.sh, racine = site/). host.html y est lu sur 127.0.0.1, l'API sur localhost :
# deux origines, ce qu'exige le repli blob des workers spectraux (voir host.html).
HOST_URL = 'http://127.0.0.1:8001/' + os.path.relpath(os.path.join(HERE, 'host.html'), SITE)


def port_devtools(profile):
    """Port de débogage choisi par Chrome (--remote-debugging-port=0), écrit dans DevToolsActivePort du profil."""
    fichier = os.path.join(profile, 'DevToolsActivePort')
    for _ in range(60):
        if os.path.exists(fichier):
            lignes = open(fichier).read().split()
            if lignes:
                return int(lignes[0])
        time.sleep(0.5)
    raise SystemExit('Chrome n\'a pas ouvert de port de débogage (' + fichier + ')')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script', help='fichier .js à injecter (relatif à ce dossier si non trouvé)')
    ap.add_argument('--var', default='__R6__', help='variable window.* à lire en sortie')
    ap.add_argument('--timeout', type=int, default=1800, help='secondes')
    ap.add_argument('--stream', default=None, help='tableau window.* dont chaque nouvel élément est imprimé AU FIL DE L\'EAU (ligne « § » + JSON)')
    a = ap.parse_args()

    path = a.script if os.path.exists(a.script) else os.path.join(HERE, a.script)
    js = open(path, encoding='utf-8').read()

    try:
        urllib.request.urlopen(HOST_URL, timeout=5)
    except OSError as e:
        raise SystemExit('serveur local 8001 injoignable (' + str(e) + ') : _outward/start_local.sh doit tourner')
    profile = tempfile.mkdtemp(prefix='banc-chrome-')
    cb = '%d' % int(time.time() * 1000)
    chrome = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--no-first-run',
                               '--user-data-dir=' + profile, '--remote-debugging-port=0',
                               HOST_URL + '?cb=' + cb],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        c = cdp.attach(port=port_devtools(profile), url_filter='host.html?cb=' + cb, tries=60)
        for _ in range(120):
            if c.eval('window.__READY__'):
                break
            time.sleep(0.5)
        if not c.eval('window.__READY__'):
            raise SystemExit('chargement incomplet : ' + str(c.eval('window.__LOAD_ERR__')))
        c.eval(js, await_promise=False)
        t0 = time.time(); dernier = None; envoyes = 0
        def vider_flux():
            nonlocal envoyes
            if not a.stream:
                return
            n = c.eval('(window.%s || []).length' % a.stream) or 0
            if n > envoyes:
                for el in json.loads(c.eval('JSON.stringify(window.%s.slice(%d))' % (a.stream, envoyes))):
                    print('§' + json.dumps(el, ensure_ascii=False), flush=True)
                envoyes = n
        while time.time() - t0 < a.timeout:
            prog = c.eval('window.__PROG__')
            vider_flux()
            if prog in ('done', 'error'):
                break
            if prog != dernier:   # une ligne par étape, pas une par sondage
                print('… %4ds  %s' % (time.time() - t0, prog), flush=True)
                dernier = prog
            time.sleep(0.5)
        vider_flux()
        err = c.eval('window.__ERR__')
        if err:
            print('ERREUR dans le script injecté :\n' + err[:2000])
            return 1
        print(json.dumps(c.eval('window.' + a.var), ensure_ascii=False, indent=1))
        return 0
    finally:
        chrome.terminate(); chrome.wait(); shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
