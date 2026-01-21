import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AvatarService, UsuarioBase } from './avatar.service';

export interface ResultadoSeleccionUsuario {
    textoNuevo: string;
    posicionCursor: number;
}
interface EstadoMencion {
    mostrar: boolean;
    posicionArroba: number;
    textoBusqueda: string;
}
@Injectable({
    providedIn: 'root'
})
export class MencionUsuarioService {
    private readonly avatarService = inject(AvatarService);

    private readonly _estado$ = new BehaviorSubject<EstadoMencion>({
        mostrar: false,
        posicionArroba: -1,
        textoBusqueda: ''
    });

    private readonly _textoBusqueda$ = new BehaviorSubject<string>('');
    private usuarios: UsuarioBase[] = [];

    readonly mostrarAutocompletado$ = this._estado$.pipe(
        map(estado => estado.mostrar)
    );

    readonly textoBusqueda$ = this._textoBusqueda$.pipe(
        debounceTime(200),
        distinctUntilChanged()
    );

    establecerUsuarios(usuarios: UsuarioBase[]): void {
        this.usuarios = usuarios;
    }

    /**
     * Detecta si hay una mención activa basándose en el texto y posición del cursor
     * @returns true si se debe mostrar el autocompletado
     */
    detectarMencion(texto: string, posicionCursor: number): boolean {
        const textoAntesCursor = texto.substring(0, posicionCursor);
        const ultimoArroba = textoAntesCursor.lastIndexOf('@');

        if (ultimoArroba !== -1) {
            const textoDespuesArroba = textoAntesCursor.substring(ultimoArroba + 1);

            if (!textoDespuesArroba.includes('\n') && !textoDespuesArroba.endsWith(' ')) {
                this._estado$.next({
                    mostrar: true,
                    posicionArroba: ultimoArroba,
                    textoBusqueda: textoDespuesArroba
                });
                this._textoBusqueda$.next(textoDespuesArroba);
                return true;
            }
        }

        this.cerrarAutocompletado();
        return false;
    }

    filtrarUsuarios(busqueda: string): UsuarioBase[] {
        if (!busqueda || busqueda.length < 1) {
            return [];
        }

        const busquedaLower = busqueda.toLowerCase();
        return this.usuarios
            .filter(usuario => {
                const nickname = usuario.nickname?.toLowerCase() || '';
                const nombre = usuario.persona?.nombre?.toLowerCase() || '';
                return nickname.includes(busquedaLower) || nombre.includes(busquedaLower);
            })
            .slice(0, 10);
    }

    seleccionarUsuario(
        usuario: UsuarioBase,
        textoActual: string,
        posicionCursor: number
    ): ResultadoSeleccionUsuario {
        const estado = this._estado$.value;

        if (estado.posicionArroba === -1) {
            return { textoNuevo: textoActual, posicionCursor };
        }

        const textoAntesArroba = textoActual.substring(0, estado.posicionArroba);
        const textoDespuesCursor = textoActual.substring(posicionCursor);
        const nickname = usuario.nickname || '';

        const textoNuevo = textoAntesArroba + '@' + nickname + ' ' + textoDespuesCursor;
        const nuevaPosicion = estado.posicionArroba + 1 + nickname.length + 1;

        this.cerrarAutocompletado();

        return {
            textoNuevo,
            posicionCursor: nuevaPosicion
        };
    }

    cerrarAutocompletado(): void {
        this._estado$.next({
            mostrar: false,
            posicionArroba: -1,
            textoBusqueda: ''
        });
    }

    obtenerTextoBusqueda(): string {
        return this._estado$.value.textoBusqueda;
    }
}
