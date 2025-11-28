import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionesTableroService, NotificacionData, PaginationState } from '../../../services/notificaciones-tablero.service';
import { MarcarNotificacionLeidaGQL, RegistrarInteraccionNotificacionGQL } from '../../../modules/configuracion/inicio-sesion/graphql/notificacionMutations.gql';
import { NotificationDetailDialogComponent } from '../../../modules/configuracion/inicio-sesion/components/notification-detail-dialog/notification-detail-dialog.component';
import { EstadoNotificacionTablero, ESTADOS_TABLERO_LABELS } from '../../../shared/enums/estado-notificacion-tablero.enum';
import { PageEvent } from '@angular/material/paginator';

@UntilDestroy()
@Component({
    selector: 'app-notification-board',
    templateUrl: './notification-board.component.html',
    styleUrls: ['./notification-board.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBoardComponent implements OnInit {

    readonly ESTADOS_TABLERO = [
        EstadoNotificacionTablero.POR_VERIFICAR,
        EstadoNotificacionTablero.EN_PROCESO,
        EstadoNotificacionTablero.VERIFICADO
    ];
    readonly ESTADOS_LABELS = ESTADOS_TABLERO_LABELS;
    readonly pageSizeOptions = [5, 10, 20, 50];

    notificaciones$ = this.notificacionesTableroService.notificaciones$;
    paginationState$ = this.notificacionesTableroService.paginationState$;

    constructor(
        private notificacionesTableroService: NotificacionesTableroService,
        private marcarNotificacionLeidaGQL: MarcarNotificacionLeidaGQL,
        private registrarInteraccionNotificacionGQL: RegistrarInteraccionNotificacionGQL,
        private dialog: MatDialog,
        private router: Router
    ) { }

    ngOnInit(): void {
    }

    onPageChange(event: PageEvent, estado: string): void {
        this.notificacionesTableroService.cargarNotificaciones(
            estado,
            event.pageIndex,
            event.pageSize
        );
    }

    onNotificationClick(n: NotificacionData): void {
        this.navigateByNotificationType(n);
        this.openDetail(n);
    }

    private navigateByNotificationType(n: NotificacionData): void {
        const tipo = n.notificacion?.tipo;

        if (!tipo) {
            return;
        }

        switch (tipo) {
            case 'AJUSTE_STOCK':
                this.router.navigate(['/operaciones/movimientos-stock']);
                break;
            case 'PRODUCTO_CREADO':
                this.router.navigate(['/productos']);
                break;
            case 'TRANSFERENCIA_INICIADA':
                this.router.navigate(['/operaciones/transferencias']);
                break;
            case 'PRECIO_ACTUALIZADO':
                this.router.navigate(['/productos']);
                break;
            default:
                break;
        }
    }

    openDetail(n: NotificacionData): void {
        this.registrarInteraccionNotificacionGQL
            .mutate({ notificacionUsuarioId: n.id, accion: "OPEN" })
            .pipe(untilDestroyed(this))
            .subscribe();

        const dialogRef = this.dialog.open(NotificationDetailDialogComponent, {
            width: '55vw',
            maxWidth: '95vw',
            data: n,
            autoFocus: false
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
            if (!n.leida) {
                this.markAsRead(n);
            }
        });
    }

    markAsRead(n: NotificacionData, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        if (n.leida) return;

        this.marcarNotificacionLeidaGQL
            .mutate({ notificacionUsuarioId: n.id })
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
                if (res?.data?.data) {
                    this.notificacionesTableroService.actualizarEstadoLeido(n.id);
                }
            });
    }

    changeEstadoTablero(n: NotificacionData, nuevoEstado: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        if (!n || n.estadoTablero === nuevoEstado) {
            return;
        }

        this.notificacionesTableroService
            .actualizarEstadoTablero(n.id, nuevoEstado)
            .pipe(untilDestroyed(this))
            .subscribe();
    }
}
