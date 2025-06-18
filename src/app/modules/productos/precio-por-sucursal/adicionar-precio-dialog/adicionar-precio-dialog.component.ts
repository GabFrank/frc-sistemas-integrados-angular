import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Presentacion } from '../../presentacion/presentacion.model';
import { TipoPrecio } from '../../tipo-precio/tipo-precio.model';
import { TipoPrecioService } from '../../tipo-precio/tipo-precio.service';
import { TiposPromocionService } from '../../tipo-precio/tipo-promocion.service';
import { PrecioPorSucursalInput } from '../precio-por-sucursal-input.model';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { PrecioPorSucursalService } from '../precio-por-sucursal.service';
import { PromocionPorSucursalService } from '../promocion-por-sucursal.service';
import { PromocionPorSucursal, PromocionPorSucursalInput } from '../promocion-por-sucursal';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export class AdicionarPrecioPorSucursalData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-precio-dialog',
  templateUrl: './adicionar-precio-dialog.component.html',
  styleUrls: ['./adicionar-precio-dialog.component.scss']
})
export class AdicionarPrecioDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedPrecioPorSucursal: PrecioPorSucursal;
  precioControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  tipoPrecioControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(null);
  sucursalesControl = new FormControl([], [this.validarSucursalesRequeridas.bind(this)]);
  precioInput = new PrecioPorSucursalInput;
  isEditting = false;
  tipoPrecioList: TipoPrecio[];
  sucursalesList: Sucursal[] = [];
  sucursalesIdList: number[] = [];
  private initialPromociones: PromocionPorSucursal[] = [];
  private presentationPrices: PrecioPorSucursal[] = [];
  private originalPricePromos: PromocionPorSucursal[] = [];
  
  esPromocion = false;
  tipoPromocion: 'DESCUENTO' | 'COMBO' | null = null;
  mostrarSelectorSucursales = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPrecioPorSucursalData,
    private matDialogRef: MatDialogRef<AdicionarPrecioDialogComponent>,
    private precioService: PrecioPorSucursalService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private tipoPrecioService: TipoPrecioService,
    private tiposPromocionService: TiposPromocionService,
    private promocionPorSucursalService: PromocionPorSucursalService,
    private sucursalService: SucursalService,
    private cargandoDialog: CargandoDialogService,
    private mainService: MainService
  ) {}

  validarSucursalesRequeridas(control: FormControl) {
    if (this.esPromocion && this.selectedPrecioPorSucursal?.id == null) {
      if (!control.value || control.value.length === 0) {
        return { sucursalesRequeridas: true };
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.createForm();
    this.tipoPrecioList = []

    const loadTipoPrecios$ = this.tipoPrecioService.onGetAllTipoPrecios();
    const loadSucursales$ = this.sucursalService.onGetAllSucursales(true, true);
    const loadPresentationPrices$ = this.data.presentacion?.id ?
    this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id) :
    of([]);

    forkJoin({
      tiposPrecio: loadTipoPrecios$,
      sucursales: loadSucursales$,
      presentationPrices: loadPresentationPrices$
    }).pipe(
      tap(results => {
        this.tipoPrecioList = (results.tiposPrecio as TipoPrecio[]) ?? [];
        this.presentationPrices = results.presentationPrices as PrecioPorSucursal[];
        this.sucursalesList = [];
        this.sucursalesIdList = [];
        if (results.sucursales) {
          this.sucursalesList = (results.sucursales as Sucursal[]).filter((s) => {
            if (s.id != 0) {
              this.sucursalesIdList.push(s.id);
              return s;
            }
          });
        }
      }),
      switchMap(results => {
        const originalPrice = (results.presentationPrices as PrecioPorSucursal[]).find(p => p.principal);
        if (originalPrice) {
          return this.promocionPorSucursalService.onGetPromocionesPorPrecioId(originalPrice.id);
        }
        return of([]);
      }),
      untilDestroyed(this)
    ).subscribe(originalPricePromos => {
      this.originalPricePromos = originalPricePromos as PromocionPorSucursal[];

      if (this.data?.precio?.id != null) {
          this.selectedPrecioPorSucursal = this.data.precio;
        this.cargarDato();
      } else {
        this.isEditting = true;
      }
    });

    console.log('Dialog opened with data:', this.data);
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("precio", this.precioControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("tipoPrecio", this.tipoPrecioControl);
    this.formGroup.addControl("sucursales", this.sucursalesControl);

    this.principalControl.setValue(false);
    this.activoControl.setValue(true);

    this.tipoPrecioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.onTipoPrecioChange(value);
    });
  }

  onTipoPrecioChange(tipoPrecioId: number) {
    if (!this.tipoPrecioList || this.tipoPrecioList.length === 0) return;

    const selectedTipo = this.tipoPrecioList.find(t => t.id === tipoPrecioId);
    
    if (selectedTipo) {
      this.esPromocion = this.tiposPromocionService.esPromocion(selectedTipo);
      this.tipoPromocion = this.tiposPromocionService.getTipoPromocion(selectedTipo.descripcion);
      this.mostrarSelectorSucursales = this.esPromocion;

      if (this.esPromocion) {
        this.sucursalesControl.updateValueAndValidity();
        this.principalControl.setValue(false);
        this.principalControl.disable();
      } else {
        this.sucursalesControl.setValue([]);
        this.principalControl.enable();
        this.sucursalesControl.updateValueAndValidity();
      }
    }
  }

  onEditar() {
    this.isEditting = true;
    this.formGroup.enable();
    if (this.esPromocion) {
      this.principalControl.disable();
    }
  }

  cargarDato() {
    this.precioControl.setValue(this.selectedPrecioPorSucursal.precio);
    this.principalControl.setValue(this.selectedPrecioPorSucursal.principal);
    this.activoControl.setValue(this.selectedPrecioPorSucursal.activo);
    
    if (this.selectedPrecioPorSucursal.tipoPrecio && this.selectedPrecioPorSucursal.tipoPrecio.id) {
      this.tipoPrecioControl.setValue(this.selectedPrecioPorSucursal.tipoPrecio.id, { emitEvent: false });
      
      this.onTipoPrecioChange(this.selectedPrecioPorSucursal.tipoPrecio.id);

      if (this.esPromocion) {
        this.promocionPorSucursalService.onGetPromocionesPorPrecioId(this.selectedPrecioPorSucursal.id)
          .subscribe((promociones: PromocionPorSucursal[]) => {
            if (promociones) {
              this.initialPromociones = promociones;
              const sucursalIds = promociones.map(p => p.sucursal?.id);
              const sucursalesSeleccionadas = this.sucursalesList.filter(s => sucursalIds.includes(s.id));
              this.sucursalesControl.setValue(sucursalesSeleccionadas);
    }
          });
      }
    }

    this.formGroup.disable();
    this.precioInput.id = this.selectedPrecioPorSucursal.id;

    console.log('Tipo precio cargado:', this.tipoPrecioControl.value);
  }

  onSave() {
    if (!this.formGroup.valid) {
      this.notificacionSnackBar.notification$.next({
        texto: "Por favor complete todos los campos obligatorios",
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.cargandoDialog.openDialog();
    
    if (this.esPromocion) {
      this.guardarPromocion();
    } else {
      this.guardarPrecioRegular();
    }
  }

  private getSucursalesDeseadasIds(): number[] {
    const sucursalesControlValue: (Sucursal | null)[] = this.sucursalesControl.value || [];
    if (sucursalesControlValue.some(s => s === null)) {
      return this.sucursalesIdList;
    } else {
      return sucursalesControlValue.map(s => s.id);
    }
  }

  private guardarPromocion() {
    const sucursalesSeleccionadas: any[] = this.sucursalesControl.value || [];
    
    if (sucursalesSeleccionadas.length === 0 && this.selectedPrecioPorSucursal?.id == null) {
      this.cargandoDialog.closeDialog();
      this.notificacionSnackBar.notification$.next({
        texto: "Debe seleccionar al menos una sucursal para la promoción",
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.precioInput.precio = this.precioControl.value;
    this.precioInput.activo = this.precioInput.id ? this.activoControl.value : false;
    this.precioInput.principal = false;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;
    this.precioInput.sucursalId = this.mainService?.sucursalActual?.id;

    this.precioService.onSave(this.precioInput).pipe(
      tap(precio => console.log('Paso 1: Precio guardado', precio)),
      switchMap(precioGuardado => {
        if (precioGuardado?.id) {
          return this.sincronizarEstadosPromocion(precioGuardado.id).pipe(
            tap(sincronizacion => console.log('Paso 3: Sincronización completada', sincronizacion))
          );
        } else {
          this.notificacionSnackBar.notification$.next({
            texto: "Error al guardar el precio base, no se pudo sincronizar la promoción.",
            color: NotificacionColor.danger,
            duracion: 5
          });
          return of(null);
        }
      }),
      tap(final => console.log('Paso 4: Antes de subscribe', final)),
      untilDestroyed(this)
    ).subscribe({
      next: (resultado) => {
        console.log('Paso 5: Subscribe NEXT. Cerrando diálogo.');
        this.finalizarCreacionPromocion(resultado);
      },
      error: (err) => {
        console.error('Paso 5: Subscribe ERROR. Cerrando diálogo.', err);
        this.cargandoDialog.closeDialog();
        this.notificacionSnackBar.notification$.next({
          texto: "Error al guardar la promoción",
          color: NotificacionColor.danger,
          duracion: 3
        });
      }
    });
  }

  private sincronizarEstadosPromocion(precioId: number): Observable<any> {
    const sucursalesDeseadasIds = this.getSucursalesDeseadasIds()

    return of(this.initialPromociones).pipe(
      tap(promos => console.log('Paso 2: Promociones actuales obtenidas de memoria', promos)),
      switchMap(promocionesActuales => {
        const sucursalesActualesIds = promocionesActuales.map(p => p.sucursal.id);
        
        const sucursalesParaAgregarIds = sucursalesDeseadasIds.filter(id => !sucursalesActualesIds.includes(id));
        const promocionesParaEliminar = promocionesActuales.filter(p => !sucursalesDeseadasIds.includes(p.sucursal.id));
        const sucursalesParaEliminarIds = promocionesParaEliminar.map(p => p.sucursal.id);

        const operaciones: any[] = [];

        if (sucursalesParaAgregarIds.length > 0) {
          const promocionesInput: PromocionPorSucursalInput[] = sucursalesParaAgregarIds.map(sucursalId => ({
            precioId: String(precioId),
            sucursalId: String(sucursalId),
            activo: true,
            esPromocion: true,
            tipoPromocion: this.tipoPromocion
          }));
          operaciones.push(this.promocionPorSucursalService.onSaveBulk(promocionesInput));
        }

        if (promocionesParaEliminar.length > 0) {
          operaciones.push(this.promocionPorSucursalService.onDeleteBulk(promocionesParaEliminar.map(p => p.id)));
        }

        if (this.tipoPromocion === 'DESCUENTO') {
          if (sucursalesParaAgregarIds.length > 0) {
            operaciones.push(this.desactivarPreciosOriginales(sucursalesParaAgregarIds));
          }
          if (sucursalesParaEliminarIds.length > 0) {
            operaciones.push(this.reactivarPreciosOriginales(sucursalesParaEliminarIds));
          }
        }

        if (operaciones.length === 0) {
          console.log('Paso 2.1: No hay operaciones que realizar');
          return of(null);
        }

        console.log('Paso 2.1: Ejecutando forkJoin en ' + operaciones.length + ' operaciones.');
        return forkJoin(operaciones);
      })
    );
  }

  private desactivarPreciosOriginales(sucursalesIds: number[]) {
    return of(this.presentationPrices)
      .pipe(
        switchMap((preciosExistentes: PrecioPorSucursal[]) => {
          const precioOriginal = preciosExistentes.find(p => p.principal && p.activo);
          if (precioOriginal) {
            const desactivacionesInput: PromocionPorSucursalInput[] = sucursalesIds.map(sucursalId => ({
              precioId: String(precioOriginal.id),
              sucursalId: String(sucursalId),
              activo: false,
              esPromocion: false,
              tipoPromocion: null
            }));
            return this.promocionPorSucursalService.onSaveBulk(desactivacionesInput);
          }
          return of(null);
        })
      );
  }

  private reactivarPreciosOriginales(sucursalesIds: number[]) {
    return of(this.presentationPrices).pipe(
      switchMap((preciosExistentes: PrecioPorSucursal[]) => {
        const precioOriginal = preciosExistentes.find(p => p.principal);
        if (precioOriginal) {
          return of(this.originalPricePromos).pipe(
            switchMap(promocionesDeOriginal => {
              const desactivacionesParaEliminar = promocionesDeOriginal
                .filter(p => sucursalesIds.includes(p.sucursal.id) && !p.activo);
              if (desactivacionesParaEliminar.length > 0) {
                return this.promocionPorSucursalService.onDeleteBulk(desactivacionesParaEliminar.map(p => p.id));
              }
              return of(null);
            })
          );
        }
        return of(null);
      })
    );
  }

  private finalizarCreacionPromocion(resultado: any) {
    this.cargandoDialog.closeDialog();
    
    const sucursalesSeleccionadasIds = this.getSucursalesDeseadasIds();
    this.verificarPromociones(sucursalesSeleccionadasIds);
    
    const mensaje = this.tipoPromocion === 'DESCUENTO' 
      ? `Promoción de descuento creada. Se desactivó el precio original en las sucursales seleccionadas.`
      : `Promoción de combo creada. El precio original permanece activo.`;
      
    this.notificacionSnackBar.notification$.next({
      texto: mensaje,
      color: NotificacionColor.success,
      duracion: 5
    });
    
    this.matDialogRef.close(resultado);
  }

  public verificarPromociones(sucursalesSeleccionadas: number[]) {
    console.log('=== VERIFICANDO PROMOCIONES ===');
    console.log('Presentación ID:', this.data.presentacion.id);
    console.log('Sucursales seleccionadas:', sucursalesSeleccionadas);

    this.promocionPorSucursalService.onVerificarPromociones(this.data.presentacion.id, sucursalesSeleccionadas)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (verificacion) => {
          verificacion.promocionesEncontradas.forEach((promocion, index) => {
            console.log(`Promoción ${index + 1}:`, {
              id: promocion.id,
              sucursal: promocion.sucursal?.nombre,
              sucursalId: promocion.sucursal?.id,
              activo: promocion.activo,
              esPromocion: promocion.esPromocion,
              tipoPromocion: promocion.tipoPromocion,
              precio: promocion.precio?.precio
            });
          });

          if (!verificacion.todasLasSucursalesOk) {
            console.warn('⚠️ ALERTA: No todas las sucursales tienen la promoción');
            if (verificacion.faltantes.length > 0) {
              console.warn('Sucursales faltantes:', verificacion.faltantes);
            }
            
            this.notificacionSnackBar.notification$.next({
              texto: `⚠️ Verificación: Faltan ${verificacion.faltantes.length} sucursales. Ver consola para detalles.`,
              color: NotificacionColor.warn,
              duracion: 5
            });
          } else {
            console.log('✅ ÉXITO: Todas las sucursales tienen la promoción');
            
            this.notificacionSnackBar.notification$.next({
              texto: `✅ Verificación OK: Promoción replicada en ${verificacion.promocionesEncontradas.length} sucursales`,
              color: NotificacionColor.success,
              duracion: 3
            });
          }
        },
        error: (error) => {
          console.error('Error al verificar promociones:', error);
          this.notificacionSnackBar.notification$.next({
            texto: "Error al verificar las promociones",
            color: NotificacionColor.danger,
            duracion: 3
          });
        }
      });
  }

  private guardarPrecioRegular() {
    this.precioInput.precio = this.precioControl.value;
    this.precioInput.activo = this.activoControl.value;
    this.precioInput.principal = this.principalControl.value;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;

    if (this.principalControl.value === true) {
      of(this.presentationPrices)
        .pipe(untilDestroyed(this))
        .subscribe((preciosExistentes: PrecioPorSucursal[]) => {
          const updatePromises = [];
          
          if (preciosExistentes && preciosExistentes.length > 0) {
            preciosExistentes.forEach(precio => {
              if (precio.principal && precio.id !== this.precioInput.id) {
                const updateInput = new PrecioPorSucursalInput();
                updateInput.id = precio.id;
                updateInput.precio = precio.precio;
                updateInput.activo = precio.activo;
                updateInput.principal = false;
                updateInput.presentacionId = this.data.presentacion.id;
                updateInput.tipoPrecioId = precio.tipoPrecio?.id;
                updateInput.sucursalId = this.mainService?.sucursalActual?.id;
                updateInput.usuarioId = null;
                
                updatePromises.push(
                  this.precioService.onSave(updateInput, false).pipe(untilDestroyed(this))
                );
              }
            });
          }

          if (updatePromises.length > 0) {
            Promise.all(updatePromises.map(promise => promise.toPromise()))
              .then(() => {
                this.guardarPrecio();
              })
              .catch(error => {
                console.error('Error al actualizar precios principales:', error);
                this.guardarPrecio();
              });
          } else {
            this.guardarPrecio();
          }
        });
    } else {
      this.guardarPrecio();
    }
  }

  private guardarPrecio() {
    this.precioInput.sucursalId = this.mainService?.sucursalActual?.id;
    
    this.precioService.onSave(this.precioInput).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog();
      if (res != null) {
        this.matDialogRef.close(res);
      }
    }, error => {
      this.cargandoDialog.closeDialog();
      this.notificacionSnackBar.notification$.next({
        texto: "Error al guardar el precio",
        color: NotificacionColor.warn,
        duracion: 3
      });
    });
  }

  onCancelar() {
    this.matDialogRef.close()
  }
}
