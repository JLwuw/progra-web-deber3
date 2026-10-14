# 1. Descripción general del proyecto
Mi Cartelera Personal es una aplicación web donde cada usuario registra, organiza y califica las películas y series que quiere ver, está viendo, o ya vio. La app consume el API pública de The Movie Database (TMDB) para buscar títulos reales (con póster, sinopsis, elenco y calificación oficial), y permite a cada usuario guardar su propia versión personalizada de esa información en una base de datos relacional en Supabase, protegida por autenticación.

Este proyecto integra, en un solo producto funcional, los cuatro pilares trabajados en el curso: un frontend construido con React y TypeScript, consumo de un API externo autenticado con API key, persistencia de datos propios en una base de datos relacional (Supabase/PostgreSQL), y control de acceso mediante registro, login y manejo de sesiones con Supabase Auth.


## 1.3 Requisitos funcionales obligatorios
**Acceso controlado**: ninguna pantalla de la app es visible sin haber iniciado sesión. Debe existir una pantalla de registro y una de login, y un botón de logout visible en todo momento.

**Búsqueda en TMDB**: un campo de búsqueda que consulte el endpoint de búsqueda de TMDB y muestre resultados con póster, título y año, manejando estados de carga y error.

**Agregar a mi lista**: desde un resultado de búsqueda, el usuario puede agregarlo a su colección personal, guardado en la tabla propia de Supabase (no en TMDB).

**CRUD completo sobre la colección personal**: leer (ver mi lista), actualizar (cambiar estado, calificación o comentario) y eliminar un título de la colección.

**Estado de visualización**: cada título guardado tiene un estado de un conjunto fijo: "por ver", "viendo" o "vista" (tipo union en TypeScript).

**Calificación y comentario personal**: cada título permite una calificación propia (1 a 5) y un comentario de texto libre, independientes de la calificación oficial de TMDB.

**Página de detalle**: al hacer clic en un título de la colección, se abre una vista ampliada con toda la información (póster grande, sinopsis completa, elenco, calificación personal y comentario).

**Seguridad real (RLS)**: cada usuario solo puede ver, editar o eliminar los títulos que él mismo agregó — verificado con políticas de Row Level Security, no solo con lógica en el frontend.

## 1.4 Requisitos opcionales (puntos extra)
Filtrar la colección personal por estado ("por ver" / "viendo" / "vista").

Ordenar la colección por calificación personal o por fecha agregada.

Mostrar un contador resumen ("Tienes 5 pendientes, 2 en progreso, 10 vistas").

Publicar la app en GitHub Pages o Vercel con un enlace funcional.

## 1.5 Estructura sugerida de la base de datos
Supabase ya mantiene automáticamente una tabla interna auth.users para cada cuenta registrada — no es necesario crear una tabla propia de "usuarios". Basta con una sola tabla propia, mi_lista, que se relacione con auth.users mediante una clave foránea. Esta es la estructura sugerida (puede ampliarse con los campos opcionales de la sección 1.4):

Columna	| Tipo (Postgres/Supabase) | Descripción
| --- | --- | --- |
id | bigint (identity, PK) | Identificador único de cada fila, autoincremental.
user_id | uuid (FK → auth.users.id) | Dueño del registro; es la columna que las políticas RLS usan para filtrar.
tmdb_id | integer | ID del título en TMDB (permite volver a consultar datos actualizados si se necesita).
titulo | text | Título de la película o serie, tal como aparece en TMDB.
poster_url | text | URL de la imagen del póster devuelta por TMDB.
tipo_contenido | text ('pelicula' \| 'serie') | Distingue películas de series (tipo union en TypeScript).
estado | text ('por_ver' \| 'viendo' \| 'vista') | Estado de visualización personal (tipo union obligatorio).
calificacion_personal | integer (1 a 5, puede ser null) | Calificación propia del usuario; opcional hasta que termine de verla.
comentario | text (opcional) | Nota o comentario libre del usuario sobre el título.
fecha_agregado | timestamptz (default now()) | Fecha en que se agregó el título a la colección; útil para ordenar.


# 1. Guía paso a paso del proyecto
Se recomienda seguir este orden de trabajo — cada etapa depende de que la anterior esté funcionando antes de avanzar.

## Etapa 1 — Cimientos: proyecto, autenticación y base de datos
Crea el proyecto de React + TypeScript con Vite e inicializa el repositorio de GitHub.

Crea el proyecto de Supabase y la tabla mi_lista siguiendo la estructura sugerida en la sección 1.5.

Implementa registro, login y logout con Supabase Auth.

Protege la navegación de la app: sin sesión activa, no se debe poder llegar a ninguna pantalla de contenido.

## Etapa 2 — Conexión con TMDB
Crea tu cuenta y obtén tu API key de TMDB; guárdala en variables de entorno, nunca en el código fuente.

Construye el buscador: el usuario escribe un título y ve resultados reales (póster, nombre, año).

Maneja los estados de carga y error mientras se consulta el API.

## Etapa 3 — CRUD completo sobre la colección personal
Implementa "Agregar a mi lista": inserta una fila en la tabla de Supabase a partir de un resultado de búsqueda.

Implementa la vista "Mi lista": lee y muestra únicamente los títulos guardados por el usuario autenticado.

Implementa edición (estado, calificación, comentario) y eliminación de un título guardado.

Construye la página de detalle ampliada para cada título de la colección.

## Etapa 4 — Seguridad y cierre
Activa y prueba las políticas RLS en Supabase: verifica con dos cuentas de usuario distintas que cada una solo ve y modifica sus propios datos.

Revisa que ninguna credencial (API key, claves de Supabase) esté expuesta directamente en el código.

Pulye la interfaz y corrige errores pendientes antes de la entrega.

Qué se entrega al final
Aplicación completa y funcional, cumpliendo todos los requisitos de la sección 1.3.

Repositorio de GitHub con historial de commits que refleje el avance real del trabajo (no un solo commit final).

README.md con: descripción del proyecto, instrucciones de instalación (npm install, variables de entorno necesarias, npm run dev), y capturas de pantalla de las pantallas principales.

(Opcional, puntos extra) Enlace a la app publicada y funcionando.