import gql from 'graphql-tag';

export const clientesQuery = gql
  `{
    clientes{
      id
      persona{
        id
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
    clientes : clientePorPersona(texto: $texto){
        id
        persona{
          id
        }
        nombre
        credito
        contactos{
          id
          telefono
        }
    }
  }`

export const clienteSearchByPersonaId = gql
`query($id: ID){
  cliente : clientePorPersonaId(id: $id){
      id
      persona{
        id
      }
      nombre
      credito
      contactos{
        id
        telefono
      }
  }
}`

export const clientesSearchByTelefono = gql
  `query($texto: String){
    clientes : clientePorTelefono(texto: $texto){
      id
        persona{
          id
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
    cliente(id: $id){
      id
        persona{
          id
        }
        nombre
        credito
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
      }
    }`

export const deleteClienteQuery = gql
  ` mutation deleteCliente($id: ID!){
    deleteCliente(id: $id)
}`


