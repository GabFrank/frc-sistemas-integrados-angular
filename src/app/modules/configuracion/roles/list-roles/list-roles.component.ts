import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { AdicionarRoleDialogComponent } from '../adicionar-role-dialog/adicionar-role-dialog.component';
import { Role } from '../role.model';
import { RoleService } from '../role.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-roles',
  templateUrl: './list-roles.component.html',
  styleUrls: ['./list-roles.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListRolesComponent implements OnInit {

  expandedElement: Role;
  displayedColumns: string[];
  nombreControl = new FormControl<string>(null)

  pag = new PaginacionLista<Role>({
    cargar: (page, size) => this.roleService.onGetRolesPaginated(
      (this.nombreControl.value ?? '').trim().toUpperCase(), page, size),
    alCargar: () => this.expandedElement = null,
  });
  constructor(
    private roleService: RoleService,
    private matDialog: MatDialog,

  ) {
    this.displayedColumns = [
      'id',
      'nombre',
      'creadoEn',
      'acciones'
    ]
  }

  ngOnInit(): void {
    // RoleService resuelve su GenericCrudService en un setTimeout: la primera consulta va después.
    setTimeout(() => this.pag.filtrar(), 0);
  }

  onDelete(entity: Role, index: any): void {
    throw new Error('Method not implemented.');
  }
  onAddOrEdit(entity?: Role, index?: any): void {
    this.matDialog.open(AdicionarRoleDialogComponent, {
      data: {
        role: entity,
      },
      width: '30%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.pag.recargar()
      }
    })
  }
  onFilter(): void {
    this.pag.filtrar();
  }

  onResetFiltro(): void {
    this.nombreControl.setValue(null);
    this.onFilter();
  }
}
