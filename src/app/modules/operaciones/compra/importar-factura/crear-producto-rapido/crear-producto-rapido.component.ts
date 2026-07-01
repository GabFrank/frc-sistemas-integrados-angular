import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, map, switchMap, take } from 'rxjs/operators';

import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';

import { ProductoService } from '../../../../productos/producto/producto.service';
import { ProductoInput } from '../../../../productos/producto/producto-input.model';
import { PresentacionService } from '../../../../productos/presentacion/presentacion.service';
import { PresentacionInput } from '../../../../productos/presentacion/presentacion.model-input';
import { CodigoService } from '../../../../productos/codigo/codigo.service';
import { CodigoInput } from '../../../../productos/codigo/codigo-input.model';
import { PrecioPorSucursalService } from '../../../../productos/precio-por-sucursal/precio-por-sucursal.service';
import { PrecioPorSucursalInput } from '../../../../productos/precio-por-sucursal/precio-por-sucursal-input.model';
import { FamiliaService } from '../../../../productos/familia/familia.service';
import { SubFamiliaService } from '../../../../productos/sub-familia/sub-familia.service';
import { TipoPresentacionService } from '../../../../productos/tipo-presentacion/tipo-presentacion.service';
import { TipoPrecioService } from '../../../../productos/tipo-precio/tipo-precio.service';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import {
  CostoPorProductoService,
  CostoPorProductoInput,
} from '../../../costo-por-producto/costo-por-producto.service';

export interface CrearProductoRapidoData {
  /** Datos precargados desde una línea de factura importada. */
  prefill?: {
    descripcion?: string;
    codigoBarras?: string; // dGtin (barcode real; NO el codigo interno del proveedor)
    iva?: number;
    unidadMedida?: string;
    precioCosto?: number;
    esGuarani?: boolean;
  };
}

export interface CrearProductoRapidoResult {
  saved?: boolean;
  producto?: any;
  presentacion?: any;
}

/**
 * Alta rápida de producto (producto + presentación + código + precio de venta + costo)
 * en una sola pantalla, reutilizando los services existentes. Pensado para crear un
 * producto directamente desde una línea de factura importada.
 */
