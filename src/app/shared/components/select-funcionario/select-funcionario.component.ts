import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Funcionario } from '../../../modules/personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../modules/personas/funcionarios/funcionario.service';

export interface FuncionarioOpcion {
  id: number;
  label: string;
  funcionario: Funcionario;
}

/**
 * Selector de funcionario con busqueda contra el backend.
 *
 * Padron del SaaS: un mat-select plano solo sirve para listas acotadas. Los funcionarios
 * crecen con la operacion, por lo que cargarlos con onGetAllFuncionarios(0, 500) deja al
 * registro 501 inalcanzable sin ningun error visible.
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
  templateUrl: './select-funcionario.component.html'
})
export class SelectFuncionarioComponent implements OnInit, OnChanges {

  /** Minimo de caracteres antes de pegarle al backend: la query sin texto trae la tabla entera. */
  static readonly MIN_CARACTERES = 2;

  @Input() titulo = 'Funcionario';
  @Input() funcionarioId: number;
  @Input() disabled = false;

  @Output() idSelected = new EventEmitter<number>();
  @Output() funcionarioSelected = new EventEmitter<Funcionario>();

  opciones: FuncionarioOpcion[] = [];
  seleccionado: FuncionarioOpcion;

  private busqueda = new Subject<string>();

  constructor(private funcionarioService: FuncionarioService) { }

  ngOnInit(): void {
    this.busqueda.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(texto => {
        if (texto == null || texto.trim().length < SelectFuncionarioComponent.MIN_CARACTERES) {
          return of([] as Funcionario[]);
        }
        return this.funcionarioService.onFuncionarioSearch(texto.trim());
      }),
      untilDestroyed(this)
    ).subscribe((res: Funcionario[]) => {
      this.opciones = (res || []).map(f => this.toOpcion(f));
    });

    this.cargarPreseleccionado();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['funcionarioId'] && !changes['funcionarioId'].firstChange) {
      this.cargarPreseleccionado();
    }
  }

  /** Trae el funcionario ya elegido para que el select lo muestre sin depender de la busqueda. */
  private cargarPreseleccionado(): void {
    if (this.funcionarioId == null) {
      this.seleccionado = null;
      return;
    }
    if (this.seleccionado != null && this.seleccionado.id === this.funcionarioId) return;
    this.funcionarioService.onGetFuncionarioById(this.funcionarioId)
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario) => {
        if (res == null) return;
        const opcion = this.toOpcion(res);
        this.seleccionado = opcion;
        this.opciones = [opcion];
      });
  }

  private toOpcion(f: Funcionario): FuncionarioOpcion {
    const nombre = f.persona != null && f.persona.nombre != null ? f.persona.nombre : f.nickname;
    return {
      id: f.id,
      label: f.id + ' - ' + (nombre != null ? nombre : 'SIN NOMBRE'),
      funcionario: f
    };
  }

  onInputChanged(texto: string): void {
    this.busqueda.next(texto);
  }

  onSelectionChanged(opcion: FuncionarioOpcion): void {
    this.seleccionado = opcion;
    this.funcionarioSelected.emit(opcion != null ? opcion.funcionario : null);
    this.idSelected.emit(opcion != null ? opcion.id : null);
  }
}
