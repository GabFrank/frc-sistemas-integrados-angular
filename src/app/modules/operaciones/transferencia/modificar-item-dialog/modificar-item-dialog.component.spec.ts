import type { MatDialogRef } from '@angular/material/dialog';
import type { Presentacion } from '../../../productos/presentacion/presentacion.model';
import {
  EtapaTransferencia,
  TransferenciaItem,
  TransferenciaItemMotivoModificacion,
  TransferenciaItemMotivoRechazo,
} from '../transferencia.model';
import {
  ModificarItemDialoData,
  ModificarItemDialogComponent,
} from './modificar-item-dialog.component';

/**
 * Lo que el diálogo devuelve es lo que se guarda (saveTransferenciaItem). Este spec fija ese
 * resultado en las 3 etapas × 3 modos para que un cambio visual no lo altere sin que se note.
 * Sin TestBed: se instancia la clase con un MatDialogRef falso.
 */
describe('ModificarItemDialogComponent', () => {
  const presPre = { id: 1, cantidad: 12 } as Presentacion;
  const presPrep = { id: 2, cantidad: 6 } as Presentacion;
  const presTransp = { id: 3, cantidad: 1 } as Presentacion;
  const vencPre = new Date(2027, 0, 10);
  const vencPrep = new Date(2027, 1, 10);
  const vencTransp = new Date(2027, 2, 10);
  const vencNuevo = new Date(2028, 5, 1);

  function fila(): TransferenciaItem {
    return {
      id: 99,
      cantidadPreTransferencia: 3,
      presentacionPreTransferencia: presPre,
      vencimientoPreTransferencia: vencPre,
      cantidadPreparacion: 4,
      presentacionPreparacion: presPrep,
      vencimientoPreparacion: vencPrep,
      cantidadTransporte: 5,
      presentacionTransporte: presTransp,
      vencimientoTransporte: vencTransp,
      motivoRechazoPreparacion: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO,
      motivoRechazoTransporte: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO,
      motivoRechazoRecepcion: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO,
    } as TransferenciaItem;
  }

  // Campos de cada etapa y los de la etapa de la que copia.
  const etapas = [
    {
      etapa: EtapaTransferencia.PREPARACION_MERCADERIA,
      sufijo: 'Preparacion',
      origen: { cantidad: 3, presentacion: presPre, vencimiento: vencPre },
    },
    {
      etapa: EtapaTransferencia.TRANSPORTE_VERIFICACION,
      sufijo: 'Transporte',
      origen: { cantidad: 4, presentacion: presPrep, vencimiento: vencPrep },
    },
    {
      etapa: EtapaTransferencia.RECEPCION_EN_VERIFICACION,
      sufijo: 'Recepcion',
      origen: { cantidad: 5, presentacion: presTransp, vencimiento: vencTransp },
    },
  ];

  function abrir(data: Partial<ModificarItemDialoData>) {
    const close = jasmine.createSpy('close');
    const dialogo = new ModificarItemDialogComponent(
      { item: fila(), ...data } as ModificarItemDialoData,
      { close } as unknown as MatDialogRef<ModificarItemDialogComponent>
    );
    dialogo.ngOnInit();
    return { dialogo, close };
  }

  function devuelto(close: jasmine.Spy): TransferenciaItem {
    expect(close).toHaveBeenCalledTimes(1);
    return close.calls.mostRecent().args[0].item;
  }

  etapas.forEach(({ etapa, sufijo, origen }) => {
    describe(etapa, () => {
      it('modificar cantidad: cantidad nueva, presentación y vencimiento de origen, sin rechazo', () => {
        const { dialogo, close } = abrir({ etapa, isCantidad: true });
        dialogo.cantidadControl.setValue(7);
        dialogo.onAceptar();

        const item = devuelto(close);
        expect(item instanceof TransferenciaItem).toBe(true);
        expect(item['cantidad' + sufijo]).toBe(7);
        expect(item['presentacion' + sufijo]).toBe(origen.presentacion);
        expect(item['vencimiento' + sufijo]).toBe(origen.vencimiento);
        expect(item['motivoModificacion' + sufijo]).toBe(
          TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
        );
        expect(item['motivoRechazo' + sufijo]).toBeNull();
      });

      it('modificar vencimiento: fecha nueva, cantidad y presentación de origen, sin rechazo', () => {
        const { dialogo, close } = abrir({ etapa, isVencimiento: true });
        dialogo.vencimientoControl.setValue(vencNuevo);
        dialogo.onAceptar();

        const item = devuelto(close);
        expect(item['cantidad' + sufijo]).toBe(origen.cantidad);
        expect(item['presentacion' + sufijo]).toBe(origen.presentacion);
        expect(item['vencimiento' + sufijo]).toBe(vencNuevo);
        expect(item['motivoModificacion' + sufijo]).toBe(
          TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
        );
        expect(item['motivoRechazo' + sufijo]).toBeNull();
      });

      it('rechazar: datos de origen, motivo elegido, sin motivo de modificación', () => {
        const { dialogo, close } = abrir({ etapa, isRechazar: true });
        dialogo.motivoControl.setValue(TransferenciaItemMotivoRechazo.PRODUCTO_AVERIADO);
        dialogo.onAceptar();

        const item = devuelto(close);
        expect(item['cantidad' + sufijo]).toBe(origen.cantidad);
        expect(item['presentacion' + sufijo]).toBe(origen.presentacion);
        expect(item['vencimiento' + sufijo]).toBe(origen.vencimiento);
        expect(item['motivoModificacion' + sufijo]).toBeNull();
        expect(item['motivoRechazo' + sufijo]).toBe(
          TransferenciaItemMotivoRechazo.PRODUCTO_AVERIADO
        );
      });
    });
  });

  it('Enter con el campo vacío no confirma; con valor, sí', () => {
    const { dialogo, close } = abrir({
      etapa: EtapaTransferencia.PREPARACION_MERCADERIA,
      isCantidad: true,
    });
    dialogo.onEnter();
    expect(close).not.toHaveBeenCalled();

    dialogo.cantidadControl.setValue(2);
    dialogo.onEnter();
    expect(devuelto(close).cantidadPreparacion).toBe(2);
  });

  it('el control activo es el del modo abierto', () => {
    const cantidad = abrir({ isCantidad: true }).dialogo;
    expect(cantidad.controlActivo).toBe(cantidad.cantidadControl);
    const vencimiento = abrir({ isVencimiento: true }).dialogo;
    expect(vencimiento.controlActivo).toBe(vencimiento.vencimientoControl);
    const rechazar = abrir({ isRechazar: true }).dialogo;
    expect(rechazar.controlActivo).toBe(rechazar.motivoControl);
  });

  it('muestra los datos de la etapa de origen, que son los que se guardan al rechazar', () => {
    const { dialogo } = abrir({
      etapa: EtapaTransferencia.TRANSPORTE_VERIFICACION,
      isRechazar: true,
    });
    expect(dialogo.origen.cantidad).toBe(4);
    expect(dialogo.origen.presentacion).toBe(presPrep);
    expect(dialogo.totalUnidades).toBe(24);
  });

  it('sin producto en la fila no rompe', () => {
    const { dialogo } = abrir({
      etapa: EtapaTransferencia.PREPARACION_MERCADERIA,
      isCantidad: true,
    });
    expect(dialogo.productoDescripcion).toBe('');
    expect(dialogo.productoCodigo).toBe('');
  });

  it('cancelar cierra sin ítem', () => {
    const { dialogo, close } = abrir({
      etapa: EtapaTransferencia.PREPARACION_MERCADERIA,
      isCantidad: true,
    });
    dialogo.onCancelar();
    expect(close).toHaveBeenCalledOnceWith();
  });

  it('no toca la fila de la grilla', () => {
    const original = fila();
    const close = jasmine.createSpy('close');
    const dialogo = new ModificarItemDialogComponent(
      { item: original, etapa: EtapaTransferencia.PREPARACION_MERCADERIA, isCantidad: true },
      { close } as unknown as MatDialogRef<ModificarItemDialogComponent>
    );
    dialogo.ngOnInit();
    dialogo.cantidadControl.setValue(7);
    dialogo.onAceptar();
    expect(original.cantidadPreparacion).toBe(4);
  });
});
