import gql from 'graphql-tag';

export const barriosQuery = gql
  `{
    barrios {
    id
    descripcion
    ciudad {
      id
      descripcion
    }
    precioDelivery {
      id
      valor
    }
    creadoEn
    usuario {
      id
    }
    }
  }`

export const barrioQuery = gql
  `query($id: ID!){
    barrio(id: $id){
      id
    descripcion
    ciudad {
      id
      descripcion
    }
    precioDelivery {
      id
      valor
    }
    creadoEn
    usuario {
      id
    }
    }
  }`

export const barriosPorCiudadQuery = gql
`query($id: Int!){
  data : barriosPorCiudadId(id: $id){
    id
    descripcion
    ciudad {
      id
      descripcion
    }
    precioDelivery {
      id
      valor
    }
    creadoEn
    usuario {
      id
    }
  }
}`

export const saveBarrio = gql
  `mutation saveBarrio($entity:BarrioInput!){
      data: saveBarrio(barrio:$entity){
        id
      }
    }`

export const deleteBarrioQuery = gql
  ` mutation deleteBarrio($id: ID!){
    deleteBarrio(id: $id)
}`


