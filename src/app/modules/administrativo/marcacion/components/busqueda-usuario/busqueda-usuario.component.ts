import {
    Component,
    ChangeDetectionStrategy,
    Input,
    Output,
    EventEmitter,
    ViewChild
} from '@angular/core';
import { CamaraReconocimientoComponent } from '../camara-reconocimiento/camara-reconocimiento.component';
import { Usuario } from '../../../../personas/usuarios/usuario.model';

@Component({
    selector: 'busqueda-usuario',
    templateUrl: './busqueda-usuario.component.html',
    styleUrls: ['./busqueda-usuario.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusquedaUsuarioComponent {

    @Input() mostrandoCamara = false;

    @Output() iniciarBusqueda = new EventEmitter<void>();
    @Output() busquedaManual = new EventEmitter<void>();
    @Output() cerrarCamara = new EventEmitter<void>();
    @Output() usuarioIdentificado = new EventEmitter<Usuario>();

    @ViewChild('camaraRef') camaraRef: CamaraReconocimientoComponent;
}
