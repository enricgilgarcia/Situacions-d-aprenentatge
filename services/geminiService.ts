
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

/**
 * Genera la programació educativa utilitzant l'API de Gemini.
 * Aquesta funció depèn exclusivament de la variable d'entorn API_KEY.
 */
export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("CONFIG_ERROR: La clau API no arriba al navegador. Si estàs a Netlify, recorda fer un 'Clear cache and deploy site' després d'afegir la variable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Ets un assessor pedagògic expert en la LOMLOE a Catalunya.
  Genera una Situació d'Aprenentatge en format JSON basada en aquest text:
  "${text}"
  
  IMPORTANT: Omple tots els camps (Objectius, Activitats, Sabers, Criteris) de forma professional segons el currículum actual.`;

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

    if (!response.text) {
      throw new Error("L'IA ha tornat una resposta buida.");
    }

    return JSON.parse(response.text) as SituacioAprenentatge;
  } catch (err: any) {
    // Passem l'error original perquè l'usuari el pugui veure
    const message = err.message || "Error desconegut de l'API de Google";
    throw new Error(`GEMINI_API_ERROR: ${message}`);
  }
};
