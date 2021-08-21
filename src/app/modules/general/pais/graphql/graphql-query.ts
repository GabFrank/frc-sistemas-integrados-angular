import gql from 'graphql-tag';

export const paisQuery = gql
  `{
    pais {
      id
      descripcion
      codigo
    }
  }`

export const paisesSearch = gql
  `query($texto: String){
    data : paisesSearch(texto: $texto){
      id
      descripcion
      codigo
    }
  }`

export const paisesQuery = gql
  `query($id: ID!){
    data : pais(id: $id){
      id
      descripcion
      codigo
    }
  }`

export const savePais = gql
  `mutation savePais($entity:PaisInput!){
      data: savePais(pais:$entity){
        id
        descripcion
        codigo
      }
    }`

export const deletePaisQuery = gql
  ` mutation deletePais($id: ID!){
      deletePais(id: $id)
    }`
