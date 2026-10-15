import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Funcionario } from '../../../modules/personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../modules/personas/funcionarios/funcionario.service';
import { BuscadorService } from '../../services/buscador.service';
import { terminarSiFalla } from '../../../commons/core/utils/rxjsUtils';

/**
 * Selector de funcionario por id. Abre el buscador generico del proyecto con el preset `funcionario`
 * de BuscadorService. Para un control que guarda el objeto, usar `app-buscador-field tipo="funcionario"`.
 *
 * Padron del SaaS: un mat-select plano solo sirve para listas acotadas. Los funcionarios
 * crecen con la operacion, por lo que cargarlos con onGetAllFuncionarios(0, 500) deja al
 * registro 501 inalcanzable sin ningun error visible.
 *
 * Se usa el buscador en dialogo y no un select con autocomplete porque los homonimos son
 * comunes (hay 6 ESTEBAN en la base): una sola linea de texto no alcanza para elegir, hacen
 * falta las columnas de cargo y usuario.
 *
 * @example
 * <app-select-funcionario
 *   [funcionarioId]="funcionarioControl.value"
 *   (idSelected)="funcionarioControl.setValue($event)">
 * </app-select-funcionario>
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-select-funcionario',
  templateUrl: './select-funcionario.component.html',
  styleUrls: ['./select-funcionario.component.scss']
})
export class SelectFuncionarioComponent implements OnInit, OnChanges {

  @Input() titulo = 'Funcionario';
  @Input() funcionarioId: number;
  @Input() disabled = false;
  /**
   * Deja fuera del buscador a los funcionarios dados de baja. Por default siguen apareciendo:
   * hay pantallas (liquidacion final, legajo) que justamente trabajan sobre egresados.
   */
  @Input() soloActivos = false;
  /**
   * Busca solo entre los funcionarios de las sucursales a cargo del usuario (rol RRHH SUCURSAL). El
   * central es quien acota; el buscador general le mostraría nombres que después no puede usar.
   */
  @Input() soloACargo = false;

  @Output() idSelected = new EventEmitter<number>();
  @Output() funcionarioSelected = new EventEmitter<Funcionario>();

  seleccionado: Funcionario;
  etiqueta: string = null;

  constructor(
    private funcionarioService: FuncionarioService,
    private buscador: BuscadorService
  ) { }

  ngOnInit(): void {
    this.cargarPreseleccionado();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['funcionarioId'] && !changes['funcionarioId'].firstChange) {
      this.cargarPreseleccionado();
    }
  }

  /** Resuelve el id recibido a un nombre para poder mostrarlo. */
  private cargarPreseleccionado(): void {
    if (this.funcionarioId == null) {
      this.aplicar(null, false);
      return;
    }
    if (this.seleccionado != null && this.seleccionado.id === this.funcionarioId) return;
    this.funcionarioService.onGetFuncionarioById(this.funcionarioId)
      .pipe(terminarSiFalla(), untilDestroyed(this))
      .subscribe((res: Funcionario) => this.aplicar(res, false));
  }

  onBuscar(): void {
    if (this.disabled) return;
    this.buscador.abrir('funcionario', { soloActivos: this.soloActivos, soloACargo: this.soloACargo })
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario) => {
        if (res == null) return;
        this.aplicar(res, true);
      });
  }

  onLimpiar(event: MouseEvent): void {
    event.stopPropagation();
    this.aplicar(null, true);
  }

  private aplicar(f: Funcionario, emitir: boolean): void {
    this.seleccionado = f;
    this.etiqueta = f != null ? this.buscador.etiqueta('funcionario', f) : null;
    if (emitir) {
      this.funcionarioSelected.emit(f);
      this.idSelected.emit(f != null ? f.id : null);
    }
  }
}
