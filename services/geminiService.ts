
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Ets un expert en la normativa educativa de Catalunya (LOMLOE). 
El teu objectiu és transformar les notes del docent en el MODEL OFICIAL de Situació d'Aprenentatge de la Generalitat.

ESTRUCTURA REQUERIDA I NORMES:
1. Identificació: Títol, Curs, Àrea/Matèria.
2. Descripció: Context + Repte detallat.
3. Competències Específiques: Llistat NUMERAT (1, 2, 3...) amb la seva àrea.
4. Competències Transversals: Com es tracten.
5. Objectius d'Aprenentatge: Numerats (1, 2, 3...) definits com Capacitat + Saber + Finalitat.
6. Criteris d'Avaluació: Numerats (1.1, 1.2...) definits com Acció + Saber + Context.
7. Sabers: Llistat de continguts.
8. Desenvolupament: Estratègies metodològiques i materials.
9. Activitats: Detall i temporització per a fase inicial, desenvolupament, estructuració i aplicació.
10. Vectors i Suports: Mesures universals i addicionals.

IMPORTANT: Les competències específiques han d'estar numerades de forma correlativa.`;

  const prompt = `Genera el JSON de la Situació d'Aprenentatge seguint el model oficial (amb numeració en competències i criteris) per a: "${text}"`;

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
