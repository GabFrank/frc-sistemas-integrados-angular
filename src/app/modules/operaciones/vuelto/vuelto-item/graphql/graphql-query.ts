import gql from 'graphql-tag';

export const vueltoItemsQuery = gql
  `query{
    data: vueltoItems {
      id
      vuelto {
        id
      }
      valor
      moneda {
        id
        denominacion
        cambio
      }
      creadoEn
      usuario {
        id
      }
    }
  }`;

export const vueltoItemsSearch = gql
  `query($texto: String){
    data : vueltoItemSearch(texto: $texto){
      id
      vuelto {
        id
      }
      valor
      moneda {
        id
        denominacion
        cambio
      }
      creadoEn
      usuario {
        id
      }
    }
  }`

export const vueltoItemQuery = gql
  `query($id: ID!){
    data : vueltoItem(id: $id){
      id
      vuelto {
        id
      }
      valor
      moneda {
        id
        denominacion
        cambio
      }
      creadoEn
      usuario {
        id
      }
    }
  }`

export const saveVueltoItemQuery = gql
  `mutation saveVueltoItem($entity:VueltoItemInput!){
      data: saveVueltoItem(vueltoItem:$entity){
        id
        vuelto {
          id
        }
        valor
        moneda {
          id
          denominacion
          cambio
        }
        creadoEn
        usuario {
          id
        }
      }
    }`

export const deleteVueltoItemQuery = gql
  ` mutation deleteVueltoItem($id: ID!){
      deleteVueltoItem(id: $id)
    }`
