
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { CopiaHorarioResultado, Horario, HorarioInput } from '../models/horario.model';
import { HorarioByIdGQL } from '../graphql/horarioById';
import { SaveHorarioGQL } from '../graphql/saveHorario';
import { DeleteHorarioGQL } from '../graphql/deleteHorario';
import { HorariosGQL } from '../graphql/horarios';
import { HorariosPorUsuarioGQL } from '../graphql/horariosPorUsuario';
import { SaveHorariosUsuarioGQL } from '../graphql/saveHorariosUsuario';
import { CopiarHorarioGQL } from '../graphql/copiarHorario';

@Injectable({
    providedIn: 'root'
})
export class HorarioService {

    constructor(
        private genericCrudService: GenericCrudService,
        private horarioById: HorarioByIdGQL,
        private saveHorario: SaveHorarioGQL,
        private deleteHorario: DeleteHorarioGQL,
        private horarios: HorariosGQL,
        private horariosPorUsuario: HorariosPorUsuarioGQL,
        private saveHorariosUsuario: SaveHorariosUsuarioGQL,
        private copiarHorario: CopiarHorarioGQL
    ) { }

    /**
     * Guarda la tabla del usuario entera de una vez (#523): el central valida que no se crucen.
     * Sin aviso genérico: el de 3 s («Ups! Algo salió mal») no dejaba leer qué horarios chocan,
     * así que la pantalla muestra el suyo.
     */
    onSaveHorariosUsuario(usuarioId: number, horarios: HorarioInput[]): Observable<Horario[]> {
        return this.genericCrudService.onCustomMutation(this.saveHorariosUsuario, { usuarioId, horarios }, true, true);
    }

    /** Copia el horario a cada funcionario como horario propio; el central busca su cuenta. */
    onCopiarHorario(horarioId: number, funcionarioIds: number[]): Observable<CopiaHorarioResultado> {
        return this.genericCrudService.onCustomMutation(this.copiarHorario, { horarioId, funcionarioIds });
    }

    onGetHorario(id: number, servidor = true): Observable<Horario> {
        return this.genericCrudService.onGetById(this.horarioById, id, null, null, servidor);
    }

    /** `errorConf` y `contexto` son para la asignación en lote (#390); sin ellos queda como antes. */
    onGetHorariosPorUsuario(usuarioId: number, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Horario[]> {
        return this.genericCrudService.onCustomQuery(this.horariosPorUsuario, { usuarioId }, servidor, errorConf, undefined, contexto);
    }

    onGetAllHorarios(page?: number, size?: number, servidor = true): Observable<PageInfo<Horario>> {
        return this.genericCrudService.onGetAll(this.horarios, page, size, servidor);
    }

    /**
     * `errorConf` es para la asignación en lote (#390): sin él, un error de red no llega nunca.
     * `opciones.avisarExito = false`, para la pantalla que muestra su propio verde (#501).
     */
    onSaveHorario(input: HorarioInput, servidor = true, errorConf?: QueryError,
                  opciones?: { avisarExito?: boolean }): Observable<Horario> {
        return this.genericCrudService.onSave(this.saveHorario, input, null, null, servidor, errorConf, undefined, opciones);
    }

    onDeleteHorario(id: number, servidor = true): Observable<boolean> {
        return this.genericCrudService.onDelete(this.deleteHorario, id, '¿Estás seguro de eliminar este horario?', null, true, servidor);
    }
}
