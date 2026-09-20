#!/usr/bin/env python3
# File: generate_deploy_config.py - Manifeste deploy CO2 depuis références runtime
# Desc: Parse index/loader/configOrganigramme/alphabet/CSS ; ne garde que fichiers existants
# Version 1.0.1
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: July 11, 2025
# Logs:
# - v1.0.1: parse_api_epoch_textures — 🌙 (carte de nuit) et 🖼 (suite d'images) sont cités dans
#   API_BILAN/config/configTimeline.js depuis le déménagement de la config d'époques ; sans cette
#   passe fonds/_002000n.png disparaissait du manifeste.
# - v1.0.0: initial — TEXTURES_THREEJS, SCRIPTS loader, HTML chain, charsImages, url() CSS

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST_PREFIX = "pages/bilan_radiatif/CO2"
# L'adresse de déploiement ne va PAS dans le manifeste : ce dépôt est public.
# publish.php la lit depuis DEPLOY_ENDPOINT, .private/deploy.endpoint ou
# ~/.dnavatar/deploy.endpoint — la clé JSON n'est qu'un dernier recours, et
# la réinjecter ici annulerait l'expurgation à chaque régénération.

EXCLUDE_PREFIXES = (
    "doc/",
    "tools/",
    ".cursor/",
    ".well-known/",
    "static/textures/",
    "projet/",
    "html/admin_",
    "html/search_scie.html",
)
EXCLUDE_SUFFIXES = (
    ".md",
    ".mdc",
    ".py",
    ".sh",
    ".sfd",
    ".DS_Store",
    ".data",
    ".ods",
)

