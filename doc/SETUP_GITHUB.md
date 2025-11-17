# Setup GitHub - Instructions en 3 clics

## ✅ Déjà fait automatiquement :
- ✅ Repo Git initialisé
- ✅ Premier commit créé
- ✅ Fichier .gitignore créé

## 🚀 Il ne reste que 3 étapes simples :

### Option A : Via GitHub Desktop (LE PLUS SIMPLE - 3 clics)

1. **Ouvrez GitHub Desktop**
2. **Cliquez sur "File" → "Add Local Repository"**
   - Sélectionnez ce dossier : `/Users/dnavatar/Desktop/_dnavatar/apps/src/RadiativeForcing-main`
3. **Cliquez sur "Publish repository"** (bouton en haut à droite)
   - Nom : `RadiativeForcing` (ou ce que vous voulez)
   - Description : "Simulation du forçage radiatif avec interface web interactive"
   - Cochez "Private" si vous voulez (optionnel)
   - **Cliquez sur "Publish Repository"**

**C'est tout !** Le repo est créé, connecté ET le code est poussé automatiquement. **Pas besoin de push manuel.**

---

### Option B : Via GitHub.com (si vous préférez)

1. **Allez sur** https://github.com/new
2. **Créez le repo** :
   - Repository name : `RadiativeForcing`
   - Description : "Simulation du forçage radiatif avec interface web interactive"
   - Public ou Private (votre choix)
   - **NE COCHEZ PAS** "Add a README file" (on en a déjà un)
   - **Cliquez sur "Create repository"**

3. **Copiez l'URL** du repo (ex: `https://github.com/VOTRE-USERNAME/RadiativeForcing.git`)

4. **Dans le terminal, exécutez** (remplacez l'URL par la vôtre) :
   ```bash
   cd /Users/dnavatar/Desktop/_dnavatar/apps/src/RadiativeForcing-main
   git remote add origin https://github.com/VOTRE-USERNAME/RadiativeForcing.git
   git push -u origin main
   ```
   
   **OU utilisez le script automatique** :
   ```bash
   ./connect_github.sh VOTRE-USERNAME
   git push -u origin main
   ```

---

## 📝 Pour les prochaines fois

Une fois le repo créé, pour pousser vos modifications :

**Via GitHub Desktop** : 
- Cliquez sur "Commit" → "Push origin"

**Via terminal** :
```bash
git add .
git commit -m "Description de vos changements"
git push
```

---

## 🔍 Vérifier que tout est OK

```bash
git remote -v    # Doit afficher votre repo GitHub
git status       # Doit dire "Your branch is up to date with 'origin/main'"
```

