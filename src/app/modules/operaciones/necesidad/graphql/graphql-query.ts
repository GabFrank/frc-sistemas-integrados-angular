import gql from 'graphql-tag';

export const necesidadesQuery = gql
  `{
    data : necesidades {
      id
      nombreSucursal
      sucursal{
        id
        nombre
      }
      fecha
      estado
      nombreUsuario
      usuario{
        id
        nombre
      }
      necesidadItens{
        id
        producto{
          id
          descripcion
        }
        autogenerado
        cantidadSugerida
        modificado
        cantidad
        frio
      }
    }
  }`

  export const necesidadesPorFechaQuery = gql
  `query($start: String, $end: String){
    data : necesidadesPorFecha(start: $start, end: $end) {
      id
      nombreSucursal
      sucursal{
        id
        nombre
      }
      fecha
      estado
      nombreUsuario
      usuario{
        id
        nombre
      }
      necesidadItens{
        id
        producto{
          id
          descripcion
        }
        autogenerado
        cantidadSugerida
        modificado
        cantidad
        frio
      }
    }
  }`

export const necesidadesSearch = gql
  `query($texto: String){
    data : necesidadesSearch(texto: $texto){
      id
      nombreSucursal
      nombreUsuario
      sucursal{
        id
        nombre
      }
      fecha
      estado
      usuario{
        id
        nombre
      }
      necesidadItens{
        id
        producto{
          id
          descripcion
        }
        autogenerado
        cantidadSugerida
        modificado
        cantidad
        frio
      }
    }
  }`

export const necesidadQuery = gql
  `query($id: ID!){
    data : necesidad(id: $id){
    id
    sucursal{
      id
      nombre
    }
    fecha
    estado
    usuario{
      id
      nombre
    }
    necesidadItens{
      id
      producto{
        id
        descripcion
      }
      autogenerado
      cantidadSugerida
      modificado
      cantidad
      frio
    }
    }
  }`

export const saveNecesidad = gql
  `mutation saveNecesidad($entity:NecesidadInput!){
      data: saveNecesidad(necesidad:$entity){
        id
      }
    }`

export const deleteNecesidadQuery = gql
  ` mutation deleteNecesidad($id: ID!){
      deleteNecesidad(id: $id)
  }`


