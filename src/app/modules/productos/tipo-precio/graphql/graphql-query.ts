import gql from 'graphql-tag';

export const tipoPreciosQuery = gql
  `query{
    data : tipoPrecios{
      id
      descripcion
      activo
      autorizacion
      creadoEn
      usuario{id}
   }
  }`

export const tipoPrecioSearch = gql
  `query($texto: String){
    data : tipoPrecioSearch(texto: $texto){
      id
      descripcion
      activo
      autorizacion
      creadoEn
      usuario{id}
   }
  }`

export const tipoPrecioQuery = gql
  `query($id: ID!){
    tipoPrecio(id: $id){
      id
      descripcion
      activo
      autorizacion
      creadoEn
      usuario{id}
   }
  }`

export const saveTipoPrecio = gql
  `mutation saveTipoPrecio($entity:TipoPreciosInput!){
      data: saveTipoPrecio(tipoPrecios:$entity){
        id
      }
    }`

export const deleteTipoPrecioQuery = gql
  ` mutation deleteTipoPrecios($id: ID!){
    deleteTipoPrecios(id: $id)
}`


