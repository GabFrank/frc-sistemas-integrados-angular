import gql from 'graphql-tag';

export const preRegistroFuncionariosQuery = gql`
query($page: Int){
  data: preRegistroFuncionarios(page: $page) {
    id
    nombreCompleto
    apodo
    documento
    telefonoPersonal
    telefonoEmergencia
    nombreContactoEmergencia
    email
    ciudad
    direccion
    sucursal
    fechaNacimiento
    fechaIngreso
    habilidades
    registroConducir
    nivelEducacion
    observacion
    verificado
    creadoEn
  }
}`

export const preRegistroFuncionariosSearch = gql
  `query($texto: String){
    data : preRegistroFuncionariosSearch(texto: $texto){
      id
      nombreCompleto
      apodo
      documento
      telefonoPersonal
      telefonoEmergencia
      nombreContactoEmergencia
      email
      ciudad
      direccion
      sucursal
      fechaNacimiento
      fechaIngreso
      habilidades
      registroConducir
      nivelEducacion
      observacion
      verificado
      creadoEn
    }
  }`

export const preRegistroFuncionarioQuery = gql
  `query($id: ID!){
    data : preRegistroFuncionario(id: $id){
      id
      nombreCompleto
      apodo
      documento
      telefonoPersonal
      telefonoEmergencia
      nombreContactoEmergencia
      email
      ciudad
      direccion
      sucursal
      fechaNacimiento
      fechaIngreso
      habilidades
      registroConducir
      nivelEducacion
      observacion
      verificado
      creadoEn
    }
  }`


export const savePreRegistroFuncionario = gql
  `mutation savePreRegistroFuncionario($entity:PreRegistroFuncionarioInput!){
      data: savePreRegistroFuncionario(preRegistroFuncionario:$entity){
        id
        nombreCompleto
        apodo
        documento
        telefonoPersonal
        telefonoEmergencia
        nombreContactoEmergencia
        email
        ciudad
        direccion
        sucursal
        fechaNacimiento
        fechaIngreso
        habilidades
        registroConducir
        nivelEducacion
        observacion
        verificado
        creadoEn
      }
    }`

export const deletePreRegistroFuncionarioQuery = gql
  ` mutation deletePreRegistroFuncionario($id: ID!){
      deletePreRegistroFuncionario(id: $id)
    }`
