export type ModuloPadreGasto =
  | 'MUEBLE'
  | 'INMUEBLE'
  | 'PERSONAS'
  | 'VEHICULO'
  | 'EQUIPOS'
  | 'ANDE'
  | 'JUNTA_SANEAMIENTO'
  | 'IMPUESTO'
  | 'INTERNET'
  | 'SEGURIDAD'
  | 'BASURA'
  | 'SEGURO'
  | 'OTRO';

export type TipoNaturalezaGasto = 'VARIABLE' | 'CONTINUO' | 'RECURRENTE';

export interface ModuloPadreOpcion {
  valor: ModuloPadreGasto;
  etiqueta: string;
  grupo: 'ACTIVO' | 'SERVICIO' | 'OTRO';
}

export interface ReglasTipoGastoModulo {
  esPagoCuotaActivo: boolean;
  afectaFinanzasActivo: boolean;
  mostrarCuotas: boolean;
  mostrarAfectaFinanzas: boolean;
  requiereDiaVencimiento: boolean;
  requiereLecturaMedidor: boolean;
  requiereNis: boolean;
  montoVariableEnContinuo: boolean;
  naturalezaSugerida: TipoNaturalezaGasto | null;
  hintConfiguracion: string;
}

export const MODULOS_PADRE_OPCIONES: ModuloPadreOpcion[] = [
  { valor: 'INMUEBLE', etiqueta: 'Inmueble', grupo: 'ACTIVO' },
  { valor: 'VEHICULO', etiqueta: 'Vehículo', grupo: 'ACTIVO' },
  { valor: 'MUEBLE', etiqueta: 'Mueble', grupo: 'ACTIVO' },
  { valor: 'EQUIPOS', etiqueta: 'Equipo', grupo: 'ACTIVO' },
  { valor: 'PERSONAS', etiqueta: 'Persona', grupo: 'ACTIVO' },
  { valor: 'ANDE', etiqueta: 'ANDE (energía eléctrica)', grupo: 'SERVICIO' },
  { valor: 'JUNTA_SANEAMIENTO', etiqueta: 'Junta de Saneamiento (agua)', grupo: 'SERVICIO' },
  { valor: 'INTERNET', etiqueta: 'Internet', grupo: 'SERVICIO' },
  { valor: 'SEGURIDAD', etiqueta: 'Seguridad privada', grupo: 'SERVICIO' },
  { valor: 'BASURA', etiqueta: 'Recolección de basura', grupo: 'SERVICIO' },
  { valor: 'SEGURO', etiqueta: 'Seguro', grupo: 'SERVICIO' },
  { valor: 'IMPUESTO', etiqueta: 'Impuesto', grupo: 'SERVICIO' },
  { valor: 'OTRO', etiqueta: 'Otro', grupo: 'OTRO' },
];

const MODULOS_SERVICIO_CONTINUO: ModuloPadreGasto[] = [
  'ANDE',
  'JUNTA_SANEAMIENTO',
  'IMPUESTO',
  'INTERNET',
  'SEGURIDAD',
  'BASURA',
  'SEGURO',
];

export function esGastoContinuoRecurrente(naturaleza?: string | null): boolean {
  return naturaleza === 'CONTINUO' || naturaleza === 'RECURRENTE';
}

export function esModuloServicioContinuo(modulo?: ModuloPadreGasto | string | null): boolean {
  return MODULOS_SERVICIO_CONTINUO.includes(modulo as ModuloPadreGasto);
}

export function calcularReglasTipoGastoModulo(
  modulo?: ModuloPadreGasto | string | null,
  naturaleza?: TipoNaturalezaGasto | string | null
): ReglasTipoGastoModulo {
  const mod = (modulo ?? 'OTRO') as ModuloPadreGasto;
  const nat = (naturaleza ?? 'VARIABLE') as TipoNaturalezaGasto;
  const continuo = esGastoContinuoRecurrente(nat);
  const servicio = esModuloServicioContinuo(mod);

  const esPagoCuotaActivo =
    continuo && (mod === 'INMUEBLE' || mod === 'MUEBLE' || mod === 'VEHICULO');

  const afectaFinanzasActivo =
    servicio ||
    (continuo && (mod === 'INMUEBLE' || mod === 'MUEBLE' || mod === 'VEHICULO'));

  const requiereDiaVencimiento = continuo && (servicio || mod === 'INMUEBLE');
  const requiereLecturaMedidor =
    continuo && (mod === 'ANDE' || mod === 'JUNTA_SANEAMIENTO');
  const requiereNis = continuo && mod === 'ANDE';
  const montoVariableEnContinuo = continuo && servicio;

  let hintConfiguracion = '';
  if (servicio) {
    hintConfiguracion =
      'Gasto continuo con monto variable mensual. Al registrar el gasto continuo se pedirá día de vencimiento';
    if (mod === 'ANDE') {
      hintConfiguracion += ', NIS, nro. de reloj y lecturas.';
    } else if (mod === 'JUNTA_SANEAMIENTO') {
      hintConfiguracion += ' y lecturas del medidor de agua.';
    } else {
      hintConfiguracion += '.';
    }
  } else if (esPagoCuotaActivo) {
    hintConfiguracion =
      'Gasto continuo con cuotas del activo. Al vincular el inmueble/vehículo/mueble se tomarán las cuotas pendientes.';
  } else if (mod === 'INMUEBLE' && nat === 'VARIABLE') {
    hintConfiguracion =
      'Gasto ocasional del inmueble (ej. mantenimiento). No aplica cuotas ni día de vencimiento fijo.';
  }

  return {
    esPagoCuotaActivo,
    afectaFinanzasActivo,
    mostrarCuotas: mod === 'INMUEBLE' || mod === 'MUEBLE' || mod === 'VEHICULO',
    mostrarAfectaFinanzas:
      mod === 'INMUEBLE' || mod === 'MUEBLE' || mod === 'VEHICULO' || servicio,
    requiereDiaVencimiento,
    requiereLecturaMedidor,
    requiereNis,
    montoVariableEnContinuo,
    naturalezaSugerida: servicio ? 'CONTINUO' : null,
    hintConfiguracion,
  };
}

export function etiquetaModuloPadre(modulo?: ModuloPadreGasto | string | null): string {
  const opcion = MODULOS_PADRE_OPCIONES.find((item) => item.valor === modulo);
  return opcion?.etiqueta ?? 'Otro';
}

export function tipoEnteDesdeModuloPadre(
  modulo?: ModuloPadreGasto | string | null
): 'VEHICULO' | 'MUEBLE' | 'INMUEBLE' | 'EQUIPO' | null {
  if (modulo === 'VEHICULO' || modulo === 'MUEBLE' || modulo === 'INMUEBLE') {
    return modulo;
  }
  if (modulo === 'EQUIPOS') {
    return 'EQUIPO';
  }
  if (esModuloServicioContinuo(modulo)) {
    return 'INMUEBLE';
  }
  return null;
}

export function requiereEnteActivo(modulo?: ModuloPadreGasto | string | null): boolean {
  return tipoEnteDesdeModuloPadre(modulo) != null;
}
