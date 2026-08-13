/**
 * Catálogo curado de la configuración RRHH: define las SECCIONES (pestañas) y el
 * WIDGET de cada clave. Las claves son un catálogo fijo definido por desarrollo
 * (nacen por migración/seed, no se crean desde la UI). Este archivo decide cómo
 * se agrupan y editan; los textos de ayuda viven en configuracion-rrhh-help.ts.
 *
 * Al agregar una clave nueva por migración: sumarla acá (sección + widget) para
 * que aparezca en la pantalla; si no está, cae en la sección "Otros".
 */

export type ConfigWidget = 'percent' | 'money' | 'number' | 'toggle' | 'month';

export interface ConfigCampoMeta {
  widget: ConfigWidget;
  /** Sufijo visible junto al input: 'días', 'meses', 'horas', 'min'. */
  unidad?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const CONFIGURACION_RRHH_CAMPO_META: { [clave: string]: ConfigCampoMeta } = {
  // IPS y aportes
  IPS_PORCENTAJE_FUNCIONARIO: { widget: 'percent', min: 0, max: 100, step: 0.5 },
  IPS_PORCENTAJE_PATRONAL: { widget: 'percent', min: 0, max: 100, step: 0.5 },

  // Indemnización y finiquito
  INDEMNIZACION_DIAS_POR_ANIO: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  INDEMNIZACION_ANTIGUEDAD_MIN_DIAS: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  MESES_PROMEDIO_LIQUIDACION_FINAL: { widget: 'number', unidad: 'meses', min: 1, max: 24, step: 1 },
  DIAS_ANIO_ANTIGUEDAD: { widget: 'number', unidad: 'días', min: 1, step: 1 },
  DIAS_MES_PROMEDIO: { widget: 'number', unidad: 'días', min: 1, max: 31, step: 1 },

  // Preaviso
  PREAVISO_DIAS_HASTA_1A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  PREAVISO_DIAS_1_5A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  PREAVISO_DIAS_5_10A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  PREAVISO_DIAS_MAS_10A: { widget: 'number', unidad: 'días', min: 0, step: 1 },

  // Vacaciones
  DIAS_VACACIONES_HASTA_5A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  DIAS_VACACIONES_5_10A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  DIAS_VACACIONES_MAS_10A: { widget: 'number', unidad: 'días', min: 0, step: 1 },
  PRESCRIPCION_VACACIONES_MESES: { widget: 'number', unidad: 'meses', min: 0, step: 1 },
  VACACION_AVISO_PRESCRIPCION_DIAS: { widget: 'number', unidad: 'días', min: 0, step: 1 },

  // Aguinaldo
  MES_AGUINALDO: { widget: 'month', min: 1, max: 12 },

  // Horas extra
  HORAS_JORNADA_LABORAL: { widget: 'number', unidad: 'horas', min: 1, max: 24, step: 1 },
  RECARGO_HE_DIURNA: { widget: 'percent', min: 0, max: 500, step: 5 },
  RECARGO_HE_NOCTURNA: { widget: 'percent', min: 0, max: 500, step: 5 },
  RECARGO_HE_FERIADO: { widget: 'percent', min: 0, max: 500, step: 5 },

  // Tardanza y penalización
  PENALIZACION_AUTO_TARDANZA: { widget: 'toggle' },
  TOLERANCIA_TARDANZA_MIN: { widget: 'number', unidad: 'min', min: 0, step: 1 },
  PENALIZACION_MONTO_POR_MINUTO_TARDANZA: { widget: 'money' },
  PENALIZACION_MONTO_TARDANZA: { widget: 'money' },

  // General
  SALARIO_MINIMO_LEGAL_PYG: { widget: 'money' },
  DIA_CIERRE_MES: { widget: 'number', unidad: 'día', min: 1, max: 31, step: 1 },
  DOCUMENTO_AVISO_VENCIMIENTO_DIAS: { widget: 'number', unidad: 'días', min: 0, step: 1 }
};

export interface ConfigSeccion {
  titulo: string;
  icono: string;
  claves: string[];
}

export const CONFIGURACION_RRHH_SECCIONES: ConfigSeccion[] = [
  {
    titulo: 'IPS y aportes',
    icono: 'health_and_safety',
    claves: ['IPS_PORCENTAJE_FUNCIONARIO', 'IPS_PORCENTAJE_PATRONAL']
  },
  {
    titulo: 'Indemnización y finiquito',
    icono: 'gavel',
    claves: ['INDEMNIZACION_DIAS_POR_ANIO', 'INDEMNIZACION_ANTIGUEDAD_MIN_DIAS',
      'MESES_PROMEDIO_LIQUIDACION_FINAL', 'DIAS_ANIO_ANTIGUEDAD', 'DIAS_MES_PROMEDIO']
  },
  {
    titulo: 'Preaviso',
    icono: 'notification_important',
    claves: ['PREAVISO_DIAS_HASTA_1A', 'PREAVISO_DIAS_1_5A', 'PREAVISO_DIAS_5_10A', 'PREAVISO_DIAS_MAS_10A']
  },
  {
    titulo: 'Vacaciones',
    icono: 'beach_access',
    claves: ['DIAS_VACACIONES_HASTA_5A', 'DIAS_VACACIONES_5_10A', 'DIAS_VACACIONES_MAS_10A',
      'PRESCRIPCION_VACACIONES_MESES', 'VACACION_AVISO_PRESCRIPCION_DIAS']
  },
  {
    titulo: 'Aguinaldo',
    icono: 'redeem',
    claves: ['MES_AGUINALDO']
  },
  {
    titulo: 'Horas extra',
    icono: 'more_time',
    claves: ['HORAS_JORNADA_LABORAL', 'RECARGO_HE_DIURNA', 'RECARGO_HE_NOCTURNA', 'RECARGO_HE_FERIADO']
  },
  {
    titulo: 'Tardanza y penalización',
    icono: 'schedule',
    claves: ['PENALIZACION_AUTO_TARDANZA', 'TOLERANCIA_TARDANZA_MIN',
      'PENALIZACION_MONTO_POR_MINUTO_TARDANZA', 'PENALIZACION_MONTO_TARDANZA']
  },
  {
    titulo: 'General',
    icono: 'tune',
    claves: ['SALARIO_MINIMO_LEGAL_PYG', 'DIA_CIERRE_MES', 'DOCUMENTO_AVISO_VENCIMIENTO_DIAS']
  }
];
