import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, interval, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PdvCaja } from '../../../pdv/caja/caja.model';
import { QrCodeComponent } from '../../../../../shared/qr-code/qr-code.component';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { FuncionarioService } from '../../../../personas/funcionarios/funcionario.service';

export class RetiroPreGastoData {
  caja: PdvCaja;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-retiro-pre-gasto-dialog',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './retiro-pre-gasto-dialog.component.html',
  styleUrls: ['./retiro-pre-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetiroPreGastoDialogComponent implements OnInit, OnDestroy {
  solicitudes: PreGasto[] = [];
  seleccionada: PreGasto | null = null;
  cargandoLista = false;
  cargandoQr = false;
  cargandoRetiro = false;
  codigoQr = '';
  funcionarioConfirmo = false;
  private pollSub: Subscription | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RetiroPreGastoData,
    private dialogRef: MatDialogRef<RetiroPreGastoDialogComponent>,
    private gastoService: GastoService,
    private funcionarioService: FuncionarioService,
    private matDialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  cargarSolicitudes(): void {
    const sucursalCajaId = this.data?.caja?.sucursal?.id ?? this.data?.caja?.sucursalId;
    if (!sucursalCajaId) {
      return;
    }
    this.cargandoLista = true;
    this.gastoService.preGastosParaRetiro(sucursalCajaId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (lista) => {
          this.solicitudes = lista ?? [];
          this.cargandoLista = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoLista = false;
          this.notificacion.openAlgoSalioMal('No se pudieron cargar las solicitudes autorizadas.');
          this.cdr.markForCheck();
        },
      });
  }

  seleccionarSolicitud(item: PreGasto): void {
    this.seleccionada = item;
    this.funcionarioConfirmo = !!item.retiroConfirmadoEn;
    this.codigoQr = '';
    this.detenerPolling();
    this.cdr.markForCheck();
  }

  mostrarQrRetiro(): void {
    if (!this.seleccionada?.id || !this.seleccionada?.sucursalId) {
      return;
    }
    this.cargandoQr = true;
    this.gastoService.qrRetiroPreGasto(this.seleccionada.id, this.seleccionada.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (payload) => {
          this.cargandoQr = false;
          if (!payload?.codigoQr) {
            this.notificacion.openWarn('No se pudo generar el código QR.');
            this.cdr.markForCheck();
            return;
          }
          this.codigoQr = payload.codigoQr;
          this.matDialog.open(QrCodeComponent, {
            data: { nombre: `Solicitud #${this.seleccionada.id}`, textoCustom: payload.codigoQr },
            width: '360px',
          });
          this.iniciarPolling();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoQr = false;
          this.notificacion.openAlgoSalioMal('Error al generar QR de retiro.');
          this.cdr.markForCheck();
        },
      });
  }

  ejecutarRetiro(): void {
    if (!this.seleccionada || !this.funcionarioConfirmo) {
      this.notificacion.openWarn('El funcionario debe escanear el QR desde su celular primero.');
      return;
    }
    const caja = this.data.caja;
    const sucursalCajaId = caja?.sucursal?.id ?? caja?.sucursalId;
    if (!caja?.id || !sucursalCajaId) {
      this.notificacion.openWarn('No se pudo determinar la caja activa.');
      return;
    }
    this.cargandoRetiro = true;
    const personaResponsableId = this.seleccionada.funcionario?.id;
    const personaAutorizadorId = this.seleccionada.autorizadoPor?.id;
    if (!personaResponsableId) {
      this.cargandoRetiro = false;
      this.notificacion.openWarn('No se pudo determinar el funcionario responsable.');
      this.cdr.markForCheck();
      return;
    }
    forkJoin({
      responsable: this.funcionarioService.onGetFuncionarioPorPersona(personaResponsableId, true),
      autorizado: personaAutorizadorId
        ? this.funcionarioService.onGetFuncionarioPorPersona(personaAutorizadorId, true)
        : of(null),
    }).pipe(
      switchMap(({ responsable, autorizado }) => {
        if (!responsable?.id) {
          throw new Error('No se encontró el funcionario responsable.');
        }
        return this.gastoService.registrarRetiroPreGastoHibrido(
          this.seleccionada!,
          caja,
          responsable,
          autorizado,
          this.mainService.usuarioActual?.id
        );
      }),
      untilDestroyed(this)
    ).subscribe({
      next: (res) => {
        this.cargandoRetiro = false;
        if (res) {
          this.notificacion.openSucess('Retiro registrado en caja correctamente.');
          this.dialogRef.close(res);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoRetiro = false;
        this.notificacion.openAlgoSalioMal('No se pudo registrar el retiro en caja.');
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  formatMonto(value: number | null | undefined): string {
    const monto = Number(value ?? 0);
    return monto.toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private iniciarPolling(): void {
    if (!this.seleccionada) {
      return;
    }
    this.detenerPolling();
    this.pollSub = interval(2500)
      .pipe(
        switchMap(() => this.gastoService.preGastoPorId(this.seleccionada!.id, this.seleccionada!.sucursalId)),
        untilDestroyed(this)
      )
      .subscribe({
        next: (actualizado) => {
          if (!actualizado) {
            return;
          }
          this.funcionarioConfirmo = !!actualizado.retiroConfirmadoEn;
          if (this.seleccionada) {
            this.seleccionada = { ...this.seleccionada, ...actualizado };
          }
          this.cdr.markForCheck();
        },
      });
  }

  private detenerPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }
}
