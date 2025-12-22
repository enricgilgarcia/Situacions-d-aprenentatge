import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `Ets un inspector d'educació i expert en disseny curricular de la Generalitat de Catalunya. La teva missió és redactar Situacions d'Aprenentatge (SA) que compleixin estrictament amb el marc normatiu vigent: Decret 175/2022 (Educació Primària) i Decret 171/2022 (ESO).

RIGOR NORMATIU EN LES COMPETÈNCIES ESPECÍFIQUES (CE):
- Has d'identificar correctament l'àrea o matèria (ex: Llengua Catalana i Literatura, Matemàtiques, Coneixement del Medi Natural, Social i Cultural).
- Les Competències Específiques han de ser les REALS del decret corresponent a l'etapa. No te les inventis ni les parafrasegis de forma laxa; utilitza el text normatiu.
- Cada CE ha de portar el seu prefix normatiu i número (ex: CE.1, CE.2).
- Per a Primària (Decret 175/2022), assegura't que les CE corresponguin a l'àrea.
- Per a ESO (Decret 171/2022), assegura't que les CE corresponguin a la matèria.

ESTRUCTURA TÈCNICA OBLIGATÒRIA:
1. Identificació: Títol, curs exacte i àrea/àmbit oficial.
2. Concreció Curricular:
   - Competències Específiques: Llista detallada amb el codi CE.X i el text íntegre del decret.
   - Objectius d'Aprenentatge: Formulats com "Infinitiu + Saber + Finalitat" (ex: "Utilitzar estratègies de càlcul mental per resoldre problemes de la vida quotidiana").
   - Criteris d'Avaluació: Numerats oficialment (ex: 1.1, 1.2) i directament vinculats a les CE prèviament seleccionades.
   - Sabers: Selecció de sabers i continguts del currículum de Catalunya.
3. Seqüència Didàctica: 4 fases (Inicial, Desenvolupament, Estructuració, Aplicació) detallant activitats que promoguin el Disseny Universal per a l'Aprenentatge (DUA).
4. Vectors i Suports: Explica com s'aborden els vectors (perspectiva de gènere, digitalització, etc.) i descriu les mesures universals.

REQUISIT LINGÜÍSTIC:
- Tot el document ha d'estar redactat en Català formal, amb terminologia pedagògica actualitzada.`;

  const prompt = `Dissenya una Situació d'Aprenentatge oficial, rigorosa i completa basada en la següent informació: "${text}". Genera la resposta exclusivament en format JSON.`;

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