RE_SCRIPT = re.compile(r"""<script[^>]+src=["']([^"']+)["']""", re.I)
RE_LINK = re.compile(r"""<link[^>]+href=["']([^"']+)["']""", re.I)
RE_FETCH = re.compile(r"""fetch\(\s*['"]([^'"]+)['"]""")
RE_IFRAME = re.compile(r"""<iframe[^>]+src=["']([^"']+)["']""", re.I)
RE_IMG = re.compile(r"""<img[^>]+src=["']([^"']+)["']""", re.I)
RE_MODAL = re.compile(
    r"""openPageModal\(\s*['"]([^'"]+\.html)['"]""", re.I
)
RE_CHARS_IMAGE = re.compile(r"""['"][^'"]+['"]\s*:\s*['"](fonts/pics/[^'"]+)['"]""")
RE_FONTS_PICS = re.compile(r"""['"](fonts/pics/[^'"]+\.(?:png|jpg|svg))['"]""")
RE_CSS_URL = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""")
RE_SCRIPTS_ARRAY = re.compile(
    r"const\s+SCRIPTS\s*=\s*\[([\s\S]*?)\];", re.M
)
RE_QUOTED_PATH = re.compile(r"""['"]([^'"]+\.(?:js|html|css|png|jpg|svg|ico|ttf|TTF))['"]""")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def is_excluded(rel: str) -> bool:
    if rel.startswith("../") or rel.startswith("/"):
        return True
    for prefix in EXCLUDE_PREFIXES:
        if rel.startswith(prefix):
            return True
    for suffix in EXCLUDE_SUFFIXES:
        if rel.endswith(suffix):
            return True
    if "://" in rel:
        return True
    return False


def normalize_ref(ref: str, base_file: Path) -> str | None:
    ref = ref.strip()
    if not ref or ref.startswith("#") or ref.startswith("data:"):
        return None
    if ref.startswith("/CO2/"):
        ref = ref[5:]
    if ref.startswith("http://") or ref.startswith("https://") or ref.startswith("//"):
        return None
    if ref.startswith("/"):
        return None
    if ref.startswith("../API_BILAN/") or ref.startswith("../../API_BILAN/"):
        return None
    if ref.startswith("../_interfaces/") or ref.startswith("../../_interfaces/"):
        return None
    if ref.startswith("../../CO2/"):
        ref = ref[len("../../CO2/") :]
    if ref.startswith("../"):
        resolved = (base_file.parent / ref).resolve()
        try:
            rel = resolved.relative_to(ROOT.resolve())
        except ValueError:
            return None
        return rel.as_posix()
    return ref.lstrip("./")


def add_path(paths: set[str], ref: str, base_file: Path) -> None:
    rel = normalize_ref(ref, base_file)
    if not rel or is_excluded(rel):
        return
    paths.add(rel)


def parse_loader_scripts(paths: set[str]) -> None:
    loader = ROOT / "static/ui/loader_panels.js"
    text = read_text(loader)
    match = RE_SCRIPTS_ARRAY.search(text)
    if not match:
        print("❌ [generate_deploy_config] SCRIPTS introuvable dans loader_panels.js", file=sys.stderr)
        return
    for m in RE_QUOTED_PATH.finditer(match.group(1)):
        add_path(paths, m.group(1), loader)


def parse_index_assets(paths: set[str]) -> None:
    index = ROOT / "index.html"
    text = read_text(index)
    for rx in (RE_SCRIPT, RE_LINK):
        for m in rx.finditer(text):
            add_path(paths, m.group(1), index)
    for m in RE_IFRAME.finditer(text):
        add_path(paths, m.group(1), index)
    for m in RE_MODAL.finditer(text):
        add_path(paths, m.group(1), index)
    for m in RE_FETCH.finditer(text):
        add_path(paths, m.group(1), index)
    paths.add("index.html")


def parse_html_chain(paths: set[str]) -> None:
    seeds = [
        "index.html",
        "html/visu_radiatif.html",
        "html/scie_radiatif.html",
        "html/bench_panel.html",
        "html/hysteresis_panel.html",
        "html/scie_compute.html",
        "html/hysteresis_compute.html",
        "html/test_milankovitch.html",
        # equation.html / Algorithmes.html : partis dans API_BILAN/doc/ (ce sont des documents du modèle).
        # alphabet.html / dico.html : partis dans API_BILAN/demo/ (rendu des définitions de l'API).
    ]
    queue = list(seeds)
    seen_html: set[str] = set()
    while queue:
        rel = queue.pop(0)
        if rel in seen_html or is_excluded(rel):
            continue
        seen_html.add(rel)
        paths.add(rel)
        full = ROOT / rel
        if not full.is_file():
            continue
        text = read_text(full)
        for rx in (RE_SCRIPT, RE_LINK, RE_IFRAME, RE_FETCH, RE_MODAL, RE_IMG):
            for m in rx.finditer(text):
                ref = m.group(1)
                add_path(paths, ref, full)
                norm = normalize_ref(ref, full)
                if norm and norm.endswith(".html") and norm not in seen_html:
                    queue.append(norm)


def parse_chars_images(paths: set[str]) -> None:
    # charsImages vit avec le rendu, parti dans API_BILAN/demo/. CO2 garde ses propres fonts/pics/ :
    # l'app les résout par rapport au document, pas au script. On lit donc la liste là où elle est.
    alphabet = ROOT.parent / "API_BILAN/demo/js/alphabet_render.js"
    if not alphabet.exists():
        return
    text = read_text(alphabet)
    for m in RE_CHARS_IMAGE.finditer(text):
        paths.add(m.group(1))


def parse_config_assets(paths: set[str]) -> None:
    config = ROOT / "organigramme/configOrganigramme.js"
    text = read_text(config)
    for m in RE_FONTS_PICS.finditer(text):
        paths.add(m.group(1))
    ma_match = re.search(
        r"const\s+TEXTURE_DATES_MA\s*=\s*\[([\d,\s]+)\]", text
    )
    year_match = re.search(
        r"const\s+TEXTURE_DATES_YEAR\s*=\s*\[([-\d,\s]+)\]", text
    )
    if not ma_match or not year_match:
        print(
            "❌ [generate_deploy_config] TEXTURE_DATES_* introuvable",
            file=sys.stderr,
        )
        return
    ma_dates = [int(x.strip()) for x in ma_match.group(1).split(",") if x.strip()]
    year_dates = [
        int(x.strip()) for x in year_match.group(1).split(",") if x.strip()
    ]
    for ma in ma_dates:
        paths.add(f"fonds/-{str(ma).zfill(5)}Ma.png")
    for y in year_dates:
        y_r = round(float(y))
        padded = str(abs(y_r)).zfill(6)
        pref = "-" if y_r < 0 else "_"
        paths.add(f"fonds/{pref}{padded}a.png")


def parse_api_epoch_textures(paths: set[str]) -> None:
    """Textures citées par la config d'époques, partie dans API_BILAN.

    La carte de nuit 🌙 et la suite d'images 🖼 sont des PNG de CO2/fonds/, mais leur
    référence vit dans API_BILAN/config/configTimeline.js depuis que la config d'époques
    y a déménagé. Le reste du générateur ne lit que CO2 : sans cette passe, _002000n.png
    sortait du manifeste alors que la Terre après 2000 s'en sert pour sa face nocturne.
    """
    config = ROOT.parent / "API_BILAN/config/configTimeline.js"
    if not config.exists():
        print(
            "❌ [generate_deploy_config] API_BILAN/config/configTimeline.js introuvable",
            file=sys.stderr,
        )
        return
    text = read_text(config)
    for m in re.finditer(r"""['"](fonds/[^'"]+\.(?:png|jpg|svg))['"]""", text):
        paths.add(m.group(1))


def parse_js_string_assets(paths: set[str]) -> None:
    for js in ROOT.rglob("*.js"):
        if "tools/" in js.as_posix() or "static/lib/" in js.as_posix():
            continue
        rel_js = js.relative_to(ROOT).as_posix()
        if is_excluded(rel_js):
            continue
        text = read_text(js)
        for m in RE_FONTS_PICS.finditer(text):
            paths.add(m.group(1))


def parse_css_urls(paths: set[str]) -> None:
    css_files = list((ROOT / "static/css").glob("*.css"))
    css_files.append(ROOT / "organigramme/organigramme.css")
    for css in css_files:
        if not css.is_file():
            continue
        paths.add(css.relative_to(ROOT).as_posix())
        text = read_text(css)
        for m in RE_CSS_URL.finditer(text):
            ref = m.group(1).strip()
            if ref.startswith("https://") or ref.startswith("http://"):
                continue
            add_path(paths, ref, css)


def collect_runtime_paths() -> set[str]:
    paths: set[str] = set()
    paths.update(["favicon.ico", "favicon64.png"])
    parse_index_assets(paths)
    parse_loader_scripts(paths)
    parse_html_chain(paths)
    parse_chars_images(paths)
    parse_config_assets(paths)
    parse_api_epoch_textures(paths)
    parse_js_string_assets(paths)
    parse_css_urls(paths)
    return {p for p in paths if not is_excluded(p)}


def build_manifest() -> tuple[list[dict], list[str], list[str]]:
    wanted = collect_runtime_paths()
    entries: list[dict] = []
    present: list[str] = []
    missing: list[str] = []
    for rel in sorted(wanted):
        full = ROOT / rel
        if full.is_file():
            present.append(rel)
            entries.append({"src": rel, "dest": f"{DEST_PREFIX}/{rel}"})
        else:
            missing.append(rel)
    return entries, present, missing


def main() -> int:
    entries, present, missing = build_manifest()
    out_path = ROOT / "deploy.config.json"
    old_count = 0
    if out_path.is_file():
        try:
            old_count = len(json.loads(read_text(out_path)).get("files", []))
        except json.JSONDecodeError:
            old_count = 0
    out = {
        "_endpoint": "Hors dépôt : DEPLOY_ENDPOINT, .private/deploy.endpoint ou ~/.dnavatar/deploy.endpoint",
        "_layout": "CO2 → www/pages/bilan_radiatif/CO2/. cd CO2 && publish [--full]",
        "_generated": "tools/generate_deploy_config.py — références runtime, fichiers existants uniquement",
        "git_root": ".",
        "files_root": ".",
        "files": entries,
    }
    out_path.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    delta = len(entries) - old_count
    delta_s = f"{delta:+d}" if old_count else "nouveau"
    print(
        f"✓ deploy.config.json — {len(entries)} fichiers "
        f"(avant {old_count}, {delta_s})"
    )
    if missing:
        print(f"⚠️  {len(missing)} références runtime absentes du disque :")
        for rel in missing:
            print(f"   - {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
