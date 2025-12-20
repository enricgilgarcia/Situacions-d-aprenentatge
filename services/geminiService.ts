
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

/**
 * Extract a structured educational learning situation from raw text using Gemini.
 */
export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // IMPORTANT: Creem la instància aquí mateix per assegurar que tenim la clau actual de l'entorn
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Ets un assistent expert en la LOMLOE i el currículum de la Generalitat de Catalunya.
  Analitza el següent text i genera una Situació d'Aprenentatge oficial en format JSON seguint el model de la Generalitat.
  
  IMPORTANT: 
  - Títol: Significatiu i engrescador.
  - Objectius: Estructura "Infinitiu + Saber + Finalitat".
  - Fases: Omple les 4 fases d'activitats (Inicial, Desenvolupament, Estructuració, Aplicació).
  - Si falta informació al text, inventa-la perquè sigui pedagògicament coherent.

  TEXT A ANALITZAR:
  ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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
                    }
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
                    }
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
                  }
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
                    }
                  }
                }
              },
              required: ["vectors_descripcio", "suports_universals"]
            }
          },
          required: ["identificacio", "descripcio", "concrecio_curricular", "desenvolupament", "vectors_suports"]
        }
      },
    });

    return JSON.parse(response.text || "{}") as SituacioAprenentatge;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
