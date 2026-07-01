import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { GestionComprasComponent } from '../gestion-compras/gestion-compras.component';
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoData,
  PdvSearchProductoResponseData,
} from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import {
  CrearProductoRapidoComponent,
  CrearProductoRapidoData,
  CrearProductoRapidoResult,
} from './crear-producto-rapido/crear-producto-rapido.component';
import {
  EditProveedorComponent,
  EditProveedorData,
  EditProveedorResult,
} from '../../../personas/proveedor/edit-proveedor/edit-proveedor.component';

import { FacturaImportService } from './factura-import.service';
import {
  ArchivoImportInput,
  ConfirmarFacturaImportItemInput,
  ESTADO_IMPORT,
  FacturaImportPreview,
  ProveedorLite,
} from './factura-import.model';

@UntilDestroy()
@Component({
  selector: 'app-importar-factura',
  templateUrl: './importar-factura.component.html',
  styleUrls: ['./importar-factura.component.scss'],
})
export class ImportarFacturaComponent implements OnInit {
  @Input() data: Tab;

  paso: 'subir' | 'revisar' = 'subir';

  // --- paso subir ---
  archivosSeleccionados: File[] = [];
  procesando = false;

  // --- paso revisar ---
  importId: number = null;
  preview: FacturaImportPreview = null;
  itemsArray: FormArray;
  proveedorSeleccionado: ProveedorLite = null;
  proveedorConfianza: string = null;

  // totales vivos (recalculados al togglear omitir)
  sumaItemsActual = 0;
  cuadraActual: boolean = null;

  displayedColumns = [
    'confianza',
    'textoOcr',
    'producto',
    'cantidad',
    'precioUnitario',
    'descuento',
    'totalItem',
    'omitir',
  ];

  ESTADO = ESTADO_IMPORT;
  private currencyMask = new CurrencyMask();

  constructor(
    private fb: FormBuilder,
    private matDialog: MatDialog,
    private notif: NotificacionSnackbarService,
    private mainService: MainService,
    private tabService: TabService,
    private proveedorService: ProveedorService,
    private importService: FacturaImportService,
  ) {}

  ngOnInit(): void {
    this.itemsArray = this.fb.array([]);
    const id = this.data?.tabData?.id || this.data?.tabData?.data?.id;
    if (id) {
      this.importId = id;
      this.paso = 'revisar';
      this.cargarPreview();
    }
  }

  // =================== PASO SUBIR ===================

  onArchivosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.archivosSeleccionados = Array.from(input.files);
    // permitir re-seleccionar el mismo archivo
    input.value = '';
  }

  quitarArchivo(index: number): void {
    this.archivosSeleccionados.splice(index, 1);
  }

  async importar(): Promise<void> {
    if (this.archivosSeleccionados.length === 0) {
      this.notif.openWarn('Seleccioná al menos un archivo');
      return;
    }
    this.procesando = true;
    try {
      const archivos: ArchivoImportInput[] = [];
      for (const file of this.archivosSeleccionados) {
        const archivoBase64 = await this.leerBase64(file);
        archivos.push({
          archivoBase64,
          nombreArchivo: file.name,
          mimeType: file.type || this.inferirMime(file.name),
        });
      }
      const usuarioId = this.mainService.usuarioActual?.id;
      this.importService
        .importar(archivos, usuarioId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (imp) => {
            this.procesando = false;
            if (!imp) {
              this.notif.openAlgoSalioMal();
              return;
            }
            if (imp.estado === ESTADO_IMPORT.ERROR) {
              this.notif.openWarn(imp.errorMensaje || 'No se pudo procesar la factura');
              return;
            }
            this.importId = imp.id;
            this.paso = 'revisar';
            this.cargarPreview();
          },
          error: () => {
            this.procesando = false;
            this.notif.openAlgoSalioMal('Error al procesar la factura');
          },
        });
    } catch (e) {
      this.procesando = false;
      this.notif.openWarn('Error leyendo el archivo: ' + (e as Error).message);
    }
  }

  private leerBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }

  private inferirMime(nombre: string): string {
    const n = (nombre || '').toLowerCase();
    if (n.endsWith('.xml')) return 'application/xml';
    if (n.endsWith('.pdf')) return 'application/pdf';
    if (n.endsWith('.png')) return 'image/png';
    return 'image/jpeg';
  }

  // =================== PASO REVISAR ===================

  private cargarPreview(): void {
    this.importService
      .preview(this.importId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (p) => {
          if (!p) {
            this.notif.openWarn('No se pudo cargar el preview');
            return;
          }
          this.preview = p;
          this.proveedorSeleccionado = p.proveedorSugerido || null;
          this.proveedorConfianza = p.proveedorConfianza || null;
          this.buildItems(p);
        },
        error: () => this.notif.openAlgoSalioMal('Error al cargar el preview'),
      });
  }

  private buildItems(p: FacturaImportPreview): void {
    this.itemsArray = this.fb.array([]);
    (p.items || []).forEach((it) => {
      this.itemsArray.push(
        this.fb.group({
          textoOcr: new FormControl(it.textoOcr ?? null),
          codigoOcr: new FormControl(it.codigoOcr ?? null),
          productoId: new FormControl(it.productoSugerido?.id ?? null),
          productoDescripcion: new FormControl(it.productoSugerido?.descripcion ?? null),
          presentacionId: new FormControl(null),
          cantidad: new FormControl(it.cantidad ?? null),
          precioUnitario: new FormControl(it.precioUnitario ?? null),
          descuento: new FormControl(it.descuento ?? 0),
          totalItem: new FormControl(it.totalItem ?? null),
          omitir: new FormControl(false),
          productoConfianza: new FormControl(it.productoConfianza ?? null),
          productoRazon: new FormControl(it.productoRazon ?? null),
        }),
      );
    });
    this.itemsArray.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recomputeTotales());
    this.recomputeTotales();
  }

  getCtrl(index: number, field: string): FormControl {
    return this.itemsArray.at(index)?.get(field) as FormControl;
  }

  buscarProducto(index: number): void {
    const textoOcr = this.getCtrl(index, 'textoOcr')?.value || '';
    const dialogData: PdvSearchProductoData = {
      texto: (textoOcr || '').toUpperCase(),
      mostrarStock: false,
      costo: true,
      servidor: true,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, { data: dialogData, width: '100%', height: '90%' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        if (res && res.producto) {
          this.getCtrl(index, 'productoId').setValue(res.producto.id);
          this.getCtrl(index, 'productoDescripcion').setValue(res.producto.descripcion);
          this.getCtrl(index, 'presentacionId').setValue(res.presentacion?.id ?? null);
          this.getCtrl(index, 'productoConfianza').setValue('MANUAL');
          this.getCtrl(index, 'productoRazon').setValue('Seleccionado manualmente');
        }
      });
  }

  /** Abre el alta rápida de producto precargada con los datos de la línea de factura. */
  crearProducto(index: number): void {
    const item = this.preview?.items ? this.preview.items[index] : null;
    const data: CrearProductoRapidoData = {
      prefill: {
        descripcion: this.getCtrl(index, 'textoOcr')?.value || item?.textoOcr,
        codigoBarras: item?.codigoBarras,
        iva: item?.iva,
        unidadMedida: item?.unidadMedida,
        precioCosto: this.getCtrl(index, 'precioUnitario')?.value ?? item?.precioUnitario,
        esGuarani: this.esGuarani,
      },
    };
    this.matDialog
      .open(CrearProductoRapidoComponent, { width: '640px', data })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: CrearProductoRapidoResult) => {
        if (res && res.saved && res.producto) {
          this.getCtrl(index, 'productoId').setValue(res.producto.id);
          this.getCtrl(index, 'productoDescripcion').setValue(res.producto.descripcion);
          this.getCtrl(index, 'presentacionId').setValue(res.presentacion?.id ?? null);
          this.getCtrl(index, 'productoConfianza').setValue('MANUAL');
          this.getCtrl(index, 'productoRazon').setValue('Creado desde la factura');
        }
      });
  }

  limpiarProducto(index: number): void {
    this.getCtrl(index, 'productoId').setValue(null);
    this.getCtrl(index, 'productoDescripcion').setValue(null);
    this.getCtrl(index, 'presentacionId').setValue(null);
    this.getCtrl(index, 'productoConfianza').setValue(null);
  }

  buscarProveedor(): void {
    const texto = this.preview?.emisorNombre || this.preview?.emisorRuc || '';
    this.proveedorService
      .onSearchProveedorPorTexto(texto)
      .pipe(untilDestroyed(this))
      .subscribe((prov: any) => {
        if (prov) {
          this.proveedorSeleccionado = { id: prov.id, persona: prov.persona };
          this.proveedorConfianza = 'MANUAL';
        }
      });
  }

  /** Abre el alta de proveedor precargada con los datos del emisor de la factura. */
  crearProveedor(): void {
    const p = this.preview;
    if (!p) return;
    // El catalogo guarda el RUC sin el digito verificador -> se descarta el "-D".
    const documento = (p.emisorRuc || '').split('-')[0];
    const data: EditProveedorData = {
      prefill: {
        nombre: p.emisorNombre,
        apodo: p.emisorNombreFantasia,
        documento,
        telefono: p.emisorTelefono,
        direccion: p.emisorDireccion,
        email: p.emisorEmail,
      },
    };
    this.matDialog
      .open(EditProveedorComponent, { width: '600px', data })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: EditProveedorResult) => {
        if (result?.saved && result.proveedor) {
          this.proveedorSeleccionado = {
            id: result.proveedor.id,
            persona: result.proveedor.persona,
          };
          this.proveedorConfianza = 'MANUAL';
        }
      });
  }

  private recomputeTotales(): void {
    let suma = 0;
    let hay = false;
    for (const ctrl of this.itemsArray.controls) {
      const g = ctrl as FormGroup;
      if (g.get('omitir').value) continue;
      const total = Number(g.get('totalItem').value);
      if (!isNaN(total)) {
        suma += total;
        hay = true;
      }
    }
    this.sumaItemsActual = suma;
    const totalGeneral = this.preview?.totalGeneral;
    if (totalGeneral == null || !hay) {
      this.cuadraActual = null;
    } else {
      const tolerancia = Math.max(1, Math.abs(totalGeneral) * 0.01);
      this.cuadraActual = Math.abs(totalGeneral - suma) <= tolerancia;
    }
  }

  get itemsIncluidos(): number {
    let c = 0;
    for (const ctrl of this.itemsArray.controls) {
      const g = ctrl as FormGroup;
      if (!g.get('omitir').value && g.get('productoId').value) c++;
    }
    return c;
  }

  get itemsSinProducto(): number {
    let c = 0;
    for (const ctrl of this.itemsArray.controls) {
      const g = ctrl as FormGroup;
      if (!g.get('omitir').value && !g.get('productoId').value) c++;
    }
    return c;
  }

  /** true si la moneda de la factura es Guaraní (PYG) -> sin decimales. */
  get esGuarani(): boolean {
    const m = (this.preview?.moneda || '').toUpperCase();
    return m === 'PYG' || m === 'GS' || m.includes('GUARAN');
  }

  /** Formato del pipe number segun moneda: Guaraní 3.500 ; otras 3.500,00 (locale es-PY). */
  get formatoMoneda(): string {
    return this.esGuarani ? '1.0-0' : '1.2-2';
  }

  /** Opciones de currencyMask segun moneda (mismo patron que gestion-compras). */
  get opcionesMoneda() {
    return this.esGuarani
      ? this.currencyMask.currencyOptionsGuarani
      : this.currencyMask.currencyOptionsNoGuarani;
  }

  /** El pedido no se puede confirmar sin proveedor o sin al menos un item con producto. */
  get puedeConfirmar(): boolean {
    return !!this.proveedorSeleccionado?.id && this.itemsIncluidos > 0;
  }

  confirmar(): void {
    if (!this.proveedorSeleccionado?.id) {
      this.notif.openWarn('Seleccioná el proveedor antes de confirmar');
      return;
    }
    if (this.itemsIncluidos === 0) {
      this.notif.openWarn('No hay ítems con producto asignado para crear el pedido');
      return;
    }
    if (this.itemsSinProducto > 0) {
      this.notif.openWarn(
        `${this.itemsSinProducto} ítem(s) sin producto no se incluirán en el pedido`,
      );
    }

    const items: ConfirmarFacturaImportItemInput[] = this.itemsArray.controls.map((ctrl) => {
      const g = ctrl as FormGroup;
      return {
        textoOcr: g.get('textoOcr').value,
        codigoOcr: g.get('codigoOcr').value,
        productoId: g.get('productoId').value,
        presentacionId: g.get('presentacionId').value,
        cantidad: this.toNumber(g.get('cantidad').value),
        precioUnitario: this.toNumber(g.get('precioUnitario').value),
        descuento: this.toNumber(g.get('descuento').value),
        omitir: !!g.get('omitir').value,
      };
    });

    this.importService
      .confirmar({
        importId: this.importId,
        proveedorId: this.proveedorSeleccionado.id,
        items,
        tipoBoleta: null,
        crearPedido: true,
        usuarioId: this.mainService.usuarioActual?.id,
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (!res) {
            this.notif.openAlgoSalioMal();
            return;
          }
          this.notif.openSucess(
            res.pedidoId ? `Pedido #${res.pedidoId} creado` : 'Importación confirmada',
          );
          if (res.pedidoId) {
            this.abrirPedido(res.pedidoId);
          }
        },
        error: () => this.notif.openAlgoSalioMal('Error al confirmar la importación'),
      });
  }

  private abrirPedido(pedidoId: number): void {
    this.tabService.addTab(
      new Tab(
        GestionComprasComponent,
        'Pedido ' + pedidoId,
        new TabData(pedidoId),
        ImportarFacturaComponent,
      ),
    );
  }

  private toNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  volverASubir(): void {
    this.paso = 'subir';
    this.archivosSeleccionados = [];
    this.preview = null;
    this.importId = null;
    this.proveedorSeleccionado = null;
    this.proveedorConfianza = null;
    this.itemsArray = this.fb.array([]);
  }

  trackByIndex(index: number): number {
    return index;
  }

  // helpers para template (clases de chip por confianza)
  confianzaClass(c: string): string {
    if (c === 'HIGH') return 'success';
    if (c === 'MEDIUM') return 'warn';
    if (c === 'MANUAL') return 'info';
    return 'danger';
  }
}
