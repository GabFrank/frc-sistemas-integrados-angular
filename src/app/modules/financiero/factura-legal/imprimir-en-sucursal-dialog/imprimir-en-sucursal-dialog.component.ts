import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { Impresora, TipoImpresora } from '../../../configuracion/impresoras/impresora.model';
import { ImpresoraService } from '../../../configuracion/impresoras/impresora.service';
import { FacturaLegal } from '../factura-legal.model';
import { FacturaLegalService } from '../factura-legal.service';

export interface ImprimirEnSucursalData {
  tipo: TipoImpresora;
  factura: FacturaLegal;
}

interface ImpresoraVista {
  ref: Impresora;
  nombre: string;
  sucursalNombre: string;
}

/**
 * "Imprimir en la sucursal": elige una impresora ya registrada (de cualquier sucursal, vía
 * "Agregar desde sucursal" o alta manual) y manda ahí el ticket o el PDF de la factura, sin pasar
 * por Reimprimir/Descargar PDF (aditivo, no los reemplaza).
 */
@UntilDestroy()
@Component({
  selector: 'app-imprimir-en-sucursal-dialog',
  templateUrl: './imprimir-en-sucursal-dialog.component.html',
  styleUrls: ['./imprimir-en-sucursal-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprimirEnSucursalDialogComponent implements OnInit {

  private impresoraService = inject(ImpresoraService);
  private facturaLegalService = inject(FacturaLegalService);
  private notificacion = inject(NotificacionSnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<ImprimirEnSucursalDialogComponent>);

  impresoras: ImpresoraVista[] = [];
  seleccionadaId: number = null;
  cargando = false;
  enviando = false;
  titulo: string;
  esPdf: boolean;

  // Vista previa del PDF antes de mandarlo a imprimir (no aplica al ticket térmico).
  pdfBase64: string = null;
  cargandoPdf = false;
  errorPdf = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ImprimirEnSucursalData) {
    this.esPdf = data.tipo === 'NORMAL';
    this.titulo = this.esPdf ? 'Imprimir PDF en sucursal' : 'Imprimir ticket en sucursal';
  }

  ngOnInit(): void {
    this.cargarImpresoras();
    if (this.esPdf) {
      this.cargarVistaPrevia();
    }
  }

  private cargarImpresoras(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.impresoraService.buscarConPagina('', 0, 100, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.impresoras = (res?.content ?? [])
            .filter((i) => i.tipo === this.data.tipo && i.activo)
            .map((i) => ({
              ref: i,
              nombre: i.nombre,
              sucursalNombre: i.sucursal ? `${i.sucursal.id} - ${i.sucursal.nombre}` : 'Sin sucursal',
            }));
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.impresoras = [];
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Trae el mismo PDF que "Abrir PDF", para que se pueda revisar antes de mandarlo a imprimir. */
  private cargarVistaPrevia(): void {
    const sucId = this.data.factura.sucursalId ?? this.data.factura.sucursal?.id;
    this.cargandoPdf = true;
    this.errorPdf = false;
    this.cdr.markForCheck();
    this.facturaLegalService.onDescargarPdfFacturaElectronica(this.data.factura.id, sucId, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (base64) => {
          this.pdfBase64 = base64 || null;
          this.errorPdf = !base64;
          this.cargandoPdf = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pdfBase64 = null;
          this.errorPdf = true;
          this.cargandoPdf = false;
          this.cdr.markForCheck();
        },
      });
  }

  elegir(imp: ImpresoraVista): void {
    this.seleccionadaId = imp.ref.id;
    this.cdr.markForCheck();
  }

  confirmar(): void {
    if (!this.seleccionadaId) { return; }
    const facturaId = this.data.factura.id;
    const sucId = this.data.factura.sucursalId ?? this.data.factura.sucursal?.id;
    this.enviando = true;
    this.cdr.markForCheck();

    const obs = this.data.tipo === 'TERMICA'
      ? this.facturaLegalService.onImprimirTicketFacturaEnImpresora(facturaId, sucId, this.seleccionadaId)
      : this.facturaLegalService.onImprimirPdfFacturaEnImpresora(facturaId, sucId, this.seleccionadaId);

    obs.pipe(untilDestroyed(this)).subscribe({
      next: (ok) => {
        this.enviando = false;
        if (ok) {
          this.notificacion.notification$.next({
            texto: 'Impresión enviada a la sucursal.',
            color: NotificacionColor.success,
            duracion: 3,
          });
          this.dialogRef.close(true);
          return;
        }
        this.notificacion.notification$.next({
          texto: 'No se pudo imprimir: verificá que la sucursal esté online y la impresora exista.',
          color: NotificacionColor.warn,
          duracion: 5,
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.enviando = false;
        this.notificacion.notification$.next({
          texto: 'No se pudo imprimir en la sucursal.',
          color: NotificacionColor.warn,
          duracion: 5,
        });
        this.cdr.markForCheck();
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
