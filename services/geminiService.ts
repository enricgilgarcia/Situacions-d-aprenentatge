
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

/**
 * Extract a structured educational learning situation from raw text using Gemini 3 Pro.
 * Follows the latest @google/genai SDK guidelines for content generation.
 */
export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // Always create a new GoogleGenAI instance right before making an API call 
  // to ensure it always uses the most up-to-date API key from the environment/dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Ets un assistent expert en la LOMLOE i el currículum de la Generalitat de Catalunya.
  Analitza el següent text i genera una Situació d'Aprenentatge oficial en format JSON.
  
  IMPORTANT: 
  - Títol: Ha de ser significatiu.
  - Objectius: Estructura "Verbe infinitiu + Saber + Finalitat".
  - Criteris: Estructura "Acció observable + Context".
  - Fases: Omple les 4 fases d'activitats (Inicial, Desenvolupament, Estructuració, Aplicació).
  - Si falta informació al text, inventa contingut pedagògicament coherent per al curs i matèria detectats.

  TEXT A ANALITZAR:
  ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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

    const jsonText = response.text;
    if (!jsonText) throw new Error("La IA no ha generat cap contingut.");
    return JSON.parse(jsonText.trim()) as SituacioAprenentatge;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Error en la comunicació amb Gemini.");
  }
};
