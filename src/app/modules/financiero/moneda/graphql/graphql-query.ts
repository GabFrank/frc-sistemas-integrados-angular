import gql from 'graphql-tag';

export const monedasQuery = gql
  `{
    data : monedas{
      id
    denominacion
    simbolo
    pais{
      id
      descripcion
    }
    cambio
    }
  }`

export const monedasSearch = gql
  `query($texto: String){
    monedas : monedasSearch(texto: $texto){
      id
    denominacion
    simbolo
    pais{
      id
      descripcion
    }
    }
  }`

export const monedaQuery = gql
  `query($id: ID!){
    moneda(id: $id){
      id
    denominacion
    simbolo
    pais{
      id
      descripcion
    }
    }
  }`

export const saveMoneda = gql
  `mutation saveMoneda($entity:MonedaInput!){
      data: saveMoneda(moneda:$entity){
        id
      }
    }`

export const deleteMonedaQuery = gql
  ` mutation deleteMoneda($id: ID!){
    deleteMoneda(id: $id)
}`


