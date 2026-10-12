import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Info, Sun, Snowflake, Calculator, Building, FileText, Copy, X, Check } from 'lucide-react';

// --- TYPES ---

type Season = 'ete' | 'hiver';
type Usage = 'logement' | 'tertiaire' | 'bureau' | 'maternelle';
type Orientation = 'S' | 'E/O' | 'N' | 'HOR';
type Masque = 'aucun' | 'H=L/2' | 'H=L' | 'H=2L';
type Protection =
  | 'aucune'
  | 'casquette_large'
  | 'casquette_etroite'
  | 'bs_fixe'
  | 'bs_orientable'
  | 'screen_perf'
  | 'screen_classique'
  | 'store_int';

interface WindowItem {
  id: number;
  orientation: Orientation;
  svit: number;
  fsvit: number;
  masque: Masque;
  protection: Protection;
}

// --- DICTIONNAIRES DE DONNÉES (D'après les tableaux fournis) ---

const ESOL: Record<Season, Record<Orientation, number>> = {
  hiver: { 'S': 1, 'E/O': 0.55, 'N': 0.20, 'HOR': 0.80 },
  ete: { 'S': 1, 'E/O': 1.1, 'N': 0.6, 'HOR': 1.8 }
};

const FE_MASQUE: Record<Season, Record<Orientation, Record<Masque, number>>> = {
  hiver: {
    'S': { 'aucun': 1, 'H=L/2': 0.25, 'H=L': 0.25, 'H=2L': 0.75 },
    'E/O': { 'aucun': 1, 'H=L/2': 0.65, 'H=L': 0.75, 'H=2L': 0.85 },
    'N': { 'aucun': 1, 'H=L/2': 1, 'H=L': 1, 'H=2L': 1 },
    'HOR': { 'aucun': 1, 'H=L/2': 1, 'H=L': 1, 'H=2L': 1 }
  },
  ete: {
    'S': { 'aucun': 1, 'H=L/2': 1, 'H=L': 1, 'H=2L': 1 },
    'E/O': { 'aucun': 1, 'H=L/2': 0.75, 'H=L': 0.85, 'H=2L': 0.90 },
    'N': { 'aucun': 1, 'H=L/2': 0.80, 'H=L': 0.85, 'H=2L': 0.95 },
    'HOR': { 'aucun': 1, 'H=L/2': 1, 'H=L': 1, 'H=2L': 1 }
  }
};

const FS_PROTSOL: Record<Season, Record<Orientation, Record<Protection, number>>> = {
  hiver: {
    // En hiver, la plupart des protections solaires sont ignorées (ouvertes) pour profiter des apports
    'S': { 'aucune': 1, 'casquette_large': 1, 'casquette_etroite': 1, 'bs_fixe': 1, 'bs_orientable': 1, 'screen_perf': 1, 'screen_classique': 1, 'store_int': 1 },
    'E/O': { 'aucune': 1, 'casquette_large': 1, 'casquette_etroite': 1, 'bs_fixe': 1, 'bs_orientable': 1, 'screen_perf': 1, 'screen_classique': 1, 'store_int': 1 },
    'N': { 'aucune': 1, 'casquette_large': 1, 'casquette_etroite': 1, 'bs_fixe': 1, 'bs_orientable': 1, 'screen_perf': 1, 'screen_classique': 1, 'store_int': 1 },
    'HOR': { 'aucune': 1, 'casquette_large': 1, 'casquette_etroite': 1, 'bs_fixe': 1, 'bs_orientable': 1, 'screen_perf': 1, 'screen_classique': 1, 'store_int': 1 }
  },
  ete: {
    'S': { 'aucune': 1, 'casquette_large': 0.45, 'casquette_etroite': 0.70, 'bs_fixe': 0.45, 'bs_orientable': 0.20, 'screen_perf': 0.20, 'screen_classique': 0.35, 'store_int': 0.60 },
    'E/O': { 'aucune': 1, 'casquette_large': 0.65, 'casquette_etroite': 0.90, 'bs_fixe': 0.65, 'bs_orientable': 0.20, 'screen_perf': 0.20, 'screen_classique': 0.35, 'store_int': 0.60 },
    'N': { 'aucune': 1, 'casquette_large': 0.85, 'casquette_etroite': 1, 'bs_fixe': 0.85, 'bs_orientable': 0.20, 'screen_perf': 0.20, 'screen_classique': 0.35, 'store_int': 0.60 },
    'HOR': { 'aucune': 1, 'casquette_large': 1, 'casquette_etroite': 1, 'bs_fixe': 1, 'bs_orientable': 0.20, 'screen_perf': 0.20, 'screen_classique': 0.35, 'store_int': 0.60 }
  }
};

