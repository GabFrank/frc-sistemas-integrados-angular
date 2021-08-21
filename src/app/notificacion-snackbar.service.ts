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
}
