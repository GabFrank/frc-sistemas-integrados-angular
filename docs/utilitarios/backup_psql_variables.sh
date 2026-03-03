#!/bin/bash

# Script avanzado para backups usando psql con variables
# Permite usar variables de PostgreSQL para personalizar el backup

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Función para backup con variables personalizadas
backup_with_variables() {
    local db_name="$1"
    local db_host="$2"
    local db_port="$3"
    local backup_type="$4"
    
    echo "🔄 Iniciando backup de '$db_name' con variables personalizadas..."
    
    # Variables de PostgreSQL
    export PG_HOST="$db_host"
    export PG_PORT="$db_port"
    export PG_DATABASE="$db_name"
    export BACKUP_TIMESTAMP="$TIMESTAMP"
    export BACKUP_TYPE="$backup_type"
    
    local backup_file="$BACKUP_DIR/${db_name}_${backup_type}_backup_$TIMESTAMP.sql"
    
    # Usar psql con variables para crear backup personalizado
    psql -h "$db_host" -p "$db_port" -d "$db_name" \
        -v backup_file="'$backup_file'" \
        -v backup_timestamp="'$TIMESTAMP'" \
        -v backup_type="'$backup_type'" \
        -v db_name="'$db_name'" \
        -f - << 'EOF'
-- Script de backup usando variables de PostgreSQL
\echo 'Iniciando backup con variables:'
\echo 'Archivo: ' :backup_file
\echo 'Timestamp: ' :backup_timestamp
\echo 'Tipo: ' :backup_type
\echo 'Base de datos: ' :db_name

-- Crear archivo de backup
\copy (
    SELECT 
        '-- Backup de PostgreSQL' as header,
        '-- Base de datos: ' || :'db_name' as db_info,
        '-- Timestamp: ' || :'backup_timestamp' as timestamp_info,
        '-- Tipo: ' || :'backup_type' as type_info,
        '-- Generado el: ' || now()::text as generated_info
) TO :backup_file WITH CSV HEADER;

-- Agregar información de esquemas
\copy (
    SELECT 
        '-- Esquemas disponibles:' as schema_header,
        schemaname as schema_name
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    GROUP BY schemaname
    ORDER BY schemaname
) TO :backup_file WITH CSV HEADER;

-- Agregar información de tablas
\copy (
    SELECT 
        '-- Tablas en la base de datos:' as table_header,
        schemaname as schema_name,
        tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    ORDER BY schemaname, tablename
) TO :backup_file WITH CSV HEADER;

\echo 'Backup completado exitosamente'
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Backup de '$db_name' completado: $backup_file"
        echo "📊 Tamaño del archivo: $(du -h "$backup_file" | cut -f1)"
    else
        echo "❌ Error en backup de '$db_name'"
        return 1
    fi
}

# Función para backup de datos específicos con variables
backup_data_with_variables() {
    local db_name="$1"
    local db_host="$2"
    local db_port="$3"
    local table_pattern="$4"
    
    echo "🔄 Iniciando backup de datos de '$db_name' (patrón: $table_pattern)..."
    
    local backup_file="$BACKUP_DIR/${db_name}_data_${table_pattern}_backup_$TIMESTAMP.sql"
    
    psql -h "$db_host" -p "$db_port" -d "$db_name" \
        -v backup_file="'$backup_file'" \
        -v table_pattern="'$table_pattern'" \
        -v db_name="'$db_name'" \
        -f - << 'EOF'
-- Backup de datos específicos usando variables
\echo 'Iniciando backup de datos:'
\echo 'Archivo: ' :backup_file
\echo 'Patrón de tabla: ' :table_pattern
\echo 'Base de datos: ' :db_name

-- Obtener lista de tablas que coinciden con el patrón
\copy (
    SELECT 
        '-- Tablas encontradas con patrón ' || :'table_pattern' || ':' as header,
        schemaname || '.' || tablename as full_table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    AND tablename LIKE :'table_pattern'
    ORDER BY schemaname, tablename
) TO :backup_file WITH CSV HEADER;

\echo 'Backup de datos completado'
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Backup de datos de '$db_name' completado: $backup_file"
        echo "📊 Tamaño del archivo: $(du -h "$backup_file" | cut -f1)"
    else
        echo "❌ Error en backup de datos de '$db_name'"
        return 1
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "Script de backup usando psql con variables"
    echo ""
    echo "Uso: $0 [OPCIÓN] [PARÁMETROS]"
    echo ""
    echo "Opciones:"
    echo "  info-servidor     - Información de la base de datos 'servidor'"
    echo "  info-general      - Información de la base de datos 'general'"
    echo "  data-servidor     - Backup de datos de 'servidor' con patrón"
    echo "  data-general      - Backup de datos de 'general' con patrón"
    echo "  help              - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 info-servidor"
    echo "  $0 info-general"
    echo "  $0 data-servidor 'user%'"
    echo "  $0 data-general 'product%'"
}

# Procesar argumentos
case "${1:-help}" in
    "info-servidor")
        backup_with_variables "servidor" "172.25.1.200" "5551" "info"
        ;;
    "info-general")
        backup_with_variables "general" "172.25.1.6" "5551" "info"
        ;;
    "data-servidor")
        table_pattern="${2:-%}"
        backup_data_with_variables "servidor" "172.25.1.200" "5551" "$table_pattern"
        ;;
    "data-general")
        table_pattern="${2:-%}"
        backup_data_with_variables "general" "172.25.1.6" "5551" "$table_pattern"
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
echo "📁 Archivos de backup guardados en: $BACKUP_DIR"
echo "📅 Timestamp: $TIMESTAMP"


