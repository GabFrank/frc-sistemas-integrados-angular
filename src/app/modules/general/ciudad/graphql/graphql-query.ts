import gql from 'graphql-tag';

export const ciudadQuery = gql
  `{
    ciudad {
      id
      descripcion
      codigo
    }
  }`

export const ciudadesSearch = gql
  `query($texto: String){
    data : ciudadesSearch(texto: $texto){
      id
      descripcion
      codigo
    }
  }`

export const ciudadesQuery = gql
  `query($id: ID!){
    data : ciudad(id: $id){
      id
      descripcion
      codigo
    }
  }`

export const saveCiudad = gql
  `mutation saveCiudad($entity:CiudadInput!){
      data: saveCiudad(ciudad:$entity){
        id
        descripcion
        codigo
      }
    }`

export const deleteCiudadQuery = gql
  ` mutation deleteCiudad($id: ID!){
      deleteCiudad(id: $id)
    }`
