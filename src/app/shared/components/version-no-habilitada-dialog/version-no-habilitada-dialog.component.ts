import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { electronBridge, ElectronBridge } from '../../../commons/core/electron/electron-bridge';
import { MainService } from '../../../main.service';

export interface VersionNoHabilitadaData {
  versionActual: string;
  versionMinima: string;
}

/**
 * Bloqueo por versión mínima (`versionMinimaDesktop` del central). Se abre con `disableClose`: la
 * única salida es actualizar o cerrar la sesión.
 *
 * «Buscar actualización» usa el mismo canal que el diálogo de actualizaciones
 * (`check-for-update-manual`): si hay versión nueva, el proceso principal la descarga y pide
 * reiniciar con su propio diálogo. Fuera de Electron no hay actualización posible: solo se puede
 * cerrar la sesión.
 */
@Component({
  selector: 'app-version-no-habilitada-dialog',
  templateUrl: './version-no-habilitada-dialog.component.html',
  styleUrls: ['./version-no-habilitada-dialog.component.scss']
})
export class VersionNoHabilitadaDialogComponent implements OnInit, OnDestroy {

  readonly mensaje = 'Esta versión del sistema ya no está habilitada. Actualizá la aplicación para continuar.';

  puedeActualizar = false;
  buscando = false;
  estado = '';

  private bridge: ElectronBridge | null = electronBridge();
  private dejarDeEscuchar: (() => void) | null = null;

  constructor(
    private dialogRef: MatDialogRef<VersionNoHabilitadaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VersionNoHabilitadaData,
    private mainService: MainService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.puedeActualizar = !!this.bridge;
    if (this.bridge) {
      // El IPC llega fuera de la zona de Angular: sin `run` el texto no se pinta.
      this.dejarDeEscuchar = this.bridge.on('update-status', (status: string) =>
        this.zone.run(() => {
          this.buscando = false;
          this.estado = status;
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.dejarDeEscuchar?.();
  }

  onBuscarActualizacion(): void {
    if (!this.bridge || this.buscando) return;
    this.buscando = true;
    this.estado = 'Buscando actualización. Si hay una versión nueva se descarga sola y el sistema pide reiniciar.';
    this.bridge.send('check-for-update-manual');
  }

  onCerrarSesion(): void {
    this.mainService.logout();
    this.dialogRef.close();
  }
}
