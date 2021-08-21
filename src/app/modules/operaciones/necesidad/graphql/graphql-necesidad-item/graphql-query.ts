import gql from 'graphql-tag';

export const necesidadItensQuery = gql
  `{
    data : necesidadItens {
      id
    necesidad{
      id
    }
    producto{
      id
      descripcion
    }
    autogenerado
    cantidadSugerida
    modificado
    cantidad
    frio
    observacion
    estado
    creadoEn
    usuario{
      id
    }
    }
  }`

  export const necesidadItensPorFechaQuery = gql
  `query($start: String, $end: String){
    data : necesidadItensPorFecha(start: $start, end: $end) {
      id
    necesidad{
      id
    }
    producto{
      id
      descripcion
    }
    autogenerado
    cantidadSugerida
    modificado
    cantidad
    frio
    observacion
    estado
    creadoEn
    usuario{
      id
    }
    }
  }`

export const necesidadItensSearch = gql
  `query($texto: String){
    data : necesidadItensSearch(texto: $texto){
      id
    necesidad{
      id
    }
    producto{
      id
      descripcion
    }
    autogenerado
    cantidadSugerida
    modificado
    cantidad
    frio
    observacion
    estado
    creadoEn
    usuario{
      id
    }
    }
  }`

export const necesidadItemQuery = gql
  `query($id: ID!){
    data : necesidadItem(id: $id){
      id
      necesidad{
        id
      }
      producto{
        id
        descripcion
      }
      autogenerado
      cantidadSugerida
      modificado
      cantidad
      frio
      observacion
      estado
      creadoEn
      usuario{
        id
      }
    }
  }`

export const savenecesidadItem = gql
  `mutation savenecesidadItem($entity:necesidadItemInput!){
      data: savenecesidadItem(necesidadItem:$entity){
        id
      }
    }`

export const deletenecesidadItemQuery = gql
  ` mutation deletenecesidadItem($id: ID!){
      deletenecesidadItem(id: $id)
  }`


