import gql from 'graphql-tag';

export const funcionariosQuery = gql
  `{
    funcionarios {
      id
      credito
      nombrePersona
      persona {
        id
      }
      nombreCargo
      sueldo
      fechaIngreso
      nombreSupervisor
      diarista
      nombreSucursal
      creadoEn
    }
  }`

export const funcionariosSearch = gql
  `query($texto: String){
    data : funcionariosSearch(texto: $texto){
      id
      credito
      nombrePersona
      persona {
        id
      }
      nombreCargo
      sueldo
      fechaIngreso
      nombreSupervisor
      diarista
      nombreSucursal
      creadoEn
    }
  }`

export const funcionarioQuery = gql
  `query($id: ID!){
    data : funcionario(id: $id){
      id
      credito
      nombrePersona
      nombreCargo
      sueldo
      fechaIngreso
      nombreSupervisor
      diarista
      nombreSucursal
      creadoEn
    }
  }`

export const saveFuncionario = gql
  `mutation saveFuncionario($entity:FuncionarioInput!){
      data: saveFuncionario(funcionario:$entity){
        id
        credito
        nombrePersona
        nombreCargo
        sueldo
        fechaIngreso
        nombreSupervisor
        diarista
        nombreSucursal
        creadoEn
      }
    }`

export const deleteFuncionarioQuery = gql
  ` mutation deleteFuncionario($id: ID!){
      deleteFuncionario(id: $id)
    }`
