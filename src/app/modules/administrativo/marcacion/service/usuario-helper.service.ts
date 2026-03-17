import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { PersonaService } from '../../../personas/persona/persona.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { UsuarioSearchPageGQL } from '../../../personas/usuarios/graphql/usuarioSearchPage';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class UsuarioHelperService {

    constructor(
        private usuarioService: UsuarioService,
        private personaService: PersonaService,
        private notificacionService: NotificacionSnackbarService,
        private searchUsuarioPage: UsuarioSearchPageGQL
    ) { }

    buscarUsuarioPorId(id: number): Observable<Usuario | null> {
        return this.usuarioService.onGetUsuarioPorPersonaId(id, true, { networkError: { propagate: true, show: false } })
            .pipe(
                catchError(err => {
                    console.warn('Error fetching usuario from central, trying local...', err);
                    return this.usuarioService.onGetUsuarioPorPersonaId(id, false);
                }),
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
            query: this.searchUsuarioPage,
            paginator: true,
            inicialSearch: true,
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
                } else {
                    const localImages = await firstValueFrom(this.usuarioService.onGetUsuarioImages(usuario.id, 'perfil', false));
                    if (localImages && localImages.length > 0) {
                        return localImages[0];
                    }
                }
            } catch (e) {
                console.warn('Error fetching image from central, trying local...', e);
                try {
                    const localImages = await firstValueFrom(this.usuarioService.onGetUsuarioImages(usuario.id, 'perfil', false));
                    if (localImages && localImages.length > 0) {
                        return localImages[0];
                    }
                } catch (e2) {
                    console.error('Error fetching image from local', e2);
                }
            }
        }

        return null;
    }
}
