# 📱 Ben Daoud Réparation (بن داود للإصلاح)

Application mobile & web PWA en français pour la gestion des réparations, le suivi des ateliers (Brahim, Oro, Bouchaib, Youssef, Miyara, Aissam, Hamza) et les notifications clients WhatsApp.

---

## 🌟 Fonctionnalités Principales

1. **Dépôt d'un article :**
   - Nom et Prénom du client.
   - Numéro de téléphone (+212 / 06 / 07).
   - Description de l'article & panne.
   - **Prise de photo directe** avec la caméra du téléphone de travail.
   - Prix estimé, Avance versée, et Reste calculé automatiquement.

2. **Option Reçu (Reçu / Sans reçu) :**
   - **Si le client veut un reçu :** Génération instantanée d'un reçu professionnel avec numéro unique (ex: `BDR-2026-0001`), date, détails financiers, photo, avec boutons **Imprimer** et **Envoyer via WhatsApp**.
   - **Si le client ne veut pas de reçu :** Enregistrement rapide avec juste le nom et le prénom.

3. **Suivi des Ateliers & Dates :**
   - Date de réception (**Nhar Istilam**).
   - Date d'envoi en réparation (**Nhar Tsifat l'Atelier**).
   - Ateliers préconfigurés : **Brahim, Oro, Bouchaib, Youssef, Miyara, Aissam, Hamza**.
   - Ajout, modification et suppression d'ateliers en un clic.
   - Compteur automatique du nombre d'articles en cours chez chaque atelier.

4. **Notification Client "Produit Wajad" (WhatsApp) :**
   - Dès que l'article est réparé (Statut : **Prêt / Wajad 🟢**), un clic sur **« Sifat WhatsApp (Wajad) »** ouvre directement WhatsApp avec le message pré-rempli pour le client.

5. **Connexion Supabase & Fonctionnement Hors-Ligne :**
   - Fonctionne 100% hors-ligne en local.
   - Synchronisation complète avec la base Supabase et stockage des photos dans le bucket `article-photos`.

---

## 🗄️ Configuration Supabase :

1. Ouvrez votre projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, collez le contenu du fichier `supabase_schema.sql` et cliquez sur **Run**.
3. Récupérez votre **Project URL** et votre clé **anon public key**.
4. Dans l'application, allez dans l'onglet **« Réglages » (⚙️)**, collez-les et cliquez sur **Sauvegarder** et **Tester**.

---

## 📲 Installation sur le téléphone de travail (PWA) :

- **Android (Chrome) :** Menu (⋮) -> « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- **iPhone (Safari) :** Bouton Partage -> « Sur l'écran d'accueil ».
