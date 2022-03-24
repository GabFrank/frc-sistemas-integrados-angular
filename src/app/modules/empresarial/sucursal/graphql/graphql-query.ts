import gql from 'graphql-tag';

export const sucursalesQuery = gql
  `{
    data: sucursales {
      id
      nombre
      localizacion
      ciudad{
        id
      }
      creadoEn
      usuario{
        id
      }
    }
  }`;

export const sucursalesSearch = gql
  `query($texto: String){
    data : sucursalesSearch(texto: $texto){
      id
      nombre
      localizacion
      ciudad{
        id
      }
      creadoEn
      usuario{
        id
      }
    }
  }`

export const sucursalQuery = gql
  `query($id: ID!){
    data : sucursal(id: $id){
      id
      nombre
      localizacion
      ciudad{
        id
      }
      creadoEn
      usuario{
        id
      }
    }
  }`

  export const sucursalActualQuery = gql
  `query{
    data : sucursalActual{
      id
      nombre
    }
  }`

export const saveSucursal = gql
  `mutation saveSucursal($entity:SucursalInput!){
      data: saveSucursal(sucursal:$entity){
        id
      }
    }`

export const deleteSucursalQuery = gql
  ` mutation deleteSucursal($id: ID!){
      deleteSucursal(id: $id)
    }`
