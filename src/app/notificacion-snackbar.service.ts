import { Injectable } from '@angular/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

export interface NotificacionSnackbarData {
  texto: string;
  color: NotificacionColor;
  duracion?: number;
}

export enum NotificacionColor {
  success = 'success',
  warn = 'warn',
  danger = 'danger',
  info = 'info',
  neutral = 'neutral'
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionSnackbarService {

  public notification$: Subject<NotificacionSnackbarData> = new Subject<NotificacionSnackbarData>();

  constructor() { }

  openGuardadoConExito(){
    this.notification$.next({
      texto: "Guardado con éxito",
      color: NotificacionColor.success,
      duracion: 2
    });
  }

  openAlgoSalioMal(texto?){
    this.notification$.next({
      texto: `Ups! Algo salió mal. ${texto}`,
      color: NotificacionColor.danger,
      duracion: 4,
    });
  }

  openWarn(texto?){
    this.notification$.next({
      texto: `${texto}`,
      color: NotificacionColor.warn,
      duracion: 3,
    });
  }

  openSucess(texto?){
    this.notification$.next({
      texto: `${texto}`,
      color: NotificacionColor.success,
      duracion: 2,
    });
  }
}
