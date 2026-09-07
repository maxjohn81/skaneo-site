<div align="center">📱 Skaneo

Le scanner intelligent qui simplifie vos recharges mobiles

<img src="https://img.shields.io/badge/Skaneo-Mobile%20Assistant-orange?style=for-the-badge" /><br/>Scannez. Simplifiez. Gagnez du temps.

Skaneo est une solution pensée pour rendre les opérations mobiles quotidiennes plus rapides et plus simples grâce à une expérience intuitive.

</div>---

🌟 À propos de Skaneo

Skaneo est une application conçue pour faciliter l'utilisation des services mobiles au quotidien.

Elle propose une expérience moderne qui réduit les manipulations complexes et accompagne les utilisateurs dans leurs actions grâce à une interface simple, rapide et accessible.

L'objectif de Skaneo est de transformer des tâches répétitives en actions plus naturelles et plus fluides.

---

🚀 Notre vision

Aujourd'hui, de nombreuses opérations mobiles demandent plusieurs étapes et une saisie manuelle qui peut entraîner des erreurs.

Skaneo imagine une nouvelle manière d'interagir avec ces services :

✨ Plus simple
⚡ Plus rapide
📱 Plus accessible
🎯 Plus intuitive

Nous voulons créer des outils qui rapprochent la technologie des besoins réels des utilisateurs.

---

💡 L'expérience Skaneo

Avec Skaneo, l'utilisateur bénéficie d'une expérience pensée autour de la simplicité :

<div align="center">📷 Une interaction naturelle
<br/>
⬇️
✨ Une expérience fluide
<br/>
⬇️
🚀 Une utilisation plus rapide au quotidien

</div>---

🎨 Une interface pensée pour tous

Skaneo privilégie :

- Une navigation claire
- Une expérience agréable
- Une prise en main rapide
- Un design moderne
- Une utilisation adaptée aux besoins du quotidien

Chaque détail est pensé pour rendre l'utilisation plus confortable.

---

🌍 Notre objectif

Skaneo a pour ambition de devenir un compagnon numérique utile dans la vie quotidienne.

Nous construisons une expérience qui met la simplicité au centre, afin que chacun puisse profiter pleinement des possibilités offertes par la technologie.

---

🔮 L'avenir de Skaneo

Skaneo continue d'évoluer avec une vision claire :

Créer des solutions intelligentes, accessibles et utiles qui améliorent les petites actions du quotidien.

Chaque amélioration nous rapproche d'une expérience encore plus simple et plus efficace.

---

<div align="center">✨ Skaneo

La technologie simplifiée pour votre quotidien.

</div>

## Déploiement

Le site est prévu pour Vercel afin d'exécuter les fonctions serverless du dossier `api/`.

Variables d'environnement requises :

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_PASSWORD`

Le dashboard privé est disponible sur `/admin/`. Les statistiques journalières
sont conservées dans Upstash Redis pendant 400 jours et alimentent les vues
aujourd'hui, 7 jours, 30 jours et le graphique d'activité.
