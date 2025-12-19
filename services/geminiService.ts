
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // L'SDK utilitza automàticament la clau de process.env.API_KEY configurada pel sistema.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Ets un expert en el currículum LOMLOE de la Generalitat de Catalunya. 
  A partir del text de planificació següent, genera una Situació d'Aprenentatge completa en format JSON seguint el model oficial.
  
  Regles d'or del currículum de Catalunya:
  1. Els Objectius han de ser capaços (ex: Identificar..., Analitzar...) + Saber (ex: les fonts d'energia...) + Finalitat (ex: per promoure el consum responsable).
  2. Els Criteris d'avaluació han d'indicar una acció observable + context.
  3. Les activitats han d'estar equilibrades en les 4 fases (Inicial, Desenvolupament, Estructuració, Aplicació).
  4. Selecciona les Competències Específiques i Sabers reals que corresponguin al curs i àrea que s'extregui del text.

  TEXT DE PLANIFICACIÓ:
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
    const rawResponse = response.text;
    if (!rawResponse) throw new Error("La IA no ha tornat dades.");
    return JSON.parse(rawResponse) as SituacioAprenentatge;
  } catch (error) {
    console.error("Error parsing response:", error);
    throw new Error("No s'ha pogut analitzar la planificació. Revisa que el text sigui correcte.");
  }
};
