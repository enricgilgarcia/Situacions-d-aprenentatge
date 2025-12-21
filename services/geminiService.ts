
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // Inicialització segons directrius: instància nova abans de la crida per assegurar la clau més actual.
  // Es confia exclusivament en process.env.API_KEY segons les instruccions.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Utilitzem gemini-3-pro-preview per a tasques complexes de raonament com la planificació LOMLOE.
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `Ets un expert en la normativa educativa LOMLOE i el currículum de Catalunya. 
El teu objectiu és transformar notes, esborranys o descripcions de docents en una graella de Situació d'Aprenentatge (SA) completament formal i professional.
Utilitza un llenguatge pedagògic precís (competències, sabers, vectors, DUA). 
Si la informació és incompleta, infereix els elements curriculars més coherents basant-te en el curs i la matèria.`;

  const prompt = `Genera la graella de la Situació d'Aprenentatge per a la següent descripció:
---
${text}
---
És molt important que el JSON retornat segueixi exactament l'estructura definida i que els camps no estiguin buits.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 4000 }, // Donem pressupost de pensament per a la complexitat curricular
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
                estrategies_materials: { type: Type.STRING },
                activitats: {
                  type: Type.OBJECT,
                  properties: {
                    inicials: { type: Type.STRING },
                    desenvolupament: { type: Type.STRING },
                    estructuracio: { type: Type.STRING },
                    aplicacio: { type: Type.STRING }
                  },
                  required: ["inicials", "desenvolupament", "estructuracio", "aplicacio"]
                }
              },
              required: ["estrategies_materials", "activitats"]
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
    if (!output) throw new Error("La IA no ha generat cap resposta. Revisa el text d'entrada.");
    return JSON.parse(output.trim());
  } catch (err: any) {
    console.error("Error en la crida a Gemini:", err);
    if (err.message?.includes("API key")) {
      throw new Error("Error de configuració: La clau API no és vàlida o no s'ha trobat al servidor Netlify.");
    }
    throw new Error(err.message || "S'ha produït un error en processar la petició.");
  }
};
