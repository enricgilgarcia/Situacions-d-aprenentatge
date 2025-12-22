import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview"; // Canviem a Pro per a més rigor en dades normatives
  
  const systemInstruction = `Ets un inspector d'educació i expert en disseny curricular de Catalunya. La teva missió és redactar Situacions d'Aprenentatge que compleixin estrictament amb el Decret 175/2022 (Educació Primària) o el Decret 171/2022 (ESO) segons correspongui.

RIGOR EN LES COMPETÈNCIES ESPECÍFIQUES (CE):
- Has d'utilitzar les descripcions OFICIALS de les competències específiques de l'àrea o matèria indicada.
- No resumeixis les CE; utilitza el text normatiu que defineix cada CE.1, CE.2, etc. per a cada etapa.
- Verifica que el contingut de la SA realment treballi les CE seleccionades.

ESTRUCTURA DE DADES:
1. Identificació: Títol suggerent, curs exacte i àrea/àmbit.
2. Concreció Curricular:
   - Competències Específiques: Mínim 2 o 3, amb codi CE.X i descripció íntegra del decret.
   - Objectius: Formulats com "Capacitat + Saber + Finalitat" (ex: "Identificar les propietats de l'aigua per comprendre el seu cicle natural").
   - Criteris d'Avaluació: Numerats oficialment (ex: 1.1, 1.2) i alineats amb les CE.
   - Sabers: Llista de continguts (Sabers) del currículum de Catalunya.
3. Seqüència Didàctica: 4 fases (Inicial, Desenvolupament, Estructuració, Aplicació) amb activitats riques en DUA.
4. Mesures Universals: Estratègies de l'AOC i DUA per a tot l'alumnat.

IMPORTANT: Tot el document ha d'estar redactat en Català amb un to acadèmic i professional.`;

  const prompt = `Crea una Situació d'Aprenentatge completa i rigorosa basada en el següent input del docent: "${text}". Genera el JSON seguint l'esquema demanat.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identificacio: {
              type: Type.OBJECT,
              properties: {
                titol: { type: Type.STRING },
                curs: { type: Type.STRING },
                area_materia_ambit: { type: Type.STRING }
              },
              required: ["titol", "curs", "area_materia_ambit"]
            },
            descripcio: {
              type: Type.OBJECT,
              properties: {
                context_repte: { type: Type.STRING },
                competencies_transversals: { type: Type.STRING }
              },
              required: ["context_repte", "competencies_transversals"]
            },
            concrecio_curricular: {
              type: Type.OBJECT,
              properties: {
                competencies_especifiques: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      descripcio: { type: Type.STRING },
                      area_materia: { type: Type.STRING }
                    },
                    required: ["descripcio", "area_materia"]
                  }
                },
                objectius: { type: Type.ARRAY, items: { type: Type.STRING } },
                criteris_avaluacio: { type: Type.ARRAY, items: { type: Type.STRING } },
                sabers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      saber: { type: Type.STRING },
                      area_materia: { type: Type.STRING }
                    },
                    required: ["saber", "area_materia"]
                  }
                }
              },
              required: ["competencies_especifiques", "objectius", "criteris_avaluacio", "sabers"]
            },
            desenvolupament: {
              type: Type.OBJECT,
              properties: {
                estrategies_metodologiques: { type: Type.STRING },
                activitats: {
                  type: Type.OBJECT,
                  properties: {
                    inicials: { 
                      type: Type.OBJECT, 
                      properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } },
                      required: ["descripcio", "temporitzacio"]
                    },
                    desenvolupament: { 
                      type: Type.OBJECT, 
                      properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } },
                      required: ["descripcio", "temporitzacio"]
                    },
                    estructuracio: { 
                      type: Type.OBJECT, 
                      properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } },
                      required: ["descripcio", "temporitzacio"]
                    },
                    aplicacio: { 
                      type: Type.OBJECT, 
                      properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } },
                      required: ["descripcio", "temporitzacio"]
                    }
                  },
                  required: ["inicials", "desenvolupament", "estructuracio", "aplicacio"]
                }
              },
              required: ["estrategies_metodologiques", "activitats"]
            },
            vectors_suports: {
              type: Type.OBJECT,
              properties: {
                vectors_descripcio: { type: Type.STRING },
                suports_universals: { type: Type.STRING },
                suports_addicionals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      alumne: { type: Type.STRING },
                      mesura: { type: Type.STRING }
                    },
                    required: ["alumne", "mesura"]
                  }
                }
              },
              required: ["vectors_descripcio", "suports_universals", "suports_addicionals"]
            }
          },
          required: ["identificacio", "descripcio", "concrecio_curricular", "desenvolupament", "vectors_suports"]
        }
      },
    });

    const output = response.text;
    if (!output) throw new Error("Resposta buida.");
    return JSON.parse(output.trim());
  } catch (err: any) {
    if (err.message?.includes("429")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    if (err.message?.includes("Requested entity was not found.")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw new Error(err.message || "Error desconegut.");
  }
};