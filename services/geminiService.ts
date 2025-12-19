
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // L'SDK utilitzarà la clau process.env.API_KEY injectada
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analitza el següent text de planificació i genera una Situació d'Aprenentatge seguint el model oficial de la Generalitat de Catalunya (LOMLOE). 
  Assegura't que:
  1. Els Objectius segueixin el patró: CAPACITAT + SABER + FINALITAT.
  2. Els Criteris d'avaluació segueixin el patró: ACCIÓ + SABER + CONTEXT.
  3. Les activitats es divideixin en les 4 fases oficials (Inicial, Desenvolupament, Estructuració, Aplicació).
  4. S'inclogui el tractament de vectors i suports DUA.
  5. Selecciona Competències Específiques i Sabers reals segons el currículum LOMLOE de Catalunya per al curs indicat.

  Text:
  ---
  ${text}
  ---`;

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
    }
  });

  try {
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Resposta de la IA buida.");
    return JSON.parse(jsonStr) as SituacioAprenentatge;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("No s'ha pogut processar la planificació. Prova d'introduir un text més detallat.");
  }
};
