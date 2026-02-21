import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPagoInput, SolicitudPagoEstado } from '../../compra/gestion-compras/solicitud-pago.model';
import { NotaRecepcion } from '../../compra/gestion-compras/nota-recepcion.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { FormaPagoService } from '../../../financiero/forma-pago/forma-pago.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { AdicionarNotaDialogComponent } from '../adicionar-nota-dialog/adicionar-nota-dialog.component';

@Component({
  selector: 'app-create-edit-solicitud-pago-dialog',
  templateUrl: './create-edit-solicitud-pago-dialog.component.html',
  styleUrls: ['./create-edit-solicitud-pago-dialog.component.scss']
})
export class CreateEditSolicitudPagoDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('proveedorInput') proveedorInput: ElementRef<HTMLInputElement>;

  form: FormGroup;
  selectedProveedor: Proveedor;
  monedaList: Moneda[] = [];
  formaPagoList: FormaPago[] = [];
  /** Notas con display de proveedor para la tabla (sin usar funciones en template). */
  notasAgregadas: (NotaRecepcion & { proveedorNombreDisplay?: string })[] = [];

  proveedorNombreDisplay = '';
  montoTotalComputed = 0;
  saving = false;

  displayedColumnsNotas: string[] = ['proveedor', 'numero', 'fecha', 'valorTotal', 'quitar'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditSolicitudPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedorId?: number },
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private dialog: MatDialog,
    private proveedorService: ProveedorService,
    private mainService: MainService
  ) {
    this.form = this.fb.group({
      monedaId: [null, Validators.required],
      formaPagoId: [null, Validators.required],
      fechaPagoPropuesta: [null],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    if (this.data?.proveedorId) {
      this.selectedProveedor = { id: this.data.proveedorId, persona: { nombre: '' } } as Proveedor;
      this.proveedorNombreDisplay = 'Proveedor preseleccionado';
    }
    this.loadMonedas();
    this.loadFormasPago();
  }

  ngAfterViewInit(): void {
    if (!this.data?.proveedorId) {
      setTimeout(() => this.proveedorInput?.nativeElement?.focus(), 0);
    }
  }

  private loadMonedas(): void {
    this.monedaService.onGetAll().subscribe((list) => {
      this.monedaList = list || [];
    });
  }

  private loadFormasPago(): void {
    this.formaPagoService.onGetAllFormaPago(true).subscribe((list) => {
      this.formaPagoList = list || [];
    });
  }

  onProveedorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' || event.key === 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const char = this.getPrintableKey(event);
    this.onBuscarProveedor(char);
  }

  private getPrintableKey(event: KeyboardEvent): string {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return '';
    }
    if (event.key?.length === 1) {
      return event.key;
    }
    return '';
  }

  onBuscarProveedor(initialTexto?: string): void {
    const texto = initialTexto != null ? initialTexto : (this.proveedorNombreDisplay || '');
    this.proveedorService
      .onSearchProveedorPorTexto(texto)
      .subscribe((proveedor: Proveedor) => {
        if (proveedor) {
          this.selectedProveedor = proveedor;
          this.proveedorNombreDisplay = (proveedor?.persona?.nombre || '').toString().toUpperCase();
        }
      });
  }

  onAgregarNota(): void {
    if (!this.selectedProveedor?.id) {
      this.notificacionService.openWarn('Seleccione un proveedor');
      return;
    }
    const ref = this.dialog.open(AdicionarNotaDialogComponent, {
      width: '50vw',
      data: {
        proveedorId: this.selectedProveedor.id,
        notasYaAgregadasIds: this.notasAgregadas.map((n) => n.id)
      }
    });
    ref.afterClosed().subscribe((notas: NotaRecepcion[] | null) => {
      if (notas?.length) {
        const idsAgregados = new Set(this.notasAgregadas.map((n) => n.id));
        notas.forEach((nota) => {
          if (!idsAgregados.has(nota.id)) {
            const display = (nota?.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
            const notaWithDisplay = nota as NotaRecepcion & { proveedorNombreDisplay?: string };
            notaWithDisplay.proveedorNombreDisplay = display;
            this.notasAgregadas.push(notaWithDisplay);
            idsAgregados.add(nota.id);
          }
        });
        this.updateMontoTotal();
      }
    });
  }

  onQuitarNota(index: number): void {
    this.notasAgregadas.splice(index, 1);
    this.updateMontoTotal();
  }

  private updateMontoTotal(): void {
    this.montoTotalComputed = this.notasAgregadas.reduce(
      (sum, n) => sum + (n.valorTotal ?? (n as any).valor ?? 0),
      0
    );
  }

  onGuardar(): void {
    if (!this.selectedProveedor?.id) {
      this.notificacionService.openWarn('Seleccione un proveedor');
      return;
    }
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.notasAgregadas.length) {
      this.notificacionService.openWarn('Agregue al menos una nota de recepción');
      return;
    }

    const input: SolicitudPagoInput = {
      proveedorId: this.selectedProveedor.id,
      montoTotal: this.montoTotalComputed,
      monedaId: this.form.get('monedaId').value,
      formaPagoId: this.form.get('formaPagoId').value,
      estado: SolicitudPagoEstado.PENDIENTE,
      notaRecepcionIds: this.notasAgregadas.map((n) => n.id),
      observaciones: (this.form.get('observaciones').value || '').toString().trim().toUpperCase() || undefined,
      usuarioId: this.mainService?.usuarioActual?.id
    };
    const fp = this.form.get('fechaPagoPropuesta').value;
    if (fp) {
      const d = fp instanceof Date ? fp : new Date(fp);
      if (!isNaN(d.getTime())) {
        input.fechaPagoPropuesta = dateToString(d);
      }
    }

    this.saving = true;
    this.solicitudPagoService.onSaveInput(input).subscribe({
      next: () => {
        this.notificacionService.openSucess('Solicitud de pago creada');
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }
}
