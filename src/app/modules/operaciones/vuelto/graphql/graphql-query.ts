import gql from 'graphql-tag';

export const vueltosQuery = gql
  `query ($sucId: ID){
    data: vueltos (sucId: $sucId) {
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
  `query($texto: String, $sucId: ID){
    data : vueltoSearch(texto: $texto, sucId: $sucId){
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
  `query($id: ID!, $sucId: ID){
    data : vuelto(id: $id, sucId: $sucId){
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
  ` mutation deleteVuelto($id: ID!, $sucId: ID){
      deleteVuelto(id: $id, sucId: $sucId)
    }`
