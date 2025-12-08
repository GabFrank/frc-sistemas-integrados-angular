import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesRoutingModule } from './notificaciones-routing.module';
import { NotificationBoardComponent } from './components/notification-board/notification-board.component';
import { NotificationDetailDialogComponent } from './components/notification-detail-dialog/notification-detail-dialog.component';
import { ComentariosNotificacionDialogComponent } from './components/comentarios-notificacion-dialog/comentarios-notificacion-dialog.component';
import { NotificacionPersonalizadaComponent } from './components/notificacion-personalizada/notificacion-personalizada.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NotificacionesRoutingModule,
    NotificationBoardComponent,
    NotificationDetailDialogComponent,
    ComentariosNotificacionDialogComponent,
    NotificacionPersonalizadaComponent
  ],
  exports: [
    NotificationBoardComponent,
    NotificationDetailDialogComponent,
    ComentariosNotificacionDialogComponent,
    NotificacionPersonalizadaComponent
  ]
})
export class NotificacionesModule { }

