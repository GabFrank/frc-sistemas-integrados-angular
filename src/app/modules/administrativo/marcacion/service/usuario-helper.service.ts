import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { PersonaService } from '../../../personas/persona/persona.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { UsuarioSearchGQL } from '../../../personas/usuarios/graphql/usuarioSearch';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class UsuarioHelperService {

    constructor(
        private usuarioService: UsuarioService,
        private personaService: PersonaService,
        private notificacionService: NotificacionSnackbarService,
        private searchUsuario: UsuarioSearchGQL
    ) { }

    buscarUsuarioPorId(id: number): Observable<Usuario | null> {
        return this.usuarioService.onGetUsuarioPorPersonaId(id, true, { networkError: { propagate: true, show: false } })
            .pipe(
                tap(usuario => {
                    if (!usuario) {
                        this.manejarErrorPersonaNoEncontrada(id);
                    }
                })
            );
    }

    private manejarErrorPersonaNoEncontrada(id: number): void {
        this.personaService.onGetPersona(id).pipe().subscribe(res => {
            if (res) {
                this.notificacionService.openWarn('La persona encontrada no tiene usuario asociado. Debe crear un usuario para esta persona.');
            } else {
                this.notificacionService.openWarn('No se encontró ninguna persona con ese ID');
            }
        });
    }

    abrirBuscador(dialog: MatDialog): Observable<Usuario | undefined> {
        const data: SearchListtDialogData = {
            titulo: "Buscar Usuario",
            tableData: [
                { id: "id", nombre: "Id", width: "10%" },
                { id: "nombre", nombre: "Nombre", nested: true, nestedId: "persona", width: "50%" },
                { id: "documento", nombre: "Documento", nested: true, nestedId: "persona", width: "40%" },
            ],
            query: this.searchUsuario,
            fallbackToLocal: true,
        };

        return dialog.open(SearchListDialogComponent, {
            data: data,
            height: "80vh",
            width: "70vw",
            panelClass: 'search-dialog-dark'
        }).afterClosed();
    }

    async obtenerFotoPerfil(usuario: Usuario): Promise<string | null> {
        if (usuario.avatar) return usuario.avatar;

        let filename = null;
        if (usuario.persona?.imagenes) {
            const imgs = usuario.persona.imagenes.split(',');
            if (imgs.length > 0) filename = imgs[0].trim();
        }

        if (filename || !usuario.avatar) {
            try {
                const images = await firstValueFrom(this.usuarioService.onGetUsuarioImages(
                    usuario.id,
                    'perfil',
                    true,
                    { networkError: { propagate: true, show: false } }
                ));

                if (images && images.length > 0) {
                    return images[0];
                }
            } catch (e) {
                console.error('Error obteniendo foto de perfil del servidor central', e);
            }
        }

        return null;
    }
}
