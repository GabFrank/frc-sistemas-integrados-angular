import gql from 'graphql-tag';

export const sectoresQuery = gql
  `query($id: ID!){
  data : sectores(id: $id){
    id
    descripcion
    activo
    pdvCategoria{
      id
    }
    pdvGruposProductos{

    }
    creadoEn
    usuario {
      
    }
  }
}`

export const sectoresSearch = gql
  `query($texto: String){
    data : sectoresSearch(texto: $texto){
      id
      sucursal {
        nombre
      }
      descripcion
      activo
      creadoEn
      usuario{
        id
      }
      zonaList {
        id
        descripcion
        activo
      }
    }
  }`

export const sectorQuery = gql
  `query($id: ID!){
    data : sector(id: $id){
      id
      sucursal {
        nombre
      }
      descripcion
      activo
      creadoEn
      usuario{
        id
      }
      zonaList {
        id
        descripcion
        activo
      }
    }
  }`


export const saveSector = gql
  `mutation saveSector($entity:SectorInput!){
      data: saveSector(sector:$entity){
        id
      sucursal {
        nombre
      }
      descripcion
      activo
      creadoEn
      usuario{
        id
      }
      zonaList {
        id
        descripcion
        activo
      }
      }
    }`

export const deleteSectorQuery = gql
  ` mutation deleteSector($id: ID!){
      deleteSector(id: $id)
    }`
