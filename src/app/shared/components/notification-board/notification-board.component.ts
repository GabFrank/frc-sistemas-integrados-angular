import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionesTableroService, NotificacionData } from '../../../services/notificaciones-tablero.service';
import { MarcarNotificacionLeidaGQL, RegistrarInteraccionNotificacionGQL } from '../../../modules/configuracion/inicio-sesion/graphql/notificacionMutations.gql';
import { NotificationDetailDialogComponent } from '../../../modules/configuracion/inicio-sesion/components/notification-detail-dialog/notification-detail-dialog.component';
import { EstadoNotificacionTablero, ESTADOS_TABLERO_LABELS } from '../../../shared/enums/estado-notificacion-tablero.enum';
import { PageEvent } from '@angular/material/paginator';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TabService, TabData } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { EditTransferenciaComponent } from '../../../modules/operaciones/transferencia/edit-transferencia/edit-transferencia.component';
import { ListTransferenciaComponent } from '../../../modules/operaciones/transferencia/list-transferencia/list-transferencia.component';
import { EditInventarioComponent } from '../../../modules/operaciones/inventario/edit-inventario/edit-inventario.component';
import { ListInventarioComponent } from '../../../modules/operaciones/inventario/list-inventario/list-inventario.component';
import { ListMovimientoStockComponent } from '../../../modules/operaciones/movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { ListProductoComponent } from '../../../modules/productos/producto/list-producto/list-producto.component';

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
    readonly pageSizeOptions = [25, 50, 75, 100];

    notificaciones$ = this.notificacionesTableroService.notificaciones$;
    paginationState$ = this.notificacionesTableroService.paginationState$;

    constructor(
        private notificacionesTableroService: NotificacionesTableroService,
        private marcarNotificacionLeidaGQL: MarcarNotificacionLeidaGQL,
        private registrarInteraccionNotificacionGQL: RegistrarInteraccionNotificacionGQL,
        private dialog: MatDialog,
        private tabService: TabService,
        private cdr: ChangeDetectorRef
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
        this.openDetail(n);
    }

    navigateToAction(n: NotificacionData, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        const tipo = n.notificacion?.tipo;

        if (!tipo) {
            return;
        }

        let entityId: number | null = null;
        
        if (n.notificacion?.data) {
            try {
                const parsedData = JSON.parse(n.notificacion.data);
                entityId = parsedData?.id || parsedData?.transferenciaId || parsedData?.inventarioId || parsedData?.productoId || null;
            } catch (e) {
                const match = n.notificacion.data.match(/\/(\d+)$/);
                if (match) {
                    entityId = parseInt(match[1], 10);
                }
            }
        }

        switch (tipo) {
            case 'AJUSTE_STOCK':
                this.tabService.addTab(
                    new Tab(ListMovimientoStockComponent, 'Movimientos de Stock', null, null)
                );
                break;
            case 'PRODUCTO_CREADO':
            case 'PRECIO_ACTUALIZADO':
            case 'AJUSTE_COSTO':
                this.tabService.addTab(
                    new Tab(ListProductoComponent, 'Productos', null, null)
                );
                break;
            case 'TRANSFERENCIA_INICIADA':
            case 'CAMBIO_SUCURSAL_PRE_TRANSFERENCIA':
                if (entityId) {
                    this.tabService.addTab(
                        new Tab(
                            EditTransferenciaComponent, 
                            `Transferencia #${entityId}`, 
                            new TabData(entityId, { id: entityId }), 
                            null
                        )
                    );
                } else {
                    this.tabService.addTab(
                        new Tab(ListTransferenciaComponent, 'Lista de transferencias', null, null)
                    );
                }
                break;
            case 'INVENTARIO_INICIADO':
                if (entityId) {
                    this.tabService.addTab(
                        new Tab(
                            EditInventarioComponent, 
                            `Inventario #${entityId}`, 
                            new TabData(entityId, { id: entityId }), 
                            null
                        )
                    );
                } else {
                    this.tabService.addTab(
                        new Tab(ListInventarioComponent, 'Lista de inventarios', null, null)
                    );
                }
                break;
            default:
                break;
        }
    }

    hasAction(n: NotificacionData): boolean {
        const tipo = n.notificacion?.tipo;
        const tiposConAccion = [
            'AJUSTE_STOCK',
            'PRODUCTO_CREADO',
            'TRANSFERENCIA_INICIADA',
            'CAMBIO_SUCURSAL_PRE_TRANSFERENCIA',
            'PRECIO_ACTUALIZADO',
            'AJUSTE_COSTO',
            'INVENTARIO_INICIADO'
        ];
        return tipo ? tiposConAccion.includes(tipo) : false;
    }

    openDetail(n: NotificacionData): void {
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

        this.notificacionesTableroService
            .marcarComoLeida(n.notificacion.id)
            .pipe(untilDestroyed(this))
            .subscribe({
                next: () => {
                    this.cdr.markForCheck();
                }
            });
    }

    changeEstadoTablero(n: NotificacionData, nuevoEstado: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        if (!n || n.notificacion.estadoTablero === nuevoEstado) {
            return;
        }

        this.notificacionesTableroService
            .actualizarEstadoTablero(n.notificacion.id, nuevoEstado)
            .pipe(untilDestroyed(this))
            .subscribe();
    }

    drop(event: CdkDragDrop<NotificacionData[]>, nuevoEstado: string): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }

        const notificacion = event.previousContainer.data[event.previousIndex];
        const estadoAnterior = notificacion.notificacion.estadoTablero;

        if (estadoAnterior === nuevoEstado) {
            return;
        }
        this.notificacionesTableroService
            .actualizarEstadoTablero(notificacion.notificacion.id, nuevoEstado)
            .pipe(untilDestroyed(this))
            .subscribe();
    }
}
