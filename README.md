# 🍽️ RestoPilot

Application de gestion multi-restaurants. Suivi du CA, ratio matières premières, objectifs, factures fournisseurs.

## Déploiement en 4 étapes (100% gratuit)

### Étape 1 — Supabase (base de données)

1. Créez un compte sur **https://supabase.com** (gratuit)
2. Cliquez **New Project** → nommez-le `restopilot` → choisissez **West EU**
3. Attendez ~2 min la création
4. Allez dans **SQL Editor** (menu gauche)
5. Copiez-collez le contenu du fichier `supabase-setup.sql` → cliquez **Run**
6. Allez dans **Settings** → **API** et copiez :
   - **Project URL** (ex: `https://abc.supabase.co`)
   - **anon public key** (longue chaîne)

### Étape 2 — GitHub (stockage du code)

1. Créez un compte sur **https://github.com** (gratuit)
2. Cliquez **New repository** → nommez-le `restopilot` → **Create**
3. Installez Git sur votre PC : https://git-scm.com
4. Ouvrez un terminal dans le dossier du projet et tapez :

```bash
git init
git add .
git commit -m "RestoPilot v1"
git remote add origin https://github.com/VOTRE-NOM/restopilot.git
git branch -M main
git push -u origin main
```

### Étape 3 — Vercel (hébergement)

1. Créez un compte sur **https://vercel.com** (gratuit, connectez-vous avec GitHub)
2. Cliquez **Add New** → **Project**
3. Sélectionnez le repo `restopilot`
4. Dans **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` → votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` → votre clé anon
5. Cliquez **Deploy**

→ Votre app est en ligne en 30 secondes !

### Étape 4 — Utilisation

- **Admin** : connectez-vous avec `admin@restopilot.fr` / `admin123`
- Créez vos restaurants dans **Restaurants & Managers**
- Créez un compte manager par restaurant
- Partagez le lien Vercel à vos managers
- Sur téléphone : ouvrir le lien → ⋮ → **Ajouter à l'écran d'accueil**

## Développement local

```bash
npm install
cp .env.example .env   # puis remplissez vos clés Supabase
npm run dev             # → http://localhost:5173
```

Sans clés Supabase, l'app fonctionne en **mode démo** (données non persistées).

## Mise à jour

Après toute modification :
```bash
git add .
git commit -m "mise à jour"
git push
```
Vercel redéploie automatiquement.
