import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Funcionario } from '../../../modules/personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../modules/personas/funcionarios/funcionario.service';
import { FuncionarioSearchGQL } from '../../../modules/personas/funcionarios/graphql/funcionarioSearch';
import { SearchListDialogComponent, SearchListtDialogData } from '../search-list-dialog/search-list-dialog.component';

/**
 * Selector de funcionario. Abre el buscador generico del proyecto
 * (SearchListDialogComponent) contra funcionariosSearch.
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

  @Output() idSelected = new EventEmitter<number>();
  @Output() funcionarioSelected = new EventEmitter<Funcionario>();

  seleccionado: Funcionario;
  etiqueta: string = null;

  constructor(
    private funcionarioService: FuncionarioService,
    private searchFuncionario: FuncionarioSearchGQL,
    private dialog: MatDialog
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
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario) => this.aplicar(res, false));
  }

  onBuscar(): void {
    if (this.disabled) return;
    const data: SearchListtDialogData = {
      titulo: 'Buscar funcionario',
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nombre', nombre: 'Nombre', nested: true, nestedId: 'persona', nestedColumnId: 'personaNombre', width: '45%' },
        { id: 'nombre', nombre: 'Cargo', nested: true, nestedId: 'cargo', nestedColumnId: 'cargoNombre', width: '25%' },
        { id: 'nickname', nombre: 'Usuario', width: '20%' }
      ],
      query: this.searchFuncionario,
      fallbackToLocal: true
    };
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      height: '80vh',
      width: '70vw',
      panelClass: 'search-dialog-dark'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Funcionario) => {
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
    if (f == null) {
      this.etiqueta = null;
    } else {
      const nombre = f.persona != null && f.persona.nombre != null ? f.persona.nombre : f.nickname;
      this.etiqueta = f.id + ' - ' + (nombre != null ? nombre : 'SIN NOMBRE');
    }
    if (emitir) {
      this.funcionarioSelected.emit(f);
      this.idSelected.emit(f != null ? f.id : null);
    }
  }
}
