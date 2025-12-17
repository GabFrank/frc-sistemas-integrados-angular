import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionesTableroService, NotificacionData } from '../../services/notificaciones-tablero.service';
import { ComentariosNotificacionService } from '../../services/comentarios-notificacion.service';
import { MarcarNotificacionLeidaGQL, RegistrarInteraccionNotificacionGQL } from '../../graphql/notificacionMutations.gql';
import { NotificationDetailDialogComponent } from '../notification-detail-dialog/notification-detail-dialog.component';
import { ComentariosNotificacionDialogComponent } from '../comentarios-notificacion-dialog/comentarios-notificacion-dialog.component';
import { EstadoNotificacionTablero, ESTADOS_TABLERO_LABELS } from '../../enums/estado-notificacion-tablero.enum';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { EditTransferenciaComponent } from '../../../operaciones/transferencia/edit-transferencia/edit-transferencia.component';
import { ListTransferenciaComponent } from '../../../operaciones/transferencia/list-transferencia/list-transferencia.component';
import { EditInventarioComponent } from '../../../operaciones/inventario/edit-inventario/edit-inventario.component';
import { ListInventarioComponent } from '../../../operaciones/inventario/list-inventario/list-inventario.component';
import { ListMovimientoStockComponent } from '../../../operaciones/movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { ListProductoComponent } from '../../../productos/producto/list-producto/list-producto.component';
import { ProductoComponent } from '../../../productos/producto/edit-producto/producto.component';
import { ModificacionesComponent } from '../../../operaciones/modificaciones-sistema/modificaciones/modificaciones.component';
import { combineLatest, of } from 'rxjs';
import { map, take, delay, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
    selector: 'app-notification-board',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        DragDropModule
    ],
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
    readonly pageSizeOptions = [15, 25, 50, 100];

    notificaciones$ = this.notificacionesTableroService.notificaciones$;
    paginationState$ = this.notificacionesTableroService.paginationState$;
    private tieneAccionCache = new Map<string, boolean>();

    notificacionesConConteos$ = combineLatest([
        this.notificacionesTableroService.notificaciones$,
        this.comentariosService.conteosPorNotificacion$
    ]).pipe(
        map(([notificaciones, conteos]) => {
            const resultado: { [key: string]: Array<NotificacionData & { conteoComentarios: number; tieneAccion: boolean }> } = {};

            Object.keys(notificaciones).forEach(estado => {
                resultado[estado] = notificaciones[estado].map(notif => {
                    const notificacionId = notif.notificacion?.id || 0;
                    const conteoDesdeCache = conteos.get(notificacionId);
                    const conteoComentarios = conteoDesdeCache !== undefined
                        ? conteoDesdeCache
                        : (notif.notificacion?.conteoComentarios || 0);


                    const cacheKey = `${notif.notificacion?.tipo}-${notif.notificacion?.titulo}-${notif.notificacion?.mensaje}`;
                    let tieneAccion = this.tieneAccionCache.get(cacheKey);
                    if (tieneAccion === undefined) {
                        tieneAccion = this.calcularTieneAccion(notif);
                        this.tieneAccionCache.set(cacheKey, tieneAccion);
                    }

                    return {
                        ...notif,
                        conteoComentarios,
                        tieneAccion
                    };
                });
            });

            return resultado;
        })
    );

    private readonly tiposConAccion = [
        'AJUSTE_STOCK',
        'PRODUCTO_CREADO',
        'TRANSFERENCIA_INICIADA',
        'CAMBIO_SUCURSAL_PRE_TRANSFERENCIA',
        'PRECIO_ACTUALIZADO',
        'AJUSTE_COSTO',
        'INVENTARIO_INICIADO'
    ];

    constructor(
        private notificacionesTableroService: NotificacionesTableroService,
        private comentariosService: ComentariosNotificacionService,
        private marcarNotificacionLeidaGQL: MarcarNotificacionLeidaGQL,
        private registrarInteraccionNotificacionGQL: RegistrarInteraccionNotificacionGQL,
        private dialog: MatDialog,
        private tabService: TabService,
        private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.ESTADOS_TABLERO.forEach(estado => {
            this.notificacionesTableroService.cargarNotificaciones(estado, 0, 15);
        });

        this.notificaciones$.pipe(
            untilDestroyed(this),
            map(notificaciones => {
                const todosLosIds: number[] = [];
                Object.keys(notificaciones).forEach(estado => {
                    notificaciones[estado].forEach(notif => {
                        if (notif.notificacion?.id) {
                            todosLosIds.push(notif.notificacion.id);
                        }
                    });
                });
                return todosLosIds;
            })
        ).subscribe(ids => {
            ids.forEach(id => {
                this.comentariosService.obtenerConteoComentarios(id).subscribe();
            });
        });
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

    calcularTieneAccion(n: NotificacionData): boolean {
        const tipo = n.notificacion?.tipo;
        const titulo = n.notificacion?.titulo || '';
        const mensaje = n.notificacion?.mensaje || '';

        const esMencionado = titulo === 'Mencionado en comentario' || mensaje.includes('te mencionó');
        
        if (esMencionado) {
            return true;
        }

        const esInicioSesion = tipo === 'INICIO_SESION' || titulo.includes('Inicio de sesión') || mensaje.includes('inició sesión');
        if (esInicioSesion) {
            return false;
        }

        return tipo ? this.tiposConAccion.includes(tipo) : false;
    }

    mostrarBotonModificacion(n: NotificacionData & { tieneAccion?: boolean }): boolean {
        const tipo = n.notificacion?.tipo;
        const titulo = n.notificacion?.titulo || '';
        const mensaje = n.notificacion?.mensaje || '';

        const esMencionado = titulo === 'Mencionado en comentario' || mensaje.includes('te mencionó');
        const esInicioSesion = tipo === 'INICIO_SESION' || titulo.includes('Inicio de sesión') || mensaje.includes('inició sesión');

        if (esMencionado || esInicioSesion) {
            return false;
        }

        return n.tieneAccion !== undefined ? n.tieneAccion : this.calcularTieneAccion(n);
    }

    navegarAModificaciones(n: NotificacionData, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        this.tabService.addTab(
            new Tab(ModificacionesComponent, 'Modificaciones del Sistema', null, null)
        );
    }

    navegarAAccion(n: NotificacionData, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        const tipo = n.notificacion?.tipo;
        const titulo = n.notificacion?.titulo || '';
        const mensaje = n.notificacion?.mensaje || '';

        if (!tipo) {
            return;
        }

        const esMencionado = titulo === 'Mencionado en comentario' || mensaje.includes('te mencionó');

        if (tipo === 'PERSONALIZADA' && esMencionado) {
            const match = mensaje.match(/te mencionó en un comentario sobre:\s*(.+)$/i);
            if (match && match[1]) {
                const tituloNotificacionOriginal = match[1].trim();

                let notificacionIdDesdeData: number | null = null;
                let comentarioIdDesdeData: number | null = null;
                if (n.notificacion?.data) {
                    try {
                        const parsedData = JSON.parse(n.notificacion.data);
                        notificacionIdDesdeData = parsedData?.notificacionId || parsedData?.id || null;
                        comentarioIdDesdeData = parsedData?.comentarioId || null;
                    } catch (e) {
                    }
                }

                if (notificacionIdDesdeData) {
                    this.abrirDialogoComentariosConScroll({
                        notificacionId: notificacionIdDesdeData,
                        notificacion: {
                            id: notificacionIdDesdeData,
                            titulo: tituloNotificacionOriginal
                        },
                        comentarioId: comentarioIdDesdeData || undefined
                    }, event);
                    return;
                }

                this.notificaciones$.pipe(
                    take(1),
                    map(notificaciones => {
                        let mejorNotificacion: { id: number; fecha: string; conteoComentarios: number } | null = null;

                        for (const estado of Object.keys(notificaciones)) {
                            const notificacionesConTitulo = notificaciones[estado].filter(
                                not => not.notificacion?.titulo === tituloNotificacionOriginal
                            );

                            for (const notif of notificacionesConTitulo) {
                                if (notif.notificacion?.id) {
                                    const fecha = notif.notificacion.creadoEn || notif.creadoEn || '';
                                    const conteoComentarios = notif.notificacion.conteoComentarios || 0;

                                    if (!mejorNotificacion ||
                                        (conteoComentarios > 0 && mejorNotificacion.conteoComentarios === 0) ||
                                        (conteoComentarios > 0 && fecha > mejorNotificacion.fecha) ||
                                        (conteoComentarios === 0 && mejorNotificacion.conteoComentarios === 0 && fecha > mejorNotificacion.fecha)) {
                                        mejorNotificacion = {
                                            id: notif.notificacion.id,
                                            fecha: fecha,
                                            conteoComentarios: conteoComentarios
                                        };
                                    }
                                }
                            }
                        }

                        if (mejorNotificacion) {
                            return mejorNotificacion.id;
                        }

                        return null;
                    }),
                    untilDestroyed(this)
                ).subscribe(notificacionId => {
                    if (notificacionId) {
                        this.abrirDialogoComentariosConScroll({
                            notificacionId: notificacionId,
                            notificacion: {
                                id: notificacionId,
                                titulo: tituloNotificacionOriginal
                            }
                        }, event);
                    } else {
                        const notificacionIdActual = n.notificacion?.id;

                        this.buscarNotificacionPorTituloEnBackend(tituloNotificacionOriginal, event, n);
                    }
                });
            } else {
                const notificacionIdActual = n.notificacion?.id;
                if (notificacionIdActual) {
                    this.abrirDialogoComentariosConScroll({
                        notificacionId: notificacionIdActual,
                        notificacion: {
                            id: notificacionIdActual,
                            titulo: n.notificacion.titulo || 'Comentarios'
                        }
                    }, event);
                } else {
                    this.abrirDialogoComentarios(n, event);
                }
            }
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
                if (entityId) {
                    this.tabService.addTab(
                        new Tab(
                            ProductoComponent,
                            `Producto #${entityId}`,
                            new TabData(entityId, { id: entityId }),
                            null
                        )
                    );
                } else {
                    this.tabService.addTab(
                        new Tab(ListProductoComponent, 'Lista de productos', null, null)
                    );
                }
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
            case 'COTIZACION_ACTUALIZADA':
                if (n.notificacion?.data && n.notificacion.data.trim() !== '' && n.notificacion.data !== '/') {
                    const action = n.notificacion.data;
                    window.dispatchEvent(new CustomEvent('notification-action', { detail: action }));
                }
                break;
            case 'PERSONALIZADA':
                if (n.notificacion?.data && n.notificacion.data.trim() !== '' && n.notificacion.data !== '/') {
                    const action = n.notificacion.data;
                    window.dispatchEvent(new CustomEvent('notification-action', { detail: action }));
                }
                break;
            default:
                break;
        }
    }

    abrirDialogoComentarios(n: NotificacionData, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        const notificacionId = n.notificacion?.id;
        if (!notificacionId) {
            return;
        }

        this.abrirDialogoComentariosConScroll({
            notificacionId,
            notificacion: n.notificacion
        }, event);
    }

    private buscarNotificacionPorTituloEnBackend(titulo: string, event?: Event, notificacionActual?: NotificacionData): void {
        const estados = this.ESTADOS_TABLERO;
        let busquedasCompletadas = 0;
        let notificacionEncontrada: { id: number; titulo: string } | null = null;

        const buscarEnEstado = (estado: string, index: number) => {
            this.notificacionesTableroService.cargarNotificaciones(estado, 0, 100);

            of(null).pipe(
                delay(800 * (index + 1)),
                switchMap(() => this.notificaciones$.pipe(take(1))),
                untilDestroyed(this)
            ).subscribe(notificaciones => {
                const notif = notificaciones[estado]?.find(
                    n => n.notificacion?.titulo === titulo
                );

                busquedasCompletadas++;

                if (notif?.notificacion?.id && !notificacionEncontrada) {
                    notificacionEncontrada = {
                        id: notif.notificacion.id,
                        titulo: notif.notificacion.titulo || titulo
                    };
                    this.abrirDialogoComentariosConScroll({
                        notificacionId: notificacionEncontrada.id,
                        notificacion: notificacionEncontrada
                    }, event);
                } else if (busquedasCompletadas === estados.length && !notificacionEncontrada) {
                    if (notificacionActual?.notificacion?.id) {
                        this.abrirDialogoComentariosConScroll({
                            notificacionId: notificacionActual.notificacion.id,
                            notificacion: {
                                id: notificacionActual.notificacion.id,
                                titulo: notificacionActual.notificacion.titulo || titulo
                            }
                        }, event);
                    }
                }
            });
        };

        estados.forEach((estado, index) => {
            buscarEnEstado(estado, index);
        });
    }

    private abrirDialogoComentariosConScroll(data: { notificacionId: number; notificacion: { id: number; titulo: string }; comentarioId?: number }, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        const dialogRef = this.dialog.open(ComentariosNotificacionDialogComponent, {
            width: '100%',
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
            panelClass: 'comentarios-fullscreen-dialog',
            data: data,
            autoFocus: false
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
            this.comentariosService.obtenerConteoComentarios(data.notificacionId, true).subscribe(() => {
                this.cdr.markForCheck();
            });
        });
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
            .subscribe({
                next: () => {
                    this.cdr.markForCheck();
                }
            });
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

        transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );

        this.notificacionesTableroService
            .actualizarEstadoTablero(notificacion.notificacion.id, nuevoEstado)
            .pipe(untilDestroyed(this))
            .subscribe({
                next: () => {
                    this.notificacionesTableroService.cargarNotificaciones(estadoAnterior, 0, 15);
                    this.notificacionesTableroService.cargarNotificaciones(nuevoEstado, 0, 15);
                    this.cdr.markForCheck();
                },
                error: () => {
                    transferArrayItem(
                        event.container.data,
                        event.previousContainer.data,
                        event.currentIndex,
                        event.previousIndex
                    );
                    this.cdr.markForCheck();
                }
            });
    }
}

