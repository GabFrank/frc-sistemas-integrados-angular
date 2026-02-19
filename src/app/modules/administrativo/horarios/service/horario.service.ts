
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { MainService } from '../../../../main.service';
import { PageInfo } from '../../../../app.component';
import { Horario, HorarioInput } from '../models/horario.model';
import { HorarioByIdGQL } from '../graphql/horarioById';
import { SaveHorarioGQL } from '../graphql/saveHorario';
import { DeleteHorarioGQL } from '../graphql/deleteHorario';
import { HorariosGQL } from '../graphql/horarios';

@Injectable({
    providedIn: 'root'
})
export class HorarioService {

    constructor(
        private genericCrudService: GenericCrudService,
        private mainService: MainService,
        private horarioById: HorarioByIdGQL,
        private saveHorario: SaveHorarioGQL,
        private deleteHorario: DeleteHorarioGQL,
        private horarios: HorariosGQL
    ) { }

    onGetHorario(id: number, servidor = true): Observable<Horario> {
        return this.genericCrudService.onGetById(this.horarioById, id, null, null, servidor);
    }

    onGetAllHorarios(page?: number, size?: number, servidor = true): Observable<PageInfo<Horario>> {
        return this.genericCrudService.onGetAll(this.horarios, page, size, servidor);
    }

    onSaveHorario(input: HorarioInput, servidor = true): Observable<Horario> {
        if (!input.usuarioId && this.mainService.usuarioActual?.id) {
            input.usuarioId = this.mainService.usuarioActual.id;
        }
        return this.genericCrudService.onSave(this.saveHorario, input, null, null, servidor);
    }

    onDeleteHorario(id: number, servidor = true): Observable<boolean> {
        return this.genericCrudService.onDelete(this.deleteHorario, id, '¿Estás seguro de eliminar este horario?', null, true, servidor);
    }
}
