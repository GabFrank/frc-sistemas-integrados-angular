import gql from 'graphql-tag';

export const equipoByIdQuery = gql`
  query equipo($id: ID!) {
    data: equipo(id: $id) {
      id
      identificador
      modelo {
        id
        descripcion
        marca {
          id
          descripcion
        }
      }
      descripcion
      imagenes
      consumeEnergia
      consumoValor
      creadoEn
      propietario {
        id
        nombre
      }
      tipoEquipo {
        id
        descripcion
      }
      financiero {
        id
        costo
        valorTasacion
        valorTasacionPyg
        valorTasacionBrl
        situacionPago
        montoTotal
        montoYaPagado
        cantidadCuotas
        cantidadCuotasPagadas
        diaVencimiento
        proveedor {
          id
          persona {
            id
            nombre
          }
        }
        moneda {
          id
          denominacion
          simbolo
        }
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const equipoSearchPageQuery = gql`
  query equipoSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: equipoSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        identificador
        modelo {
          id
          descripcion
          marca {
            id
            descripcion
          }
        }
        descripcion
        consumeEnergia
        consumoValor
        propietario {
          id
          nombre
        }
        tipoEquipo {
          id
          descripcion
        }
        financiero {
          valorTasacion
          valorTasacionPyg
          valorTasacionBrl
          situacionPago
          proveedor {
            id
            persona {
              id
              nombre
            }
          }
          moneda {
            id
            denominacion
            simbolo
          }
        }
      }
    }
  }
`;

export const tipoEquipoSearchPageQuery = gql`
  query tipoEquipoSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: tipoEquipoSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        descripcion
      }
    }
  }
`;

export const saveEquipoMutation = gql`
  mutation saveEquipo($entity: EquipoInput!) {
    data: saveEquipo(equipo: $entity) {
      id
      identificador
      descripcion
    }
  }
`;

export const deleteEquipoMutation = gql`
  mutation deleteEquipo($id: ID!) {
    data: deleteEquipo(id: $id)
  }
`;

export const saveTipoEquipoMutation = gql`
  mutation saveTipoEquipo($entity: TipoEquipoInput!) {
    data: saveTipoEquipo(tipoEquipo: $entity) {
      id
      descripcion
    }
  }
`;

export const marcaEquipoSearchQuery = gql`
  query marcaEquipoSearch($texto: String) {
    data: marcaEquipoSearch(texto: $texto) {
      id
      descripcion
    }
  }
`;

export const modeloEquipoSearchPageQuery = gql`
  query modeloEquipoSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: modeloEquipoSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        descripcion
        marca {
          id
          descripcion
        }
      }
    }
  }
`;

export const saveMarcaEquipoMutation = gql`
  mutation saveMarcaEquipo($entity: MarcaEquipoInput!) {
    data: saveMarcaEquipo(marcaEquipo: $entity) {
      id
      descripcion
    }
  }
`;

export const saveModeloEquipoMutation = gql`
  mutation saveModeloEquipo($entity: ModeloEquipoInput!) {
    data: saveModeloEquipo(modeloEquipo: $entity) {
      id
      descripcion
      marca {
        id
        descripcion
      }
    }
  }
`;