// --- FONCTION D'ÉVALUATION DE L'ISE ---
const evaluateISE = (ise: number, season: Season, usage: Usage) => {
  if (season === 'ete') {
    if (usage === 'logement') {
      if (ise <= 0.02) return { color: 'bg-green-500 text-white', text: 'Performant (Vert)', icon: '🟢' };
      if (ise <= 0.03) return { color: 'bg-orange-500 text-white', text: 'Moyen (Orange)', icon: '🟠' };
      return { color: 'bg-red-500 text-white', text: 'Non performant (Rouge)', icon: '🔴' };
    } else { // Tertiaire, etc.
      if (ise <= 0.015) return { color: 'bg-green-500 text-white', text: 'Performant (Vert)', icon: '🟢' };
      if (ise <= 0.025) return { color: 'bg-orange-500 text-white', text: 'Moyen (Orange)', icon: '🟠' };
      return { color: 'bg-red-500 text-white', text: 'Non performant (Rouge)', icon: '🔴' };
    }
  } else { // Hiver
    if (usage === 'logement') {
      if (ise >= 0.1) return { color: 'bg-green-500 text-white', text: 'Performant (Vert)', icon: '🟢' };
      if (ise >= 0.08) return { color: 'bg-orange-500 text-white', text: 'Moyen (Orange)', icon: '🟠' };
      return { color: 'bg-red-500 text-white', text: 'Non performant (Rouge)', icon: '🔴' };
    } else if (usage === 'bureau') {
      if (ise <= 0.05) return { color: 'bg-green-500 text-white', text: 'Performant (Vert)', icon: '🟢' };
      if (ise <= 0.07) return { color: 'bg-orange-500 text-white', text: 'Moyen (Orange)', icon: '🟠' };
      return { color: 'bg-red-500 text-white', text: 'Non performant (Rouge)', icon: '🔴' };
    } else { // Maternelle
      if (ise >= 0.09) return { color: 'bg-green-500 text-white', text: 'Performant (Vert)', icon: '🟢' };
      if (ise >= 0.07) return { color: 'bg-orange-500 text-white', text: 'Moyen (Orange)', icon: '🟠' };
      return { color: 'bg-red-500 text-white', text: 'Non performant (Rouge)', icon: '🔴' };
    }
  }
};

