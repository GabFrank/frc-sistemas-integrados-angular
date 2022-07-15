import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { GenericList } from '../../../../generics/generic-list-model';
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
export class ListRolesComponent implements OnInit, GenericList<Role> {

  dataSource: MatTableDataSource<Role>;
  selectedEntity: Role;
  expandedElement: Role;
  displayedColumns: string[];
  isLastPage: boolean = false;
  page = 0;
  nombreControl = new FormControl(null, Validators.required)
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

  cargarMasDatos(): void {
    this.onGetData()
  }

  ngOnInit(): void {
    this.onGetData()
  }
  
  onGetData(): void {    
    this.roleService.onGetRoles(this.page).pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        if(this.page == 0){
          this.dataSource.data = res;
        } else {
          this.dataSource.data = this.dataSource.data.concat(res);
        }
        if(res.length < 10){
          this.isLastPage = true
        } else {
          this.page++;
        }
      }
    })
  }

  onRowClick(entity: Role, index: any): void {
    throw new Error('Method not implemented.');
  }
  onDelete(entity: Role, index: any): void {
    throw new Error('Method not implemented.');
  }
  onAddOrEdit(entity?: Role, index?: any): void {
    this.matDialog.open(AdicionarRoleDialogComponent, {
      data: {
        role:entity,
      },
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res, index)
      }
    })  }
  onFilter(): void {
    throw new Error('Method not implemented.');
  }

  


}
