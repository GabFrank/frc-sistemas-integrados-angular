import gql from 'graphql-tag';

export const vueltosQuery = gql
  `query{
    data: vueltos {
      id
      activo
      responsable {
        id
      }
      autorizadoPor {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }`;

export const vueltosSearch = gql
  `query($texto: String){
    data : vueltoSearch(texto: $texto){
      id
      activo
      responsable {
        id
      }
      autorizadoPor {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }`

export const vueltoQuery = gql
  `query($id: ID!){
    data : vuelto(id: $id){
      id
      activo
      responsable {
        id
      }
      autorizadoPor {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }`

export const saveVueltoQuery = gql
  `mutation saveVuelto($entity:VueltoInput!){
      saveVuelto(vuelto:$entity){
        id
      }
    }`

export const deleteVueltoQuery = gql
  ` mutation deleteVuelto($id: ID!){
      deleteVuelto(id: $id)
    }`