export default function App() {
  // --- ETATS GLOBAUX ---
  const [season, setSeason] = useState<Season>('ete');
  const [usage, setUsage] = useState<Usage>('logement');
  const [dpb, setDpb] = useState(1854.54);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- ETAT DES VITRAGES ---
  const [windows, setWindows] = useState<WindowItem[]>([
    {
      id: Date.now(),
      orientation: 'S',
      svit: 10,
      fsvit: 0.5,
      masque: 'aucun',
      protection: 'aucune'
    }
  ]);

  const addWindow = () => {
    setWindows([...windows, {
      id: Date.now(),
      orientation: 'S',
      svit: 0,
      fsvit: 0.5,
      masque: 'aucun',
      protection: 'aucune'
    }]);
  };

  const removeWindow = (idToRemove: number) => {
    setWindows(windows.filter(w => w.id !== idToRemove));
  };

  const updateWindow = <K extends keyof WindowItem>(id: number, field: K, value: WindowItem[K]) => {
    setWindows(windows.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  // --- CALCULS EN TEMPS RÉEL ---
  const calculations = useMemo(() => {
    let totalSSE = 0;
    
    const processedWindows = windows.map(w => {
      const e_sol = ESOL[season][w.orientation] || 1;
      const FE = FE_MASQUE[season][w.orientation][w.masque] || 1;
      const FS_prot = FS_PROTSOL[season][w.orientation][w.protection] || 1;
      
      const sse_window = w.svit * w.fsvit * FS_prot * FE * e_sol;
      totalSSE += sse_window;

      return { ...w, e_sol, FE, FS_prot, sse_window };
    });

    const ise = dpb > 0 ? (totalSSE / dpb) : 0;
    const evaluation = evaluateISE(ise, season, usage);

    return { processedWindows, totalSSE, ise, evaluation };
  }, [windows, season, usage, dpb]);

  // --- GÉNÉRATION DE LA NOTE DE CALCUL ---
  const generateReportText = () => {
    let text = `=================================================\n`;
    text += `   NOTE DE CALCUL - INDICE SUD ÉQUIVALENT (Ise)\n`;
    text += `=================================================\n\n`;

    text += `--- 1. PARAMÈTRES GLOBAUX ---\n`;
    text += `- Saison étudiée : ${season === 'ete' ? 'Été' : 'Hiver'}\n`;
    text += `- Usage du bâtiment : ${usage}\n`;
    text += `- Surface de référence (DPB) : ${dpb} m²\n\n`;

    text += `--- 2. FORMULES DE RÉFÉRENCE ---\n`;
    text += `SSE = S_vit × FS_vit × FS_protsol × FE × e_sol\n`;
    text += `Ise = Somme(SSE) / DPB\n\n`;

    text += `--- 3. DÉTAIL DES VITRAGES ---\n`;
    if (calculations.processedWindows.length === 0) {
      text += `Aucun vitrage renseigné.\n\n`;
    }
    calculations.processedWindows.forEach((win, index) => {
      text += `> Vitrage ${index + 1} (Orientation : ${win.orientation})\n`;
      text += `  - Surface (S_vit) : ${win.svit} m²\n`;
      text += `  - Facteur Solaire intrinsèque (FS_vit) : ${win.fsvit}\n`;
      text += `  - Facteur de masque lointain (FE) : ${win.FE} (Type: ${win.masque})\n`;
      text += `  - Facteur de protection solaire (FS_protsol) : ${win.FS_prot} (Type: ${win.protection})\n`;
      text += `  - Coefficient d'orientation (e_sol) : ${win.e_sol}\n`;
      text += `  -> SSE partiel = ${win.svit} × ${win.fsvit} × ${win.FS_prot} × ${win.FE} × ${win.e_sol} = ${win.sse_window.toFixed(2)} m²\n\n`;
    });

    text += `--- 4. RÉSULTATS FINAUX ---\n`;
    text += `TOTAL SSE = ${calculations.totalSSE.toFixed(2)} m²\n`;
    text += `Calcul Ise = ${calculations.totalSSE.toFixed(2)} / ${dpb}\n`;
    text += `INDICE SUD ÉQUIVALENT (Ise) = ${calculations.ise.toFixed(4)}\n\n`;

    text += `--- 5. ÉVALUATION ---\n`;
    text += `Statut : ${calculations.evaluation.text.toUpperCase()}\n`;
    text += `=================================================\n`;

    return text;
  };

  const handleCopyReport = () => {
    const reportContent = generateReportText();
    // Utilisation de execCommand pour compatibilité maximale dans les iframes
    const textArea = document.createElement("textarea");
    textArea.value = reportContent;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-32">
      
      {/* HEADER */}
      <header className="bg-slate-800 text-white p-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Simulateur Bioclimatique (SSE & Ise)</h1>
          </div>
          <button 
            onClick={() => setShowDefinitions(!showDefinitions)}
            className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition"
          >
            <Info className="w-4 h-4" />
            Définitions
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6 mt-4">
        
        {/* PANNEAU DÉFINITIONS */}
        {showDefinitions && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-sm animate-in fade-in slide-in-from-top-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Petit lexique des termes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>S DPB</strong> : Surface de Plancher du Bâtiment (m²).</p>
                <p><strong>SSE</strong> : Surface Sud Équivalente. C'est la surface fictive d'un vitrage orienté plein sud, sans aucun masque, qui apporterait la même énergie solaire que tous les vitrages réels du projet additionnés.</p>
                <p><strong>Ise</strong> : Indice Sud Équivalent. Ratio de la SSE sur la DPB. Il permet de jauger la performance de la conception.</p>
                <p><strong>S vit</strong> : Surface réelle du vitrage (m²).</p>
              </div>
              <div>
                <p><strong>FS vitrage</strong> : Facteur Solaire intrinsèque du vitrage (souvent entre 0.3 et 0.8).</p>
                <p><strong>FS protsol</strong> : Facteur lié à l'efficacité de la protection solaire (store, casquette...). Plus il est bas en été, mieux c'est.</p>
                <p><strong>FE</strong> : Facteur d'obstacle. Prend en compte les masques lointains (ex: un bâtiment en face).</p>
                <p><strong>e sol</strong> : Rapport de l'énergie solaire spécifique à une orientation donnée par rapport au Sud.</p>
              </div>
            </div>
          </div>
        )}

        {/* PARAMÈTRES GLOBAUX */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b pb-2">
            <Building className="w-5 h-5 text-blue-500" />
            Paramètres globaux du projet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Saison étudiée</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSeason('ete')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition ${season === 'ete' ? 'bg-white shadow-sm font-semibold text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Sun className="w-4 h-4" /> Été
                </button>
                <button
                  onClick={() => setSeason('hiver')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition ${season === 'hiver' ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Snowflake className="w-4 h-4" /> Hiver
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Usage du bâtiment</label>
              <select 
                value={usage} 
                onChange={(e) => setUsage(e.target.value as Usage)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
              >
                <option value="logement">Logement</option>
                <option value="tertiaire">Tertiaire, Autre scolaire</option>
                <option value="bureau">Bureau</option>
                <option value="maternelle">Maternelle, Crèche</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Surface de référence (S DPB) en m²</label>
              <input 
                type="number" 
                step="any"
                value={dpb} 
                onChange={(e) => setDpb(Number(e.target.value))}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
              />
            </div>

          </div>
        </section>

        {/* LISTE DES VITRAGES */}
        <section className="space-y-4">
          <div className="flex justify-between items-end border-b pb-2">
            <h2 className="text-xl font-semibold text-slate-800">Détail des vitrages</h2>
            <button 
              onClick={addWindow}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Ajouter un vitrage
            </button>
          </div>

          {calculations.processedWindows.map((win, index) => (
            <div key={win.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              
              <div className="flex justify-between items-start mb-4 pl-3">
                <h3 className="font-semibold text-lg text-slate-700">Vitrage {index + 1}</h3>
                <button 
                  onClick={() => removeWindow(win.id)}
                  className="text-red-400 hover:text-red-600 transition"
                  title="Supprimer ce vitrage"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pl-3">
                {/* Orientation */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Orientation</label>
                  <select 
                    value={win.orientation} onChange={(e) => updateWindow(win.id, 'orientation', e.target.value as Orientation)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                  >
                    <option value="S">Sud (S)</option>
                    <option value="E/O">Est/Ouest (E/O)</option>
                    <option value="N">Nord (N)</option>
                    <option value="HOR">Horizontal (Toit)</option>
                  </select>
                </div>

                {/* S vit */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Surface S_vit (m²)</label>
                  <input 
                    type="number" step="any" min="0"
                    value={win.svit} onChange={(e) => updateWindow(win.id, 'svit', Number(e.target.value))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                  />
                </div>

                {/* FS vit */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">FS vitrage (0-1)</label>
                  <input 
                    type="number" step="0.01" min="0" max="1"
                    value={win.fsvit} onChange={(e) => updateWindow(win.id, 'fsvit', Number(e.target.value))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                  />
                </div>

                {/* Masque */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Masque Lointain (FE)</label>
                  <select 
                    value={win.masque} onChange={(e) => updateWindow(win.id, 'masque', e.target.value as Masque)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                  >
                    <option value="aucun">Aucun obstacle</option>
                    <option value="H=L/2">Obstacle H = L/2</option>
                    <option value="H=L">Obstacle H = L</option>
                    <option value="H=2L">Obstacle H = 2L</option>
                  </select>
                </div>

                {/* Protection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Protection solaire</label>
                  <select 
                    value={win.protection} onChange={(e) => updateWindow(win.id, 'protection', e.target.value as Protection)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                  >
                    <option value="aucune">Aucune</option>
                    <option value="casquette_large">Casquette large (a &gt; 45°)</option>
                    <option value="casquette_etroite">Casquette étroite (a &lt; 45°)</option>
                    <option value="bs_fixe">Brise-soleil à lames fixes</option>
                    <option value="bs_orientable">Brise-soleil lames orientables</option>
                    <option value="screen_perf">Screen mobile performant</option>
                    <option value="screen_classique">Screen mobile classique</option>
                    <option value="store_int">Store mobile intérieur</option>
                  </select>
                </div>
              </div>

              {/* Sous-résultat pour ce vitrage */}
              <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-sm ml-3">
                <div className="text-slate-500 font-mono">
                  Calcul : {win.svit} × {win.fsvit} × {win.FS_prot} (FS_prot) × {win.FE} (FE) × {win.e_sol} (e_sol)
                </div>
                <div className="font-semibold text-blue-700">
                  SSE partiel = {win.sse_window.toFixed(2)} m²
                </div>
              </div>
            </div>
          ))}

          {windows.length === 0 && (
            <div className="text-center p-8 bg-gray-100 rounded-xl text-gray-500 italic">
              Aucun vitrage défini. Ajoutez-en un pour commencer.
            </div>
          )}
        </section>

      </main>

      {/* PANNEAU DE RÉSULTATS FIXÉ EN BAS */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase">Total SSE</p>
              <p className="text-2xl font-bold text-slate-800">{calculations.totalSSE.toFixed(2)} <span className="text-base font-normal">m²</span></p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase">Indice Sud Équivalent (Ise)</p>
              <p className="text-2xl font-bold text-slate-800">{calculations.ise.toFixed(4)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition border border-slate-300"
            >
              <FileText className="w-5 h-5" />
              Note de calcul
            </button>
            <div className={`px-6 py-3 rounded-xl shadow-inner font-bold text-lg flex items-center gap-2 ${calculations.evaluation.color}`}>
              <span>{calculations.evaluation.icon}</span>
              {calculations.evaluation.text}
            </div>
          </div>
          
        </div>
      </div>

      {/* MODAL DE LA NOTE DE CALCUL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Note de calcul détaillée
              </h2>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu Modal */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {generateReportText()}
              </pre>
            </div>

            {/* Footer Modal */}
            <div className="p-5 border-t border-slate-100 flex justify-end bg-white rounded-b-2xl">
              <button 
                onClick={handleCopyReport}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition text-white shadow-sm ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copié dans le presse-papiers !' : 'Copier la note de calcul'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}