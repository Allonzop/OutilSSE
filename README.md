# Simulateur Bioclimatique (SSE & Ise)

Outil de calcul de la **Surface Sud Équivalente (SSE)** et de l'**Indice Sud Équivalent (Ise)** d'un projet, pour l'été et l'hiver, avec évaluation de la performance (vert / orange / rouge) selon l'usage du bâtiment et génération d'une note de calcul.

```
SSE = S_vit × FS_vit × FS_protsol × FE × e_sol
Ise = Σ SSE / S_DPB
```

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # vérification TypeScript + build dans dist/
npm run preview  # prévisualiser le build
```

Stack : Vite, React, TypeScript, Tailwind CSS 3, lucide-react. Le calcul se fait entièrement dans le navigateur, aucune donnée n'est envoyée nulle part.
