import gql from 'graphql-tag';

export const actualizacionesQuery = gql
  `{
  data : actualizaciones{
    id
    currentVersion
    enabled
    nivel
    tipo
    title
    msg
    btn
    usuario {
      id
      persona {
        nombre
      }
    }
    creadoEn
  }
}`

export const ultimaActualizacion = gql
  `query($tipo: TipoActualizacion){
    data : ultimaActualizacion(tipo: $tipo){
      id
      currentVersion
      enabled
      nivel
      tipo
      title
      msg
      btn
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
      }
  }`

export const actualizacionQuery = gql
  `query($id: ID!){
    data : actualizacion(id: $id){
      id
    currentVersion
    enabled
    nivel
    tipo
    title
    msg
    btn
    usuario {
      id
      persona {
        nombre
      }
    }
    creadoEn
    }
  }`


export const saveActualizacion = gql
  `mutation saveActualizacion($entity:ActualizacionInput!){
      data: saveActualizacion(actualizacion:$entity){
        id
        currentVersion
        enabled
        nivel
        tipo
        title
        msg
        btn
        usuario {
          id
          persona {
            nombre
          }
        }
        creadoEn
      }
}`

export const deleteActualizacionQuery = gql
  ` mutation deleteActualizacion($id: ID!){
      deleteActualizacion(id: $id)
    }`
