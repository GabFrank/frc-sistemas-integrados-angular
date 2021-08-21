import gql from 'graphql-tag';

export const preciosDeliveryQuery = gql
  `query {
    data : deliveryPrecios {
    id
    valor
    descripcion
    activo
    }
  }`

export const precioDeliveryQuery = gql
  `query($id: ID!){
    deliveryPrecio(id: $id){
      id
      valor
      descripcion
      activo
    }
  }`

export const savePrecioDelivery = gql
  `mutation savePrecioDelivery($entity:PrecioDeliveryInput!){
      data: savePrecioDelivery(precioDelivery:$entity){
        id
      }
    }`

export const deletePrecioDeliveryQuery = gql
  ` mutation deletePrecioDelivery($id: ID!){
    deletePrecioDelivery(id: $id)
}`


