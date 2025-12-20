
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

/**
 * Funció per extreure una situació d'aprenentatge estructurada utilitzant Gemini.
 * Utilitza exclusivament la clau d'entorn process.env.API_KEY.
 */
export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Ets un assessor pedagògic expert en el currículum LOMLOE de la Generalitat de Catalunya.
  Analitza el text següent i genera una "Situació d'Aprenentatge" completa en format JSON.
  
  REQUISITS DEL CONTINGUT:
  1. Títol: Motivador i relacionat amb el repte.
  2. Objectius: Han de seguir el format "Infinitiu + Saber + Finalitat".
  3. Activitats: Descriu activitats concretes per a les 4 fases (Inicial, Desenvolupament, Estructuració, Aplicació).
  4. Sabers i Criteris: Han de ser coherents amb l'àrea i el curs indicats.
  
  Si el text proporcionat és escàs, utilitza la teva base de coneixements per completar la programació de forma professional.

  TEXT DE REFERÈNCIA:
  ${text}`;

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
};
