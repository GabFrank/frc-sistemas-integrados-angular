export type ModuloPadreGasto = string;

export type TipoNaturalezaGasto = 'VARIABLE' | 'CONTINUO' | 'RECURRENTE';

export type GrupoModuloGasto = 'ACTIVO' | 'SERVICIO' | 'OTRO';

/**
 * Catálogo de módulo padre provisto por el backend (query modulosGasto).
 * Es la única fuente de verdad: el frontend no vuelve a hardcodear reglas.
 */
export interface ModuloGastoInfo {
  valor: string;
  etiqueta: string;
  grupo: GrupoModuloGasto;
  esServicioContinuo: boolean;
  tieneCuotasActivo: boolean;
  requiereEnteActivo: boolean;
  tipoEnteEsperado: string | null;
  diaVencimientoEnContinuo: boolean;
  lecturaMedidorEnContinuo: boolean;
  nisEnContinuo: boolean;
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

export function esGastoContinuoRecurrente(naturaleza?: string | null): boolean {
  return naturaleza === 'CONTINUO' || naturaleza === 'RECURRENTE';
}

export function buscarModuloInfo(
  catalogo: ModuloGastoInfo[] | null | undefined,
  modulo?: string | null,
): ModuloGastoInfo | null {
  if (!catalogo || modulo == null) {
    return null;
  }
  return catalogo.find((item) => item.valor === modulo) ?? null;
}

export function esModuloServicioContinuo(info?: ModuloGastoInfo | null): boolean {
  return info?.esServicioContinuo === true;
}

export function calcularReglasTipoGastoModulo(
  info: ModuloGastoInfo | null | undefined,
  naturaleza?: TipoNaturalezaGasto | string | null,
): ReglasTipoGastoModulo {
  const nat = (naturaleza ?? 'VARIABLE') as TipoNaturalezaGasto;
  const continuo = esGastoContinuoRecurrente(nat);
  const servicio = info?.esServicioContinuo === true;
  const tieneCuotas = info?.tieneCuotasActivo === true;

  const esPagoCuotaActivo = continuo && tieneCuotas;
  const afectaFinanzasActivo = servicio || (continuo && tieneCuotas);
  const requiereDiaVencimiento = continuo && info?.diaVencimientoEnContinuo === true;
  const requiereLecturaMedidor = continuo && info?.lecturaMedidorEnContinuo === true;
  const requiereNis = continuo && info?.nisEnContinuo === true;
  const montoVariableEnContinuo = continuo && servicio;

  let hintConfiguracion = '';
  if (servicio) {
    hintConfiguracion =
      'Gasto continuo con monto variable mensual. Al registrar el gasto continuo se pedirá día de vencimiento';
    if (info?.valor === 'ANDE') {
      hintConfiguracion += ', NIS, nro. de reloj y lecturas.';
    } else if (info?.valor === 'JUNTA_SANEAMIENTO') {
      hintConfiguracion += ' y lecturas del medidor de agua.';
    } else {
      hintConfiguracion += '.';
    }
  } else if (esPagoCuotaActivo) {
    hintConfiguracion =
      'Gasto continuo con cuotas del activo. Al vincular el inmueble/vehículo/mueble se tomarán las cuotas pendientes.';
  } else if (info?.valor === 'INMUEBLE' && nat === 'VARIABLE') {
    hintConfiguracion =
      'Gasto ocasional del inmueble (ej. mantenimiento). No aplica cuotas ni día de vencimiento fijo.';
  }

  return {
    esPagoCuotaActivo,
    afectaFinanzasActivo,
    mostrarCuotas: tieneCuotas,
    mostrarAfectaFinanzas: tieneCuotas || servicio,
    requiereDiaVencimiento,
    requiereLecturaMedidor,
    requiereNis,
    montoVariableEnContinuo,
    naturalezaSugerida: servicio ? 'CONTINUO' : null,
    hintConfiguracion,
  };
}

export interface CampoCapturaContinuo {
  icono: string;
  etiqueta: string;
}

/**
 * Define explícitamente qué campos se capturan al crear un gasto continuo de este módulo padre.
 * Es puramente presentacional (íconos y etiquetas), por eso vive en el frontend.
 */
export function camposCapturaGastoContinuo(
  modulo?: string | null,
): CampoCapturaContinuo[] {
  const base: CampoCapturaContinuo[] = [
    { icono: 'event_repeat', etiqueta: 'Periodicidad (mensual, trimestral, etc.)' },
    { icono: 'today', etiqueta: 'Día de vencimiento' },
    { icono: 'payments', etiqueta: 'Moneda de pago' },
  ];

  switch (modulo) {
    case 'ANDE':
      return [
        ...base,
        { icono: 'badge', etiqueta: 'Titular de la factura' },
        { icono: 'tag', etiqueta: 'NIS' },
        { icono: 'speed', etiqueta: 'Nro. de reloj / medidor' },
        { icono: 'straighten', etiqueta: 'Lectura inicial' },
      ];
    case 'JUNTA_SANEAMIENTO':
      return [
        ...base,
        { icono: 'badge', etiqueta: 'Titular de la factura' },
        { icono: 'speed', etiqueta: 'Nro. de medidor de agua' },
        { icono: 'straighten', etiqueta: 'Lectura inicial' },
      ];
    case 'INTERNET':
      return [
        ...base,
        { icono: 'attach_money', etiqueta: 'Valor fijo mensual' },
        { icono: 'download', etiqueta: 'Velocidad de bajada' },
        { icono: 'upload', etiqueta: 'Velocidad de subida' },
      ];
    case 'SEGURIDAD':
      return [
        ...base,
        { icono: 'attach_money', etiqueta: 'Valor fijo mensual' },
        { icono: 'schedule', etiqueta: 'Horario de entrada y salida' },
      ];
    case 'BASURA':
      return [
        ...base,
        { icono: 'attach_money', etiqueta: 'Valor fijo mensual' },
        { icono: 'calendar_month', etiqueta: 'Días de recolección' },
      ];
    case 'SEGURO':
      return [
        ...base,
        { icono: 'attach_money', etiqueta: 'Valor fijo por período' },
        { icono: 'description', etiqueta: 'Nro. de póliza' },
        { icono: 'event_available', etiqueta: 'Vigencia del contrato' },
      ];
    case 'IMPUESTO':
      return [
        ...base,
        { icono: 'attach_money', etiqueta: 'Monto de la boleta' },
        { icono: 'history', etiqueta: 'Fecha del último pago' },
      ];
    default:
      return base;
  }
}

export function etiquetaModuloPadre(
  catalogo: ModuloGastoInfo[] | null | undefined,
  modulo?: string | null,
): string {
  return buscarModuloInfo(catalogo, modulo)?.etiqueta ?? 'Otro';
}

export function tipoEnteDesdeModuloInfo(
  info?: ModuloGastoInfo | null,
): 'VEHICULO' | 'MUEBLE' | 'INMUEBLE' | 'EQUIPO' | null {
  const tipo = info?.tipoEnteEsperado;
  if (tipo === 'VEHICULO' || tipo === 'MUEBLE' || tipo === 'INMUEBLE' || tipo === 'EQUIPO') {
    return tipo;
  }
  return null;
}

export function requiereEnteActivo(info?: ModuloGastoInfo | null): boolean {
  return info?.requiereEnteActivo === true;
}

export function mostrarTarjetaCuotasActivoEnSolicitud(
  info: ModuloGastoInfo | null | undefined,
  naturaleza?: TipoNaturalezaGasto | string | null,
  esPagoCuotaActivo?: boolean | null,
): boolean {
  if (info?.tieneCuotasActivo !== true) {
    return false;
  }
  if (typeof esPagoCuotaActivo === 'boolean') {
    return esPagoCuotaActivo;
  }
  return esGastoContinuoRecurrente(naturaleza);
}
