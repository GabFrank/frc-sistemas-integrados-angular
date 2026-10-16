import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { BuscadorService, OpcionesBuscador, TipoBuscador } from '../../services/buscador.service';

/**
 * Campo para elegir una entidad que crece con la operacion (cliente, persona, funcionario, proveedor...).
 * Abre el buscador generico (SearchListDialogComponent) con la configuracion de `BuscadorService`.
 *
 * Funciona con `formControl`: el valor del control es el objeto elegido (o `null`).
 *
 * - Modo normal: el campo es de solo lectura; click o Enter abre el buscador.
 * - Modo `rapido` (mostrador): se escribe el id o el nombre y, al pausar, si hay una sola coincidencia se
 *   elige sola. Con varias se despliega la lista debajo del campo, como los autocompletes de antes (flechas +
 *   Enter o click); el buscador queda como segunda opcion: «Buscar mas…» al final de la lista, Enter sin una
 *   fila marcada o la lupa. Con algo ya elegido, Enter emite `(enter)` para que la pantalla pase al campo
 *   siguiente. Editar el texto deja de valer lo elegido.
 *
 * @example
 * <app-buscador-field tipo="cliente" titulo="Cliente" [rapido]="true"
 *   [formControl]="clienteControl" (enter)="direccionInput.select()">
 * </app-buscador-field>
 */
/** Ultima fila de la lista rapida: abre el buscador. */
const BUSCAR_MAS = { buscarMas: true };
/** Filas de la lista rapida; el resto se ve en el buscador. */
const MAX_LISTA = 10;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-buscador-field',
  templateUrl: './buscador-field.component.html',
  styleUrls: ['./buscador-field.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BuscadorFieldComponent), multi: true }]
})
export class BuscadorFieldComponent implements ControlValueAccessor {

  @Input() tipo: TipoBuscador;
  @Input() titulo: string;
  @Input() opciones: OpcionesBuscador = {};
  @Input() rapido = false;
  /** Espera tras la ultima tecla antes de buscar, en modo rapido. */
  @Input() demora = 700;
  @Input() placeholder: string;
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() requerido = false;
  @Input() limpiable = true;
  /** Reemplaza la etiqueta del preset (ej. «NOMBRE (usuario)»). */
  @Input() etiqueta: (item: any) => string;

  /** Lo elegido, o `null` al limpiar o al editar el texto. */
  @Output() seleccionado = new EventEmitter<any>();
  /** Enter con algo ya elegido. */
  @Output() enter = new EventEmitter<void>();

