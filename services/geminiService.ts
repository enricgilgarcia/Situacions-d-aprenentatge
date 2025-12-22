
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Ets un expert en la normativa educativa de Catalunya (LOMLOE). 
El teu objectiu és transformar les notes del docent en el MODEL OFICIAL de Situació d'Aprenentatge de la Generalitat de Catalunya.

NORMES DE FORMAT CRÍTIQUES:
1. Competències Específiques (CE): Han de coincidir amb les del DECRET oficial de Catalunya. Seguir el format "CE.X. [Descripció]" (ex: CE.1. Identificar els elements...). Inclou l'àrea o matèria.
2. Criteris d'Avaluació: Han de coincidir amb la nomenclatura del decret (ex: 1.1, 1.2, 2.1...). No inventis nous sistemes de numeració.
3. Objectius d'Aprenentatge: Han de seguir l'estructura Capacitat + Saber + Finalitat.
4. Sabers: Identificar clarament els continguts de l'àrea tal com apareixen al currículum.
5. Activitats: Descriure les 4 fases (Inicial, Desenvolupament, Estructuració, Aplicació) amb la seva temporització.
6. Vectors i Suports: Descriure com s'aborden els vectors del currículum (perspectiva de gènere, sostenibilitat, etc.) i les mesures DUA.

IMPORTANT: Fidelitat absoluta als termes i competències del decret oficial de Catalunya. Si el text és ambigu, tria la competència oficial més propera al currículum de Catalunya.`;

  const prompt = `Genera el JSON de la Situació d'Aprenentatge seguint el format del decret oficial per a: "${text}"`;

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
                    inicials: { type: Type.OBJECT, properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } }, required: ["descripcio", "temporitzacio"] },
                    desenvolupament: { type: Type.OBJECT, properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } }, required: ["descripcio", "temporitzacio"] },
                    estructuracio: { type: Type.OBJECT, properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } }, required: ["descripcio", "temporitzacio"] },
                    aplicacio: { type: Type.OBJECT, properties: { descripcio: { type: Type.STRING }, temporitzacio: { type: Type.STRING } }, required: ["descripcio", "temporitzacio"] }
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
    if (err.message?.includes("429")) throw new Error("QUOTA_EXHAUSTED");
    if (err.message?.includes("Requested entity was not found.")) throw new Error("KEY_NOT_FOUND");
    throw new Error(err.message || "Error desconegut.");
  }
};
