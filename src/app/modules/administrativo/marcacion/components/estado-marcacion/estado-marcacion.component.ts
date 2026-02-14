import {
    Component,
    ChangeDetectionStrategy,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    AfterViewInit
} from '@angular/core';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { CamaraReconocimientoComponent, ModoCamara } from '../camara-reconocimiento/camara-reconocimiento.component';

@Component({
    selector: 'estado-marcacion',
    templateUrl: './estado-marcacion.component.html',
    styleUrls: ['./estado-marcacion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoMarcacionComponent {

    @Input() estaEnJornada = false;
    @Input() cargando = false;
    @Input() reconocimientoExitoso = false;
    @Input() mensajeErrorFoto = '';
    @Input() mostrandoCamara = false;
    @Input() modoCamara: ModoCamara = 'verificacion';
    @Input() referenciaDescriptor: number[] | null = null;
    @Input() usuarioSeleccionado: Usuario | null = null;

    @Output() registrarEntrada = new EventEmitter<void>();
    @Output() registrarSalida = new EventEmitter<void>();
    @Output() iniciarReconocimiento = new EventEmitter<void>();
    @Output() identidadVerificada = new EventEmitter<{ embedding: number[], snapshotUrl: string }>();
    @Output() fotoPerfilGuardada = new EventEmitter<void>();

    @ViewChild('camaraRef') camaraRef: CamaraReconocimientoComponent;
}
