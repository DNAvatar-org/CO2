#!/usr/bin/env python3
"""
Update JS headers to add UTF8 / Ā unit motto and normalize Commons Clause lines.

Règle (déduite du user) pour chaque fichier .js :
- Chercher la ligne Copyright 2025 DNAvatar.org - Arnaud Maignan ou © 2025 DNAvatar.org - Arnaud Maignan.
- Juste après :
  - S'assurer que la ligne 'Licensed under Apache License 2.0 with Commons Clause.' existe (on ne la modifie pas).
  - Remplacer 'See LICENSE_HEADER.txt for full terms.' par
    'See https://commonsclause.com/ for full terms.' si besoin.
  - Vérifier / insérer les lignes suivantes si absentes :
    // ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
    // "La carte c'est le territoire, le territoire c'est le code."
    // UTF8 est la sémantique pour CODE & UI
  - Corriger l'éventuelle faute 'Aristolicisme' -> 'Aristotelicisme'.
  - Supprimer une ligne isolée '// -- LOGS' juste après ces lignes (le user ne la veut plus ici).
"""

import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

MOTTO_LINES = [
    "// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.\n",
    '// "La carte c\'est le territoire, le territoire c\'est le code."\n',
    "// UTF8 est la sémantique pour CODE & UI\n",
]


def process_file(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    changed = False

    # Trouver la ligne Copyright
    idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if ("Copyright 2025 DNAvatar.org - Arnaud Maignan" in stripped) or (
            "© 2025 DNAvatar.org - Arnaud Maignan" in stripped
        ):
            idx = i
            break
    if idx is None:
        return False

    # Travailler en style (prefix) : "//" ou " *"
    def same_prefix(line: str) -> str:
        l = line.lstrip()
        if l.startswith("//"):
            return "// "
        if l.startswith("*"):
            return "* "
        return "// "

    prefix = same_prefix(lines[idx])

    # Vérifier la ligne Licensed (idx+1)
    if idx + 1 < len(lines):
        lic = lines[idx + 1]
        if "Licensed under Apache License 2.0 with Commons Clause." in lic:
            # On laisse tel quel, juste normaliser le prefix si besoin
            if not lic.lstrip().startswith(prefix.strip()):
                lic_body = lic.lstrip().split("Licensed", 1)[-1]
                lines[idx + 1] = f"{prefix}Licensed{lic_body}"
                changed = True

    # Ligne "See ..." (idx+2 attendu)
    see_idx = idx + 2
    if see_idx < len(lines):
        see = lines[see_idx]
        if "See LICENSE_HEADER.txt for full terms." in see:
            # Remplacer par l'URL commonsclause
            lines[see_idx] = f"{prefix}See https://commonsclause.com/ for full terms.\n"
            changed = True
        elif "See https://commonsclause.com/ for full terms." in see:
            # OK, rien à faire
            pass
        else:
            # Pas de ligne "See ..." là où on l'attend : on ne touche pas.
            return changed
    else:
        return changed

    insert_pos = see_idx + 1

    # Vérifier si les lignes motto existent déjà
    def line_is_motto(line: str, target: str) -> bool:
        return target.strip() in line.strip()

    # Corriger faute d’orthographe au passage
    for i in range(insert_pos, min(insert_pos + 4, len(lines))):
        if "non Aristolicisme via UTF8." in lines[i]:
            lines[i] = lines[i].replace("Aristolicisme", "Aristotelicisme")
            changed = True

    have_motto = False
    if insert_pos + 2 < len(lines):
        segment = lines[insert_pos : insert_pos + 3]
        if all(line_is_motto(segment[i], MOTTO_LINES[i]) for i in range(3)):
            have_motto = True

    if not have_motto:
        # Insérer les trois lignes, adaptées au prefix
        motto_prefixed = []
        for raw in MOTTO_LINES:
            body = raw.split("//", 1)[-1].lstrip()
            motto_prefixed.append(prefix + body)
        lines[insert_pos:insert_pos] = motto_prefixed
        changed = True
        # Décaler insert_pos pour la suite
        insert_pos += 3

    # ------------------------------------------------------------------
    # Normaliser le bloc Date / logs dans le header
    # - Date doit être sous Version
    # - Ajouter/normaliser une ligne "logs :" juste après Date
    # ------------------------------------------------------------------
    header_limit = min(len(lines), 20)
    header_lines = lines[:header_limit]
    body_lines = lines[header_limit:]

    # Trouver indices dans le header
    version_idx = None
    date_idx = None
    for i, line in enumerate(header_lines):
        s = line.lower()
        if version_idx is None and "version" in s:
            version_idx = i
        if date_idx is None and "date:" in s:
            date_idx = i
    if version_idx is not None and date_idx is not None and date_idx != version_idx + 1:
        # On va reconstruire le header pour déplacer Date sous Version + insérer logs :
        date_line = header_lines[date_idx]
        # Filtrer header pour supprimer anciennes lignes Date et logs (toutes variantes)
        new_header = []
        for line in header_lines:
            s = line.strip().lower()
            if "date:" in s:
                continue
            if s.startswith("// logs") or s.startswith("* logs") or s.startswith("// -- logs") or s.startswith("* -- logs"):
                continue
            new_header.append(line)
        # Rechercher la nouvelle position de Version dans new_header
        new_version_idx = None
        for i, line in enumerate(new_header):
            if "version" in line.lower():
                new_version_idx = i
                break
        if new_version_idx is not None:
            pref = same_prefix(new_header[new_version_idx])
            logs_line = f"{pref}logs :\n"
            insert_at = new_version_idx + 1
            new_header.insert(insert_at, date_line)
            new_header.insert(insert_at + 1, logs_line)
            header_lines = new_header
            lines = header_lines + body_lines
            changed = True

    if changed:
        path.write_text("".join(lines), encoding="utf-8")
    return changed


def main() -> None:
    js_files = []
    for p in (ROOT / "static").rglob("*.js"):
        js_files.append(p)
    for p in (ROOT / "organigramme").rglob("*.js"):
        js_files.append(p)
    for p in (ROOT / "doc").rglob("*.js"):
        js_files.append(p)

    total = 0
    for path in sorted(js_files):
        if process_file(path):
            print(f"updated: {path.relative_to(ROOT)}")
            total += 1
    print(f"done, updated {total} files")


if __name__ == "__main__":
    main()

