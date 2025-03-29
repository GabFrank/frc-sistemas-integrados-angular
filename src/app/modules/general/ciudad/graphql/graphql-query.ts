import gql from 'graphql-tag';

export const ciudadesQuery = gql
  `query{
    data: ciudades {
      id
      descripcion
      codigo
      pais {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
      }
    }
  }`;

export const ciudadesSearch = gql
  `query($texto: String){
    data: ciudadesSearch(texto: $texto){
      id
      descripcion
      codigo
      pais {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
      }
    }
  }`;

export const ciudadQuery = gql
  `query($id: ID!){
    data: ciudad(id: $id){
      id
      descripcion
      codigo
      pais {
        id
        descripcion
      }
      creadoEn
      usuario {
        id
      }
    }
  }`;

export const saveCiudad = gql
  `mutation saveCiudad($entity:CiudadInput!){
    data: saveCiudad(ciudad:$entity){
      id
      descripcion
      codigo
    }
  }`;

export const deleteCiudadQuery = gql
  `mutation deleteCiudad($id: ID!){
    deleteCiudad(id: $id)
  }`;
