import { AddFacturaLegalDialogComponent } from './add-factura-legal-dialog.component';

describe('AddFacturaLegalDialogComponent: respuesta de la emisión', () => {
  let component: AddFacturaLegalDialogComponent;
  let avisos: string[];
  let cierres: any[];
  let avisosDeTimbrado: number;

  beforeEach(() => {
    avisos = [];
    cierres = [];
    avisosDeTimbrado = 0;
    const args: any[] = new Array(16).fill(null);
    args[0] = {};
    args[1] = { close: (r: any) => cierres.push(r) };
    args[2] = {
      onShowWarningIfTimbradoAboutToExpire: () => avisosDeTimbrado++,
      onShowWarningIfTimbradoRangoAboutToExpire: () => avisosDeTimbrado++,
    };
    args[4] = { openAlgoSalioMal: (texto: string) => avisos.push(texto) };
    component = new (AddFacturaLegalDialogComponent as any)(...args);
    component.guardando = true;
  });

  it('guardada: cierra el diálogo con el id de la factura', () => {
    component.alResponderLaEmision({ data: { id: 3, facturaLegalId: 9 } as any });
    expect(cierres.length).toBe(1);
    expect(cierres[0].facturado).toBeTrue();
    expect(cierres[0].facturaLegalId).toBe(9);
    expect(avisosDeTimbrado).toBe(2);
    expect(avisos).toEqual([]);
  });

  it('rechazada por el servidor: libera el botón sin sumar aviso ni cerrar', () => {
    component.alResponderLaEmision({ error: [{ message: 'TIMBRADO_SIN_TELEFONO' }] });
    expect(component.guardando).toBeFalse();
    expect(avisos).toEqual([]);
    expect(cierres).toEqual([]);
  });

  it('error de red: avisa que no se pudo confirmar y libera el botón', () => {
    component.alResponderLaEmision({ error: Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch') }) });
    expect(component.guardando).toBeFalse();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
    expect(cierres).toEqual([]);
  });

  it('respuesta vacía: avisa que no se pudo confirmar', () => {
    component.alResponderLaEmision({ error: [{ message: 'Respuesta vacía del servidor' }] });
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
  });

  it('errores con datos: no es rechazo ni éxito, avisa que no se pudo confirmar', () => {
    component.alResponderLaEmision({ data: { id: 3, facturaLegalId: 9 } as any, error: [{ message: 'fallo un campo' }] });
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
    expect(cierres).toEqual([]);
  });

  it('sin datos y sin error: avisa que no se pudo confirmar', () => {
    component.alResponderLaEmision({ data: null });
    expect(avisos.length).toBe(1);
    expect(cierres).toEqual([]);
  });

  it('sin respuesta: avisa que no se pudo confirmar', () => {
    component.alResponderLaEmision(null);
    expect(avisos.length).toBe(1);
  });
});

describe('AddFacturaLegalDialogComponent: envío de la factura a un filial (#471)', () => {
  // Textos reales del central (FacturaLegalFilialService + FacturaLegalGraphQL), ya sin el prefijo de graphql-java.
  const PREFIJO = 'Error al crear factura en servidor filial: ';
  let component: AddFacturaLegalDialogComponent;
  let avisos: string[];
  let guardados: number;
  let cierres: any[];

  beforeEach(() => {
    avisos = [];
    guardados = 0;
    cierres = [];
    const args: any[] = new Array(16).fill(null);
    args[0] = {};
    args[1] = { close: (r: any) => cierres.push(r) };
    args[2] = {};
    args[4] = {
      openAlgoSalioMal: (texto: string) => avisos.push(texto),
      openGuardadoConExito: () => guardados++,
    };
    component = new (AddFacturaLegalDialogComponent as any)(...args);
    component.guardando = true;
  });

  it('rechazo del filial: libera el botón sin sumar aviso (el motivo lo mostró el genérico)', () => {
    component.alFallarElEnvioAFilial([
      { message: PREFIJO + 'Error al crear factura legal: El timbrado detalle no está disponible: sin teléfono' },
    ]);
    expect(component.guardando).toBeFalse();
    expect(avisos).toEqual([]);
    expect(cierres).toEqual([]);
  });

  it('corte con el filial (timeout del central): avisa que no se pudo confirmar', () => {
    component.alFallarElEnvioAFilial([
      { message: PREFIJO + 'Error al conectar con el servidor filial: I/O error on POST request: Read timed out' },
    ]);
    expect(component.guardando).toBeFalse();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
  });

  it('500 del filial: avisa que no se pudo confirmar', () => {
    component.alFallarElEnvioAFilial([{ message: PREFIJO + 'Error del servidor filial: could not execute statement' }]);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
  });

  it('error de red con el central: avisa que no se pudo confirmar', () => {
    component.alFallarElEnvioAFilial(
      Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch') })
    );
    expect(component.guardando).toBeFalse();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
  });

  it('respuesta vacía: avisa que no se pudo confirmar', () => {
    component.alFallarElEnvioAFilial([{ message: 'Respuesta vacía del servidor' }]);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
  });

  it('respuesta sin id de factura: avisa que no se pudo confirmar y no cierra', () => {
    component.alResponderElEnvioAFilial({ facturaId: null } as any, false);
    expect(component.guardando).toBeFalse();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo confirmar la factura');
    expect(cierres).toEqual([]);
    expect(guardados).toBe(0);
  });

  it('guardada sin imprimir: avisa y cierra el diálogo como facturado', () => {
    component.alResponderElEnvioAFilial({ facturaId: 12 } as any, false);
    expect(guardados).toBe(1);
    expect(cierres.length).toBe(1);
    expect(cierres[0].facturado).toBeTrue();
    expect(avisos).toEqual([]);
  });
});
