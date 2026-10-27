import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfiguracionService, UpdateChannel } from '../../services/configuracion.service';
import { electronBridge, ElectronBridge } from '../../../commons/core/electron/electron-bridge';

@Component({
  selector: 'app-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss']
})
export class UpdateDialogComponent implements OnInit, OnDestroy {
  currentVersion: string = '';
  currentChannel: UpdateChannel = null;
  autoUpdateEnabled: boolean = true;
  checkingForUpdate: boolean = false;
  updateStatus: string = '';

  private ipcRenderer: ElectronBridge | null = electronBridge();
  private dejarDeEscucharEstado: (() => void) | null = null;

  constructor(
    private dialogRef: MatDialogRef<UpdateDialogComponent>,
    private configService: ConfiguracionService
  ) {
  }

  ngOnInit(): void {
    // Get current version from Electron
    if (this.ipcRenderer) {
      this.currentVersion = this.ipcRenderer.sendSync('get-app-version');
    }

    // Get current channel from config
    const config = this.configService.getConfig();
    this.currentChannel = config.updateChannel;
    this.autoUpdateEnabled = config.updateChannel !== 'dev' && config.updateChannel !== null;

    // Listen for update events from main process
    if (this.ipcRenderer) {
      this.dejarDeEscucharEstado = this.ipcRenderer.on('update-status', this.onUpdateStatus);
    }
  }

  ngOnDestroy(): void {
    this.dejarDeEscucharEstado?.();
  }

  private onUpdateStatus = (status: string) => {
    this.checkingForUpdate = false;
    this.updateStatus = status;
  }

  checkForUpdate(): void {
    if (!this.ipcRenderer) return;
    this.checkingForUpdate = true;
    this.updateStatus = '';
    this.ipcRenderer.send('check-for-update-manual');
  }

  onChannelChange(channel: UpdateChannel): void {
    this.currentChannel = channel;
    this.autoUpdateEnabled = channel !== 'dev' && channel !== null;
    this.configService.updateConfig({ updateChannel: channel });
  }

  getChannelLabel(): string {
    switch (this.currentChannel) {
      case 'stable': return 'Estable (Produccion)';
      case 'beta': return 'Beta (Pre-produccion)';
      case 'alpha': return 'Alpha (Desarrollo)';
      case 'dev': return 'Desarrollo (Sin actualizaciones)';
      default: return 'No configurado';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
