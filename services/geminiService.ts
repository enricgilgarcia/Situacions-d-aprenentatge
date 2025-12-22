
import { GoogleGenAI, Type } from "@google/genai";
import { SituacioAprenentatge } from "../types";

export const extractLearningSituation = async (text: string): Promise<SituacioAprenentatge> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Ets un expert en la normativa educativa de Catalunya. 
El teu objectiu és transformar les notes del docent en el MODEL OFICIAL de Situació d'Aprenentatge de la Generalitat.

ESTRUCTURA REQUERIDA:
1. Identificació: Títol, Curs (nivell educatiu), Àrea/Matèria/Àmbit.
2. Descripció: Context + Repte (Per què aquesta SA? Quin repte planteja?).
3. Competències Específiques: Llistat amb la seva àrea o matèria.
4. Competències Transversals: Com es tracten.
5. Objectius d'Aprenentatge: Numerats (1, 2, 3...) definits com Capacitat + Saber + Finalitat.
6. Criteris d'Avaluació: Numerats (1.1, 1.2...) definits com Acció + Saber + Context.
7. Sabers: Llistat de continguts vinculats a l'àrea.
8. Desenvolupament: Estratègies metodològiques, agrupaments i materials.
9. Activitats: Descripció i temporització per a cada fase (inicial, desenvolupament, estructuració, aplicació).
10. Vectors i Suports: Descripció dels vectors, mesures universals i mesures addicionals (alumne/mesura).

No incloguis el text dels decrets en els títols de les seccions, només el contingut pedagògic.`;

  const prompt = `Genera el JSON de la Situació d'Aprenentatge seguint el model oficial per a aquestes notes: "${text}"`;

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
    // As per guidelines, handle 'Requested entity was not found' to prompt key re-selection
    if (err.message?.includes("Requested entity was not found.")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw new Error(err.message || "Error desconegut.");
  }
};
