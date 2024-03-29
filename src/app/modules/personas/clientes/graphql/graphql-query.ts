import gql from 'graphql-tag';

export const clientesQuery = gql
  `{
    clientes{
      id
      persona{
        id
        nombre
      }
      nombre
      credito
      contactos{
        id
        telefono
      }
    }
  }`

export const clientesSearchByPersona = gql
  `query($texto: String){
    data : clientePorPersona(texto: $texto){
      id
      persona{
        id
        nombre
        direccion
      }
      nombre
      credito
      saldo
      tipo
      codigo
      contactos{
        id
        telefono
      }
    }
  }`

export const clientePorPersonaDocumento = gql
  `query($texto: String){
    data : clientePorPersonaDocumento(texto: $texto){
        id
        persona{
          id
          nombre
          direccion
        }
        nombre
        credito
        contactos{
          id
          telefono
        }
    }
  }`

export const clienteConFiltros = gql
  `query($texto: String, $tipo: TipoCliente, $page: Int, $size: Int){
    data : onSearchWithFilters(texto: $texto, tipo: $tipo page: $page, size: $size){
        id
        persona{
          id
          nombre
          apodo
          telefono
          email
          direccion
          documento
          nacimiento
        }
        nombre
        credito
        saldo
        tipo
        contactos{
          id
          telefono
        }
        creadoEn
        usuarioId {
          nickname
        }
    }
  }`

export const clienteSearchByPersonaId = gql
  `query($id: ID){
  data : clientePorPersonaId(id: $id){
      id
      persona{
        id
        nombre
      }
      nombre
      credito
      contactos{
        id
        telefono
      }
      saldo
      tipo
      codigo
  }
}`

export const clientePorPersonaIdFromServer = gql
  `query($id: ID){
  data : clientePorPersonaIdFromServer(id: $id){
      id
      persona{
        id
        nombre
      }
      nombre
      credito
      contactos{
        id
        telefono
      }
      saldo
      tipo
      codigo
  }
}`



export const clientesSearchByTelefono = gql
  `query($texto: String){
    data : clientePorTelefono(texto: $texto){
      id
      persona{
        id
        nombre
      }
      nombre
      credito
      contactos{
        id
        telefono
      }
    }
  }`

export const clienteQuery = gql
  `query($id: ID!){
    data: cliente(id: $id){
      id
      persona{
        id
        nombre
        apodo
        telefono
        email
        direccion
        documento
        nacimiento
      }
      nombre
      credito
      tipo
      contactos{
        id
        telefono
      }
    }
  }`

export const saveCliente = gql
  `mutation saveCliente($entity:ClienteInput!){
      data: saveCliente(cliente:$entity){
        id
        persona{
          id
          nombre
          apodo
          telefono
          email
          direccion
          documento
          nacimiento
        }
        nombre
        credito
        saldo
        tipo
        contactos{
          id
          telefono
        }
        creadoEn
        usuarioId {
          nickname
        }
      }
    }`

export const deleteClienteQuery = gql
  ` mutation deleteCliente($id: ID!){
    deleteCliente(id: $id)
}`