  @ViewChild('input', { static: true }) input: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) trigger: MatAutocompleteTrigger;

  textoControl = new FormControl<string>('');
  valor: any = null;
  disabled = false;
  buscando = false;
  aviso: string = null;
  avisoError = false;
  /** Lista desplegable del modo rapido, con la etiqueta ya resuelta (sin llamadas desde el template). */
  listaRapida: { item: any, texto: string }[] = [];
  totalCandidatos = 0;
  readonly buscarMas = BUSCAR_MAS;

  private candidatos: any[] = [];
  /** Lo que escribio el usuario: mat-autocomplete pisa el input con la opcion elegida. */
  private ultimoTexto = '';
  private timer: any;
  /** Solo vale la respuesta de la ultima busqueda. */
  private busquedaId = 0;
  private onChange: (v: any) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(
    private buscador: BuscadorService,
    private notificacion: NotificacionSnackbarService
  ) { }

  writeValue(obj: any): void {
    this.cancelarBusqueda();
    this.valor = obj ?? null;
    this.setCandidatos([]);
    this.setAviso(null);
    this.textoControl.setValue(this.textoDe(this.valor), { emitEvent: false });
  }

  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.textoControl.disable({ emitEvent: false });
    } else {
      this.textoControl.enable({ emitEvent: false });
    }
  }

  focus(): void {
    this.input.nativeElement.focus();
  }

  select(): void {
    this.input.nativeElement.select();
  }

  onClick(): void {
    if (!this.rapido) this.abrir();
  }

  /** Tipeo del usuario (no se dispara con setValue). */
  onInput(): void {
    if (!this.rapido) return;
    if (this.valor != null) this.aplicar(null);
    this.setCandidatos([]);
    this.setAviso(null);
    this.cancelarBusqueda();
    this.ultimoTexto = this.textoControl.value ?? '';
    const texto = this.ultimoTexto.trim();
    if (!texto) return;
    this.timer = setTimeout(() => this.buscar(texto, false), this.demora);
  }

  /**
   * En keyup, como el resto de las pantallas: con keydown el foco pasaba al campo siguiente antes de soltar la
   * tecla y su propio (keyup.enter) lo salteaba (retiro: Responsable → Observación → Guaraníes de un saque).
   */
  onEnter(event: Event): void {
    event.preventDefault();
    if (this.disabled) return;
    if (this.valor != null) {
      this.enter.emit();
      return;
    }
    const texto = this.textoControl.value?.trim();
    if (!this.rapido || !texto) {
      this.abrir();
    } else if (this.candidatos.length > 0) {
      this.abrir();
    } else {
      // Enter antes de la pausa (lector de codigo de barras): se busca ya.
      this.cancelarBusqueda();
      this.buscar(texto, true);
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  onLimpiar(event: MouseEvent): void {
    event.stopPropagation();
    this.cancelarBusqueda();
    this.setCandidatos([]);
    this.setAviso(null);
    this.textoControl.setValue('', { emitEvent: false });
    this.aplicar(null);
    this.focus();
  }

  /** `displayWith` de la lista: el input muestra la etiqueta de la fila, o lo escrito si es «Buscar mas…». */
  mostrar = (v: any): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v === BUSCAR_MAS ? this.ultimoTexto : this.textoDe(v);
  };

  onOpcion(event: MatAutocompleteSelectedEvent): void {
    const v = event.option.value;
    if (v === BUSCAR_MAS) {
      this.textoControl.setValue(this.ultimoTexto, { emitEvent: false });
      this.abrir();
    } else {
      this.aplicar(v);
    }
  }

  abrir(): void {
    if (this.disabled) return;
    this.trigger?.closePanel();
    this.cancelarBusqueda();
    const texto = this.valor == null ? this.textoControl.value : null;
    this.buscador.abrir(this.tipo, { ...this.opciones, texto, candidatos: this.candidatos })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.aplicar(res);
        setTimeout(() => this.select(), 100);
      });
  }

  /** `abrirSiNoHayUno`: viene de un Enter, que con 0 o varias coincidencias abre el buscador. */
  private buscar(texto: string, abrirSiNoHayUno: boolean): void {
    const id = ++this.busquedaId;
    this.buscando = true;
    this.buscador.buscarRapido(this.tipo, texto, this.opciones)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          if (id !== this.busquedaId) return;
          this.buscando = false;
          const encontrados = res || [];
          // La busqueda es por «contiene»: un codigo escaneado (M1) trae tambien M10, M11...
          const exactos = encontrados.filter(c => this.textoDe(c).toUpperCase() === texto.toUpperCase());
          if (encontrados.length === 1 || exactos.length === 1) {
            this.aplicar(exactos.length === 1 ? exactos[0] : encontrados[0]);
          } else if (abrirSiNoHayUno) {
            this.setCandidatos(encontrados);
            this.abrir();
          } else if (encontrados.length > 1) {
            this.setCandidatos(encontrados);
            this.setAviso(encontrados.length + ' coincidencias: ↓ para elegir, Enter abre el buscador');
            // Solo si el foco sigue en el campo: no se despliega sobre otro campo al que ya se paso.
            if (document.activeElement === this.input.nativeElement) this.trigger?.openPanel();
          } else {
            this.setAviso('Sin resultados: Enter abre el buscador');
          }
        },
        error: () => {
          if (id !== this.busquedaId) return;
          this.buscando = false;
          this.setAviso('No se pudo buscar: el servidor no responde', true);
          this.notificacion.openWarn('No se pudo buscar: el servidor no responde. Intentá de nuevo.', 4);
        }
      });
  }

  private aplicar(item: any): void {
    this.valor = item ?? null;
    if (this.valor != null) {
      this.setCandidatos([]);
      this.setAviso(null);
      this.textoControl.setValue(this.textoDe(this.valor), { emitEvent: false });
    } else if (!this.rapido) {
      this.textoControl.setValue('', { emitEvent: false });
    }
    this.onChange(this.valor);
    this.seleccionado.emit(this.valor);
  }

  private setCandidatos(lista: any[]): void {
    this.candidatos = lista;
    this.totalCandidatos = lista.length;
    this.listaRapida = lista.slice(0, MAX_LISTA).map(item => ({ item, texto: this.textoDe(item) }));
  }

  private cancelarBusqueda(): void {
    if (this.timer != null) clearTimeout(this.timer);
    this.timer = null;
    this.busquedaId++;
    this.buscando = false;
  }

  private setAviso(texto: string, error = false): void {
    this.aviso = texto;
    this.avisoError = error;
  }

  private textoDe(item: any): string {
    if (item == null) return '';
    return this.etiqueta != null ? this.etiqueta(item) : this.buscador.etiqueta(this.tipo, item);
  }
}
