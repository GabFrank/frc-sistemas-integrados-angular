import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { AdicionarRoleDialogComponent } from '../adicionar-role-dialog/adicionar-role-dialog.component';
import { Role } from '../role.model';
import { RoleService } from '../role.service';

@UntilDestroy()
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

  dataSource: MatTableDataSource<Role>;
  expandedElement: Role;
  displayedColumns: string[];
  readonly pageSizeOptions = [15, 25, 50];
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  nombreControl = new FormControl<string>(null)
  constructor(
    private roleService: RoleService,
    private matDialog: MatDialog,

  ) {
    this.dataSource = new MatTableDataSource<Role>([])
    this.displayedColumns = [
      'id',
      'nombre',
      'creadoEn',
      'acciones'
    ]
  }

  ngOnInit(): void {
    // RoleService resuelve su GenericCrudService en un setTimeout: la primera consulta va después.
    setTimeout(() => this.onGetData(), 0);
  }

  onGetData(): void {
    const texto = (this.nombreControl.value ?? '').trim().toUpperCase();
    this.roleService.onGetRolesPaginated(texto, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => this.mostrar(res),
        error: () => this.mostrar(null),
      })
  }

  private mostrar(pagina: PageInfo<Role>): void {
    this.expandedElement = null;
    this.dataSource.data = pagina?.getContent || [];
    this.length = pagina?.getTotalElements || 0;
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
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
        this.onGetData()
      }
    })
  }
  onFilter(): void {
    this.pageIndex = 0;
    this.onGetData();
  }

  onResetFiltro(): void {
    this.nombreControl.setValue(null);
    this.onFilter();
  }
}
