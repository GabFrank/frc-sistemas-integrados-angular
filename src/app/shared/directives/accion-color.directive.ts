import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, OnInit } from '@angular/core';

/**
 * Naturaleza de una acción. Cada una tiene su color en styles.scss (--frc-accion-*), igual en los dos temas
 * salvo el tono, que se ajusta para que se lea sobre fondo claro u oscuro.
 *  - peligro (rojo): borra, cancela, anula o quita.
 *  - positivo (verde): confirma, aprueba, guarda o agrega.
 *  - editar (azul): modifica.
 *  - advertencia (amarillo): revierte o desbloquea; hay que pensarlo dos veces.
 *  - ver (celeste): consulta sin cambiar nada (ver, detalle, historial, abrir).
 *  - documento (violeta): imprime o genera un documento (PDF, ticket, QR, nota, descarga).
 *  - mover (naranja): envía, transfiere o reprocesa.
 *  - dinero (turquesa): cobros, pagos, precios y caja.
 *  - ninguna: sin color (sirve para apagar el color automático).
 */
export type AccionTipo =
  | 'peligro'
  | 'positivo'
  | 'editar'
  | 'advertencia'
  | 'ver'
  | 'documento'
  | 'mover'
  | 'dinero'
  | 'ninguna';

/** Ícono de Material → naturaleza de la acción. Los íconos que no están acá quedan con el color del tema. */
export const ACCION_POR_ICONO: Readonly<Record<string, AccionTipo>> = {
  // Rojo
  delete: 'peligro',
  delete_outline: 'peligro',
  delete_forever: 'peligro',
  delete_sweep: 'peligro',
  block: 'peligro',
  cancel: 'peligro',
  clear: 'peligro',
  remove_circle: 'peligro',
  remove_circle_outline: 'peligro',
  person_remove: 'peligro',
  link_off: 'peligro',
  // Verde
  check: 'positivo',
  check_circle: 'positivo',
  check_circle_outline: 'positivo',
  task_alt: 'positivo',
  done: 'positivo',
  done_all: 'positivo',
  save: 'positivo',
  add: 'positivo',
  add_circle: 'positivo',
  add_circle_outline: 'positivo',
  person_add: 'positivo',
  how_to_reg: 'positivo',
  // Azul
  edit: 'editar',
  edit_note: 'editar',
  mode_edit: 'editar',
  rate_review: 'editar',
  add_comment: 'editar',
  tune: 'editar',
  // Amarillo
  undo: 'advertencia',
  restore: 'advertencia',
  replay: 'advertencia',
  settings_backup_restore: 'advertencia',
  lock_open: 'advertencia',
  lock_reset: 'advertencia',
  warning: 'advertencia',
  report_problem: 'advertencia',
  archive: 'advertencia',
  unarchive: 'advertencia',
  // Celeste
  visibility: 'ver',
  open_in_new: 'ver',
  open_in_browser: 'ver',
  info: 'ver',
  info_outline: 'ver',
  view_list: 'ver',
  history: 'ver',
  travel_explore: 'ver',
  search: 'ver',
  help_outline: 'ver',
  // Violeta
  print: 'documento',
  picture_as_pdf: 'documento',
  receipt: 'documento',
  receipt_long: 'documento',
  description: 'documento',
  article: 'documento',
  qr_code: 'documento',
  qr_code_2: 'documento',
  note_add: 'documento',
  download: 'documento',
  file_download: 'documento',
  // Naranja
  send: 'mover',
  mail: 'mover',
  swap_horiz: 'mover',
  local_shipping: 'mover',
  move_to_inbox: 'mover',
  call_split: 'mover',
  refresh: 'mover',
  autorenew: 'mover',
  // Turquesa
  payments: 'dinero',
  point_of_sale: 'dinero',
  price_check: 'dinero',
  request_quote: 'dinero',
  account_balance_wallet: 'dinero',
  attach_money: 'dinero',
  shopping_cart: 'dinero',
  add_shopping_cart: 'dinero',
};

const CLASES: string[] = ['peligro', 'positivo', 'editar', 'advertencia', 'ver', 'documento', 'mover', 'dinero'].map((t) => `frc-accion-${t}`);

/**
 * Pinta el ícono de una acción según su naturaleza (ver ACCION_POR_ICONO).
 *
 * - Automático en todos los menús: `<button mat-menu-item><mat-icon>delete</mat-icon>…` sale rojo sin
 *   agregar nada al HTML.
 * - En cualquier otro ícono: `<mat-icon frcAccion>delete</mat-icon>`.
 * - Forzar o apagar: `<mat-icon frcAccion="peligro">`, `<mat-icon frcAccion="ninguna">`. Un ícono con
 *   frcAccion propio manda sobre el automático del menú.
 *
 * Sigue los íconos que cambian solos (`{{ cancelado ? 'check_circle' : 'block' }}`) y los que aparecen
 * después por un *ngIf.
 */
@Directive({
  selector: 'button[mat-menu-item], a[mat-menu-item], [frcAccion]',
})
export class AccionColorDirective implements OnInit, OnChanges, OnDestroy {
  /** Vacío = deducir del ícono. */
  @Input() frcAccion: AccionTipo | '' = '';

  private observer?: MutationObserver;
  private iconoPintado?: HTMLElement;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngOnInit(): void {
    this.aplicar();
    // Fuera de la zona: un cambio de texto del ícono no tiene por qué disparar detección de cambios.
    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => this.aplicar());
      this.observer.observe(this.el.nativeElement, { childList: true, characterData: true, subtree: true });
    });
  }

  ngOnChanges(): void {
    this.aplicar();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private aplicar(): void {
    const host = this.el.nativeElement;
    const esIcono = host.tagName === 'MAT-ICON';
    const icono = esIcono ? host : this.buscarIcono(host);

    if (this.iconoPintado && this.iconoPintado !== icono) {
      this.limpiar(this.iconoPintado);
      this.iconoPintado = undefined;
    }
    if (!icono) return;
    // El ícono tiene su propio frcAccion: que lo maneje esa instancia.
    if (!esIcono && icono.hasAttribute('frcaccion')) return;

    const tipo = this.frcAccion || ACCION_POR_ICONO[(icono.textContent || '').trim()] || 'ninguna';
    const clase = tipo === 'ninguna' ? null : `frc-accion-${tipo}`;
    if (clase && icono.classList.contains(clase)) return; // ya está; evita bucles con el observer
    this.limpiar(icono);
    if (clase) icono.classList.add(clase);
    this.iconoPintado = icono;
  }

  private buscarIcono(host: HTMLElement): HTMLElement | null {
    return host.querySelector('mat-icon');
  }

  private limpiar(icono: HTMLElement): void {
    CLASES.forEach((c) => icono.classList.contains(c) && icono.classList.remove(c));
  }
}