@UntilDestroy()
@Component({
  selector: 'app-crear-producto-rapido',
  templateUrl: './crear-producto-rapido.component.html',
  styleUrls: ['./crear-producto-rapido.component.scss'],
})
export class CrearProductoRapidoComponent implements OnInit {
  form = new FormGroup({
    familia: new FormControl<any>(null, Validators.required),
    subfamilia: new FormControl<any>(null, Validators.required),
    descripcion: new FormControl('', [Validators.required, Validators.minLength(2)]),
    iva: new FormControl(10, Validators.required),
    tipoPresentacion: new FormControl<number>(null, Validators.required),
    cantidad: new FormControl(1, [Validators.required, Validators.min(0.0001)]),
    codigoBarras: new FormControl(''),
    precioCosto: new FormControl(0, [Validators.required, Validators.min(0)]),
    precioVenta: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  familiaOptions: any[] = [];
  subfamiliaOptions: any[] = [];
  tipoPresentacionList: any[] = [];
  ivaOptions = [10, 5, 0];

  guardando = false;
  currencyMask = new CurrencyMask();

  private monedaId: number = null;
  private tipoPrecioVentaId: number = null;
  private cargandoReqId: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CrearProductoRapidoData,
    private dialogRef: MatDialogRef<CrearProductoRapidoComponent>,
    private mainService: MainService,
    private notif: NotificacionSnackbarService,
    private cargando: CargandoDialogService,
    private productoService: ProductoService,
    private presentacionService: PresentacionService,
    private codigoService: CodigoService,
    private precioService: PrecioPorSucursalService,
    private costoService: CostoPorProductoService,
    private familiaService: FamiliaService,
    private subFamiliaService: SubFamiliaService,
    private tipoPresentacionService: TipoPresentacionService,
    private tipoPrecioService: TipoPrecioService,
    private monedaService: MonedaService
  ) {}

  /** Guaraní por defecto (la mayoría de las facturas locales). */
  get esGuarani(): boolean {
    return this.data?.prefill?.esGuarani !== false;
  }

  get opcionesMoneda() {
    return this.esGuarani
      ? this.currencyMask.currencyOptionsGuarani
      : this.currencyMask.currencyOptionsNoGuarani;
  }

  ngOnInit(): void {
    this.aplicarPrefill();
    this.cargarCatalogos();
    this.setupFamiliaSearch();
    this.setupSubfamiliaSearch();
    this.setupCostoVentaLink();
  }

  private aplicarPrefill(): void {
    const pf = this.data?.prefill;
    if (!pf) return;
    const costo = pf.precioCosto || 0;
    this.form.patchValue({
      descripcion: pf.descripcion || '',
      iva: pf.iva != null ? pf.iva : 10,
      codigoBarras: pf.codigoBarras || '',
      precioCosto: costo,
      precioVenta: this.sugerirVenta(costo),
    });
  }

  /** Venta sugerida = costo + 25% redondeado para arriba (editable). Futuro: configurable. */
  private sugerirVenta(costo: number): number {
    if (!costo) return 0;
    const bruto = costo * 1.25;
    return this.esGuarani ? Math.ceil(bruto) : Math.ceil(bruto * 100) / 100;
  }

  private setupCostoVentaLink(): void {
    this.form
      .get('precioCosto')
      .valueChanges.pipe(debounceTime(300), untilDestroyed(this))
      .subscribe((costo: number) => {
        this.form.get('precioVenta').setValue(this.sugerirVenta(costo || 0), { emitEvent: false });
      });
  }

  private cargarCatalogos(): void {
    this.tipoPresentacionService
      .onGetPresentaciones()
      .pipe(untilDestroyed(this))
      .subscribe((res: any[]) => {
        if (res) {
          this.tipoPresentacionList = [...res].sort((a, b) => (a.id > b.id ? 1 : -1));
          const unidad =
            this.tipoPresentacionList.find(
              (t) => (t.descripcion || '').toUpperCase() === 'UNIDAD'
            ) || this.tipoPresentacionList[0];
          if (unidad) this.form.get('tipoPresentacion').setValue(unidad.id);
        }
      });

    this.tipoPrecioService
      .onGetAllTipoPrecios()
      .pipe(untilDestroyed(this))
      .subscribe((res: any[]) => {
        if (res && res.length) {
          const venta =
            res.find((t) => /venta|mostrador|contado|minorista/i.test(t.descripcion || '')) ||
            res[0];
          this.tipoPrecioVentaId = venta ? venta.id : null;
        }
      });

    this.monedaService
      .onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe((monedas: any[]) => {
        if (monedas && monedas.length) {
          const guarani = monedas.find((m) => (m.denominacion || '').toUpperCase() === 'GUARANI');
          this.monedaId = guarani ? guarani.id : monedas[0].id;
        }
      });
  }

  private setupFamiliaSearch(): void {
    this.form
      .get('familia')
      .valueChanges.pipe(debounceTime(300), untilDestroyed(this))
      .subscribe((val: any) => {
        if (typeof val === 'string' && val.trim().length >= 1) {
          this.familiaService
            .onSearchFamilia(val.trim(), 0, 20)
            .pipe(untilDestroyed(this))
            .subscribe((res: any) => {
              this.familiaOptions = res?.getContent || res?.content || [];
            });
        }
      });
  }

  private setupSubfamiliaSearch(): void {
    this.form
      .get('subfamilia')
      .valueChanges.pipe(debounceTime(300), untilDestroyed(this))
      .subscribe((val: any) => {
        const familia = this.form.get('familia').value;
        if (familia?.id && typeof val === 'string') {
          this.subFamiliaService
            .onSearchSubfamilia(familia.id, val.trim(), 0, 30)
            .pipe(untilDestroyed(this))
            .subscribe((res: any) => {
              this.subfamiliaOptions = res?.getContent || res?.content || [];
            });
        }
      });
  }

  onFamiliaSelected(familia: any): void {
    this.form.get('subfamilia').setValue(null);
    this.subfamiliaOptions = [];
    if (familia?.id) {
      this.subFamiliaService
        .onSearchSubfamilia(familia.id, '', 0, 50)
        .pipe(untilDestroyed(this))
        .subscribe((res: any) => {
          this.subfamiliaOptions = res?.getContent || res?.content || [];
        });
    }
  }

  displayFamilia = (f: any): string => (f && f.descripcion ? f.descripcion : '');
  displaySubfamilia = (s: any): string => (s && s.descripcion ? s.descripcion : '');

  cancelar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.notif.openWarn('Completá los campos requeridos');
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const subfamilia = v.subfamilia;
    if (!subfamilia || !subfamilia.id) {
      this.notif.openWarn('Seleccioná la subfamilia');
      return;
    }

    const usuarioId = this.mainService.usuarioActual?.id;
    const sucursalId = this.mainService.sucursalActual?.id;

    const pInput = new ProductoInput();
    pInput.descripcion = (v.descripcion || '').toUpperCase();
    pInput.descripcionFactura = pInput.descripcion;
    pInput.iva = Number(v.iva);
    pInput.subfamiliaId = subfamilia.id;
    pInput.stock = true;
    pInput.activo = true;
    pInput.usuarioId = usuarioId;

    this.guardando = true;
    this.cargandoReqId = this.cargando.openDialog().requestId;

    this.productoService
      .onSaveProducto(pInput)
      .pipe(
        take(1),
        switchMap((producto: any) => {
          if (!producto || !producto.id) throw new Error('No se pudo crear el producto');
          const presInput = new PresentacionInput();
          presInput.productoId = producto.id;
          presInput.tipoPresentacionId = v.tipoPresentacion;
          presInput.cantidad = Number(v.cantidad);
          presInput.principal = true;
          presInput.activo = true;
          return this.presentacionService
            .onSavePresentacion(presInput)
            .pipe(take(1), map((pres: any) => ({ producto, pres })));
        }),
        switchMap(({ producto, pres }) => {
          if (!pres || !pres.id) throw new Error('No se pudo crear la presentación');

          const tareas: Observable<any>[] = [];

          const precioInput = new PrecioPorSucursalInput();
          precioInput.presentacionId = pres.id;
          precioInput.precio = Number(v.precioVenta);
          precioInput.tipoPrecioId = this.tipoPrecioVentaId;
          precioInput.principal = true;
          precioInput.activo = true;
          precioInput.sucursalId = sucursalId;
          tareas.push(this.precioService.onSave(precioInput).pipe(take(1)));

          const costoInput: CostoPorProductoInput = {
            productoId: producto.id,
            sucursalId: sucursalId,
            costoMedio: Number(v.precioCosto),
            ultimoPrecioCompra: Number(v.precioCosto),
            monedaId: this.monedaId,
            cotizacion: 1,
            usuarioId: usuarioId,
          };
          tareas.push(this.costoService.onSaveCostoPorProducto(costoInput).pipe(take(1)));

          const codigo = (v.codigoBarras || '').trim();
          if (codigo) {
            const tareaCodigo = this.codigoService.onGetCodigoPorCodigo(codigo).pipe(
              take(1),
              switchMap((existentes: any[]) => {
                if (existentes && existentes.length > 0) {
                  this.notif.openWarn(
                    'El código ' + codigo + ' ya está en uso; el producto se crea sin código.'
                  );
                  return of(null);
                }
                const cInput = new CodigoInput();
                cInput.codigo = codigo;
                cInput.presentacionId = pres.id;
                cInput.principal = true;
                cInput.activo = true;
                return this.codigoService.onSaveCodigo(cInput).pipe(take(1));
              })
            );
            tareas.push(tareaCodigo);
          }

          return forkJoin(tareas).pipe(map(() => ({ producto, pres })));
        }),
        untilDestroyed(this)
      )
      .subscribe({
        next: (result: { producto: any; pres: any }) => {
          this.finalizarCarga();
          this.notif.openSucess('Producto creado');
          this.dialogRef.close({
            saved: true,
            producto: result.producto,
            presentacion: result.pres,
          } as CrearProductoRapidoResult);
        },
        error: (err: any) => {
          this.finalizarCarga();
          this.notif.openWarn('Error al crear el producto: ' + (err?.message || err));
        },
      });
  }

  private finalizarCarga(): void {
    this.guardando = false;
    this.cargando.closeDialog(this.cargandoReqId);
  }
}
