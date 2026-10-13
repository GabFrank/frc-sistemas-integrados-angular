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
