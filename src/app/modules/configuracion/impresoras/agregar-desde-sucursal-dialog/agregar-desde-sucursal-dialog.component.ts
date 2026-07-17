import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from, of } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ImpresoraInput } from '../impresora.model';
import { ImpresoraService } from '../impresora.service';

// Palabras que sugieren que una impresora es termica / de tickets (mismo criterio que el resto del módulo).
const REGEX_TERMICA = /ticket|term|thermal|\btm[-\s]?\d|xprinter|xp[-\s]?\d|pos.?58|pos.?80|58\s?mm|80\s?mm|receipt|bematech|epson\s?tm/i;

interface ColaVista {
  nombre: string;
  seleccionada: boolean;
  esTermica: boolean;
  compartiendo: boolean;
  /** true = ya se compartió e instaló como proxy IPP en el central (flag informativo). */
  compartida: boolean;
}

/**
 * "Agregar desde sucursal": conecta directo (por IP) al backend filial de una sucursal elegida y
 * trae sus colas CUPS ya instaladas, para registrarlas como Impresora en el central sin tener que
 * darlas de alta a mano una por una. Reutiliza el login ya activo (mismo mecanismo que "compartir
 * impresora" en el diálogo de alta) — no pide usuario/contraseña de sistema operativo.
 */
@UntilDestroy()
@Component({
  selector: 'app-agregar-desde-sucursal-dialog',
  templateUrl: './agregar-desde-sucursal-dialog.component.html',
  styleUrls: ['./agregar-desde-sucursal-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarDesdeSucursalDialogComponent implements OnInit {

  private sucursalService = inject(SucursalService);
  private impresoraService = inject(ImpresoraService);
  private configuracionService = inject(ConfiguracionService);
  private notificacion = inject(NotificacionSnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<AgregarDesdeSucursalDialogComponent>);

  sucursalControl = new FormControl<number | null>(null, Validators.required);
  ipControl = new FormControl('', Validators.required);
  // El puerto del backend de cada sucursal puede variar entre instalaciones: siempre se tipea, sin
  // valor por defecto asumido.
  puertoControl = new FormControl('', Validators.required);

  sucursales: Sucursal[] = [];
  colas: ColaVista[] = [];
  buscando = false;
  guardando = false;
  buscoAlMenosUnaVez = false;
  errorBusqueda: string = null;

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // La sucursal 0 es el servidor central: no aplica acá (ya tiene su propio flujo en "Nueva impresora").
        this.sucursales = (res ?? []).filter((s) => s.id !== 0);
        this.cdr.markForCheck();
      });

    this.sucursalControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((id) => this.alElegirSucursal(id));
  }

  private alElegirSucursal(id: number | null): void {
    const s = this.sucursales.find((x) => x.id === id);
    this.ipControl.setValue(s?.ip ?? '');
    // El puerto NUNCA se autocompleta: siempre se tipea a mano, aunque ya se haya guardado uno
    // antes (puede haber cambiado).
    this.puertoControl.setValue('');
    this.colas = [];
    this.buscoAlMenosUnaVez = false;
    this.errorBusqueda = null;
    this.cdr.markForCheck();
  }

  buscarColas(): void {
    const sucursal = this.sucursales.find((s) => s.id === this.sucursalControl.value);
    const ip = (this.ipControl.value ?? '').trim();
    const puerto = (this.puertoControl.value ?? '').trim();
    if (!sucursal || !ip || !puerto) {
      this.notificacion.notification$.next({
        texto: 'Elegí la sucursal y completá IP y puerto.',
        color: NotificacionColor.warn,
        duracion: 4,
      });
      return;
    }
    this.buscando = true;
    this.errorBusqueda = null;
    this.cdr.markForCheck();
    this.impresoraService.delSistemaEnServidorPorIp(ip, puerto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.colas = (res ?? []).map((nombre) => ({
            nombre,
            seleccionada: false,
            esTermica: REGEX_TERMICA.test(nombre),
            compartiendo: false,
            compartida: false,
          }));
          this.buscando = false;
          this.buscoAlMenosUnaVez = true;
          this.cdr.markForCheck();
          // El puerto tipeado funcionó: lo guardamos en la sucursal para que el backend (routing de
          // impresión real) deje de asumir el default y use este puerto de ahora en más.
          this.persistirPuertoSiCambio(sucursal, Number(puerto));
        },
        error: (e) => {
          this.buscando = false;
          this.buscoAlMenosUnaVez = true;
          this.colas = [];
          this.errorBusqueda = e?.message || 'No se pudo conectar. Verificá IP, puerto y que la sucursal esté online.';
          this.cdr.markForCheck();
        },
      });
  }

  private persistirPuertoSiCambio(sucursal: Sucursal, puerto: number): void {
    if (sucursal.puertoServidor === puerto) { return; }
    sucursal.puertoServidor = puerto;
    this.sucursalService.onSaveSucursal(sucursal.toInput(), true)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  toggle(cola: ColaVista): void {
    cola.seleccionada = !cola.seleccionada;
    this.cdr.markForCheck();
  }

  /**
   * Comparte esta cola (ya instalada en la sucursal) al servidor CENTRAL, igual que "Compartir al
   * servidor" hace con una impresora local de escritorio:
   * 1) Habilita el compartir CUPS en el backend de la SUCURSAL (por IP, sin credenciales de SO).
   * 2) El central instala una cola proxy que apunta por IPP a la sucursal (util para imprimir
   *    directo desde el SO de esa PC; la app NO depende de esta cola para imprimir).
   * Al guardar, la impresora sigue registrada con `sucursalId` apuntando a la SUCURSAL real (no al
   * central): así `PrintRouterService` sigue haciendo el proxy GraphQL correcto hacia la sucursal
   * en vez de imprimir "local" contra la cola IPP-proxy del central (que quedaba colgada ante
   * cualquier hiccup de red — "Unable to add document to print job"). `compartida` solo se guarda
   * como flag informativo (`compartidaEnCentral`).
   */
  compartir(cola: ColaVista): void {
    const ip = (this.ipControl.value ?? '').trim();
    const puerto = (this.puertoControl.value ?? '').trim();
    if (!ip || !puerto) {
      return;
    }
    const config = this.configuracionService.getConfig();
    const centralIp = config?.serverCentralIp ?? '';
    const centralPort = config?.serverCentralPort ?? '8081';
    if (!centralIp) {
      this.notificacion.notification$.next({
        texto: 'No hay IP del servidor central configurada.',
        color: NotificacionColor.warn,
        duracion: 5,
      });
      return;
    }
    cola.compartiendo = true;
    this.cdr.markForCheck();
    this.impresoraService.compartirColaEnServidorPorIp(cola.nombre, ip, puerto, centralIp)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          if (!ok) {
            cola.compartiendo = false;
            this.notificacion.notification$.next({
              texto: 'No se pudo habilitar el compartir en la sucursal (verificá permisos de CUPS ahí).',
              color: NotificacionColor.warn,
              duracion: 7,
            });
            this.cdr.markForCheck();
            return;
          }
          const uri = `ipp://${ip}:631/printers/${cola.nombre}`;
          this.impresoraService
            .instalarEnServidorPorIp(cola.nombre, uri, cola.esTermica, centralIp, centralPort, true)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (okInstalado) => {
                cola.compartiendo = false;
                if (okInstalado) {
                  cola.compartida = true;
                  cola.seleccionada = true;
                  this.notificacion.notification$.next({
                    texto: 'Cola compartida e instalada en el central: ' + cola.nombre,
                    color: NotificacionColor.success,
                    duracion: 4,
                  });
                } else {
                  this.notificacion.notification$.next({
                    texto: 'Se compartió en la sucursal pero el central no pudo instalarla.',
                    color: NotificacionColor.warn,
                    duracion: 7,
                  });
                }
                this.cdr.markForCheck();
              },
              error: (e) => {
                cola.compartiendo = false;
                this.notificacion.notification$.next({
                  texto: 'El central rechazó la instalación: ' + (e?.message || 'error desconocido'),
                  color: NotificacionColor.warn,
                  duracion: 8,
                });
                this.cdr.markForCheck();
              },
            });
        },
        error: (e) => {
          cola.compartiendo = false;
          this.notificacion.notification$.next({
            texto: 'No se pudo contactar la sucursal para compartir: ' + (e?.message || 'error desconocido'),
            color: NotificacionColor.warn,
            duracion: 8,
          });
          this.cdr.markForCheck();
        },
      });
  }

  get seleccionadas(): ColaVista[] {
    return this.colas.filter((c) => c.seleccionada);
  }

  agregarSeleccionadas(): void {
    const sucursal = this.sucursales.find((s) => s.id === this.sucursalControl.value);
    const seleccionadas = this.seleccionadas;
    if (!sucursal || seleccionadas.length === 0) { return; }

    this.guardando = true;
    this.cdr.markForCheck();

    from(seleccionadas)
      .pipe(
        concatMap((cola) => this.impresoraService.guardar(this.aInput(cola, sucursal.id), true).pipe(
          map(() => true),
          catchError(() => {
            this.notificacion.notification$.next({
              texto: 'Error al guardar ' + cola.nombre,
              color: NotificacionColor.warn,
              duracion: 5,
            });
            return of(false);
          }),
        )),
        toArray(),
        untilDestroyed(this),
      )
      .subscribe((resultados) => {
        this.guardando = false;
        const exitosas = resultados.filter(Boolean).length;
        if (exitosas > 0) {
          this.notificacion.notification$.next({
            texto: `${exitosas} impresora(s) agregada(s) desde ${sucursal.nombre}.`,
            color: NotificacionColor.success,
            duracion: 4,
          });
        }
        this.cdr.markForCheck();
        this.dialogRef.close(exitosas > 0);
      });
  }

  private aInput(cola: ColaVista, sucursalId: number): ImpresoraInput {
    const input = new ImpresoraInput();
    input.nombre = cola.nombre.toUpperCase();
    input.activo = true;
    input.esPredeterminada = false;
    // sucursalId siempre es el host REAL (donde vive físicamente la cola), se haya compartido o
    // no: es lo que PrintRouterService usa para decidir si imprime local o hace proxy GraphQL.
    input.sucursalId = sucursalId;
    input.tipo = cola.esTermica ? 'TERMICA' : 'NORMAL';
    input.uso = 'TICKET';
    input.conexion = 'CUPS';
    input.colaCups = cola.nombre;
    input.perfilPapel = cola.esTermica ? 'MM_58' : 'A4';
    input.columnas = 32;
    // Solo informativo: indica que además existe una cola proxy IPP en el central.
    input.compartidaEnCentral = cola.compartida;
    return input;
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
