import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";

export declare class GenericList<T> {
    dataSource: MatTableDataSource<T>
    selectedEntity: T;
    expandedElement: T;
    displayedColumns: string[]
    isLastPage: boolean;
    page: number;
    onGetData(): void;
    onRowClick(entity: T, index): void;
    onDelete(entity: T, index): void;
    onAddOrEdit(entity?: T, index?): void;
    onFilter(): void;
    cargarMasDatos(): void;
}