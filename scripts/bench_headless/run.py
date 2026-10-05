# File: run.py - Banc headless API_BILAN (Chrome + CDP, sans interface)
# Desc: Sert le site, lance Chrome headless sur host.html, injecte un script de mesure, attend, imprime.
#       Sert à mesurer le modèle sans ouvrir de navigateur — bench 19 époques, sondes, balayages de jauges.
# Version 1.2.0
# logs :
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
import argparse, json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cdp

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))   # …/site
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def serve(directory, port):
    return subprocess.Popen([sys.executable, '-m', 'http.server', str(port)],
                            cwd=directory, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script', help='fichier .js à injecter (relatif à ce dossier si non trouvé)')
    ap.add_argument('--var', default='__R6__', help='variable window.* à lire en sortie')
    ap.add_argument('--timeout', type=int, default=1800, help='secondes')
    ap.add_argument('--stream', default=None, help='tableau window.* dont chaque nouvel élément est imprimé AU FIL DE L\'EAU (ligne « § » + JSON)')
    a = ap.parse_args()

    path = a.script if os.path.exists(a.script) else os.path.join(HERE, a.script)
    js = open(path, encoding='utf-8').read()

    srv_site = serve(SITE, 8765)
    srv_host = serve(HERE, 8766)
    profile = os.path.join(HERE, '.chrome-profile')
    cb = '%d' % int(time.time() * 1000)
    chrome = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--no-first-run',
                               '--user-data-dir=' + profile, '--remote-debugging-port=9333',
                               'http://127.0.0.1:8766/host.html?cb=' + cb],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(6)
        c = cdp.attach(url_filter='host.html?cb=' + cb, tries=60)
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
        chrome.terminate(); srv_site.terminate(); srv_host.terminate()


if __name__ == '__main__':
    sys.exit(main())
