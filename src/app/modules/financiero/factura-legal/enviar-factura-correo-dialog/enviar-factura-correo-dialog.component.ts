import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { FacturaLegal } from '../factura-legal.model';
import { FacturaLegalService } from '../factura-legal.service';

export interface EnviarFacturaCorreoData {
  factura: FacturaLegal;
}

/** Mismo criterio que el central (FacturaCorreoService): si pasa acá, pasa allá. */
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/**
 * Envío manual de una factura por correo. Propone el correo que el cliente tiene guardado, pero
 * se puede escribir otro: sirve también para un cliente sin correo o una factura sin cliente.
 */
@UntilDestroy()
@Component({
  selector: 'app-enviar-factura-correo-dialog',
  templateUrl: './enviar-factura-correo-dialog.component.html',
  styleUrls: ['./enviar-factura-correo-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnviarFacturaCorreoDialogComponent implements OnInit {

  private facturaLegalService = inject(FacturaLegalService);
  private notificacion = inject(NotificacionSnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<EnviarFacturaCorreoDialogComponent>);

  emailControl = new FormControl<string>('', [Validators.required, Validators.pattern(EMAIL)]);
  emailValido = false;
  enviando = false;
  clienteNombre: string;
  sinCorreoGuardado: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EnviarFacturaCorreoData) {
    const guardado = (data.factura?.cliente?.persona?.email ?? '').trim().toLowerCase();
    this.clienteNombre = data.factura?.nombre || data.factura?.cliente?.persona?.nombre || 'SIN NOMBRE';
    this.sinCorreoGuardado = !EMAIL.test(guardado);
    this.emailControl.setValue(this.sinCorreoGuardado ? '' : guardado);
    this.emailValido = this.emailControl.valid;
  }

  ngOnInit(): void {
    this.emailControl.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.emailValido = this.emailControl.valid;
      this.cdr.markForCheck();
    });
  }

  enviar(): void {
    if (this.enviando || !this.emailControl.valid) { return; }
    const sucId = this.data.factura.sucursalId ?? this.data.factura.sucursal?.id;
    const email = this.emailControl.value.trim().toLowerCase();
    this.enviando = true;
    this.cdr.markForCheck();

    // Si falla, onCustomMutation ya muestra el motivo que devuelve el central.
    this.facturaLegalService.onEnviarFacturaPorCorreo(this.data.factura.id, sucId, email)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.notificacion.notification$.next({
            texto: `Factura enviada a ${email}`,
            color: NotificacionColor.success,
            duracion: 3,
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.enviando = false;
          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
