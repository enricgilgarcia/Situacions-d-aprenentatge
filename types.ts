
export interface CompetenciaEspecífica {
  descripcio: string;
  area_materia: string;
}

export interface SaberItem {
  saber: string;
  area_materia: string;
}

export interface SuportAddicional {
  alumne: string;
  mesura: string;
}

export interface SituacioAprenentatge {
  identificacio: {
    titol: string;
    curs: string;
    area_materia_ambit: string;
  };
  descripcio: {
    context_repte: string;
    competencies_transversals: string;
  };
  concrecio_curricular: {
    competencies_especifiques: CompetenciaEspecífica[];
    objectius: string[];
    criteris_avaluacio: string[];
    sabers: SaberItem[];
  };
  desenvolupament: {
    estrategies_materials: string;
    activitats: {
      inicials: string;
      desenvolupament: string;
      estructuracio: string;
      aplicacio: string;
    };
  };
  vectors_suports: {
    vectors_descripcio: string;
    suports_universals: string;
    suports_addicionals: SuportAddicional[];
  };
}
