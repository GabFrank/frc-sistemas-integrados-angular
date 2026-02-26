import {
    Component,
    ChangeDetectionStrategy,
    Input,
    Output,
    EventEmitter
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Marcacion } from '../../models/marcacion.model';

@Component({
    selector: 'resumen-marcaciones',
    templateUrl: './resumen-marcaciones.component.html',
    styleUrls: ['./resumen-marcaciones.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenMarcacionesComponent {

    @Input() usuarioNombre = '';
    @Input() sucursalNombre = '';
    @Input() similitudInsuficiente = false;
    @Input()
    set marcaciones(value: Marcacion[]) {
        this.dataSource.data = value || [];
    }

    @Output() limpiar = new EventEmitter<void>();
    @Output() busquedaManual = new EventEmitter<void>();

    dataSource = new MatTableDataSource<Marcacion>([]);
    displayedColumns: string[] = ['id', 'usuario', 'entrada', 'salida'];

    trackByMarcacionId(_index: number, item: Marcacion): number {
        return item.id;
    }
}
