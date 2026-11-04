import { CurrencyMaskInputMode } from 'ngx-currency';
import { AVISO_BORRADOR_MS, VerificarRetiroBloqueComponent } from './verificar-retiro-bloque.component';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import { Retiro } from '../../retiro.model';
import { claveBorrador, claveBorradorV1 } from '../retiro-verificacion.model';

/**
 * Conteo de un retiro con el contado editable. Lo que importa es la plata: una moneda sin tocar nunca
 * se manda como 0, y la grilla de billetes no pisa un monto tipeado.
 */
describe('VerificarRetiroBloqueComponent — contado editable', () => {
  const GS = { id: 1, denominacion: 'GUARANI', simbolo: 'Gs.', decimales: 0 };
  const RS = { id: 2, denominacion: 'REAL', simbolo: 'R$', decimales: 2 };
  const US = { id: 3, denominacion: 'DOLAR', simbolo: 'US$', decimales: 2 };

  const retiro = (detalle: any[]) => ({ id: 543, sucursalId: 24, retiroDetalleList: detalle }) as any as Retiro;

  let service: RetiroVerificacionService;

  beforeEach(() => {
    localStorage.removeItem(claveBorrador(543, 24));
    localStorage.removeItem(claveBorradorV1(543, 24));
    // Solo se usa la parte del borrador, que no toca Apollo.
    service = new RetiroVerificacionService(null, null, null, null, null, null, null, null as any);
  });

  afterEach(() => {
    localStorage.removeItem(claveBorrador(543, 24));
    localStorage.removeItem(claveBorradorV1(543, 24));
  });

  function armar(detalle: any[]) {
    const b = new VerificarRetiroBloqueComponent(service);
    b.retiro = retiro(detalle);
    b.ngOnInit();
    return b;
  }

  it('sin tocar nada, cada moneda queda sin contar (no en 0) y bloquea', () => {
    const b = armar([{ cantidad: 3000000, moneda: GS }, { cantidad: 100, moneda: RS }]);
    expect(b.filas.map(f => f.contado)).toEqual([null, null]);
    expect(b.hayDiferencia).toBeFalse();
    expect(b.motivoParaNoConfirmar()).toContain('Falta contar el retiro #543');
    expect(() => b.conteos()).toThrow();
  });

  it('un monto tipeado es el contado, calcula la diferencia y la verificación sigue siendo rápida', () => {
    const b = armar([{ cantidad: 100, moneda: RS }]);
    b.onContadoChange(b.filas[0], 90);
    expect(b.filas[0].diferencia).toBe(-10);
    expect(b.filas[0].categoria).toBe('FALTANTE' as any);
    expect(b.esRapida()).toBeTrue();
    expect(b.conteos()[0].contado).toBe(90);
  });

  it('borrar el input lo deja sin contar, nunca en 0', () => {
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    b.onContadoChange(b.filas[0], 500000);
    b.onContadoChange(b.filas[0], null);
    expect(b.filas[0].contado).toBeNull();
    expect(b.motivoParaNoConfirmar()).not.toBeNull();
  });

  it('un 0 explícito es un conteo: se manda 0 y no bloquea', () => {
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    b.onContadoChange(b.filas[0], 0);
    expect(b.motivoParaNoConfirmar()).toBeNull();
    expect(b.conteos()[0].contado).toBe(0);
  });

  it('contar con la grilla marca la verificación como no rápida', () => {
    const b = armar([{ cantidad: 200000, moneda: GS }]);
    b.onCantidadesChange(b.filas[0], { '100000': 2 });
    expect(b.filas[0].contado).toBe(200000);
    expect(b.esRapida()).toBeFalse();
  });

  it('tipear después de la grilla descarta los billetes y cierra la grilla', () => {
    const b = armar([{ cantidad: 200000, moneda: GS }]);
    b.abrirGrilla(b.filas[0]);
    b.onCantidadesChange(b.filas[0], { '100000': 2 });
    b.onContadoChange(b.filas[0], 150000);
    expect(b.cantidadesDe(1)).toEqual({});
    expect(b.monedaAbierta).toBeNull();
    expect(b.esRapida()).toBeTrue();
    expect(b.filas[0].contado).toBe(150000);
  });

  it('abrir la grilla después de tipear no cambia el contado', () => {
    const b = armar([{ cantidad: 200000, moneda: GS }]);
    b.onContadoChange(b.filas[0], 180000);
    b.abrirGrilla(b.filas[0]);
    // La grilla emite totalChange al abrirse con 0: el bloque no lo escucha.
    expect(b.filas[0].contado).toBe(180000);
  });

  it('«= declarado», cerrar y reabrir restaura lo declarado', () => {
    const b = armar([{ cantidad: 3000000, moneda: GS }, { cantidad: 100, moneda: RS }]);
    b.usarDeclarado(b.filas[0]);
    b.usarDeclarado(b.filas[1]);
    const otra = armar([{ cantidad: 3000000, moneda: GS }, { cantidad: 100, moneda: RS }]);
    expect(otra.filas.map(f => f.contado)).toEqual([3000000, 100]);
    expect(otra.huboBorrador).toBeTrue();
    expect(service.hayBorrador(543, 24)).toBeTrue();
  });

  it('un borrador viejo de «usar declarado» (sin montos) restaura la moneda vacía, no en 0', () => {
    localStorage.setItem(claveBorradorV1(543, 24), JSON.stringify({ cantidades: { '1': {} }, actualizadoEn: 'x' }));
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    expect(b.filas[0].contado).toBeNull();
    expect(b.motivoParaNoConfirmar()).not.toBeNull();
  });

  it('un borrador viejo con billetes se sigue restaurando', () => {
    localStorage.setItem(claveBorradorV1(543, 24), JSON.stringify({ cantidades: { '1': { '100000': 3 } }, actualizadoEn: 'x' }));
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    expect(b.filas[0].contado).toBe(300000);
  });

  it('el aviso de borrador recuperado se va solo, o al tocar un contado', () => {
    localStorage.setItem(claveBorrador(543, 24), JSON.stringify({ cantidades: {}, montos: { '1': 100000 }, actualizadoEn: 'x' }));
    jasmine.clock().install();
    try {
      const b = armar([{ cantidad: 500000, moneda: GS }]);
      expect(b.huboBorrador).toBeTrue();
      jasmine.clock().tick(AVISO_BORRADOR_MS - 1);
      expect(b.huboBorrador).toBeTrue();
      jasmine.clock().tick(1);
      expect(b.huboBorrador).toBeFalse();

      const otra = armar([{ cantidad: 500000, moneda: GS }]);
      expect(otra.huboBorrador).toBeTrue();
      otra.onContadoChange(otra.filas[0], 500000);
      expect(otra.huboBorrador).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('hayBorrador cuenta un 0 tipeado como conteo empezado', () => {
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    b.onContadoChange(b.filas[0], 0);
    expect(service.hayBorrador(543, 24)).toBeTrue();
  });

  it('«100» en dólares se manda como 100, y los centavos se redondean a la moneda', () => {
    const b = armar([{ cantidad: 100, moneda: US }, { cantidad: 10, moneda: RS }]);
    b.onContadoChange(b.filas[0], 100);
    b.onContadoChange(b.filas[1], 10.004999);
    expect(b.conteos().map(c => c.contado)).toEqual([100, 10]);
    expect(b.filas[0].opts.inputMode).toBe(CurrencyMaskInputMode.NATURAL);
    expect(b.filas[0].opts.nullable).toBeTrue();
    expect(b.filas[0].opts.allowNegative).toBeFalse();
  });

  it('la máscara de guaraníes no tiene decimales', () => {
    const b = armar([{ cantidad: 500000, moneda: GS }]);
    expect(b.filas[0].opts.precision).toBe(0);
  });

  it('la diferencia se muestra con los decimales fijos de la moneda', () => {
    const b = armar([{ cantidad: 100, moneda: RS }, { cantidad: 500000, moneda: GS }]);
    expect(b.filas[0].formato).toBe('1.2-2');
    expect(b.filas[1].formato).toBe('1.0-0');
    b.onContadoChange(b.filas[0], 90);
    expect(b.resumenDiferencias()).toContain('-10,00 R$');
  });
});
