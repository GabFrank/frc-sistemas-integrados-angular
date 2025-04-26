import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Ciudad } from "../../general/ciudad/ciudad.model";
import { Funcionario } from "./funcionario.model";

export class PreRegistroFuncionario {
  id:number;
  funcionario: Funcionario
  nombreCompleto: string
  apodo: string
  documento: string
  telefonoPersonal: string
  telefonoEmergencia: string
  nombreContactoEmergencia: string
  email: string
  ciudad: string
  direccion: string
  sucursal: string
  fechaNacimiento: Date
  fechaIngreso: Date
  habilidades: string
  registroConducir : boolean
  nivelEducacion: string
  observacion: string
  verificado: boolean
  creadoEn: Date

  toInput(): PreRegistroFuncionarioInput {
    let input = new PreRegistroFuncionarioInput()
    input.id = this.id
    input.funcionarioId = this.funcionario?.id
    input.nombreCompleto = this.nombreCompleto
    input.apodo = this.apodo
    input.documento = this.documento
    input.telefonoPersonal = this.telefonoPersonal
    input.telefonoEmergencia = this.telefonoEmergencia
    input.nombreContactoEmergencia = this.nombreContactoEmergencia
    input.email = this.email
    input.ciudad = this.ciudad
    input.direccion = this.direccion
    input.sucursal = this.sucursal
    input.fechaNacimiento = dateToString(this.fechaNacimiento)
    input.fechaIngreso = dateToString(this.fechaIngreso)
    input.habilidades = this.habilidades
    input.registroConducir = this.registroConducir
    input.nivelEducacion = this.nivelEducacion
    input.observacion = this.observacion
    return input;
  }
}

export class PreRegistroFuncionarioInput{
  id:number;
  funcionarioId: number
  nombreCompleto: string
  apodo: string
  documento: string
  telefonoPersonal: string
  telefonoEmergencia: string
  nombreContactoEmergencia: string
  email: string
  ciudad: string
  direccion: string
  sucursal: string
  fechaNacimiento: string
  fechaIngreso: string
  habilidades: string
  registroConducir : boolean
  nivelEducacion: string
  observacion: string
}
