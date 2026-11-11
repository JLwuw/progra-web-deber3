# Guía del estudiante — Taller «Hangar Orbital»

Oct 28, 2026 · @Andres

## Qué vas a construir

**Hangar Orbital** es el módulo de control de despegues del Centro de Comando Espacial. Sirve para registrar naves, asignarles misiones y saber cuáles pueden despegar. Lo vas a construir con React, TypeScript y Supabase, dirigiendo a Claude Code con especificaciones en lugar de escribir el código a mano.

Antes de la primera línea de código vas a escribir, con ayuda de la IA, cada documento de la cadena que vimos en la Sesión 21:

| Paso | Documento | Pregunta que responde |
| --- | --- | --- |
| 2 | Mini-PRD (`docs/prd/hangar-mvp.md`) | ¿Qué producto y por qué? |
| 3 | Épicas e historias (`docs/backlog/`) | ¿Qué áreas y qué necesita el usuario? |
| 4 | Criterios y tickets (`docs/backlog/E1-flota-y-misiones.md`) | ¿Cómo sabremos que está bien y qué trabajo hay que hacer? |
| 5 | Spec 01 (`docs/specs/01-flota-y-misiones.md`) | ¿Cómo se construye exactamente? |
| 7 | Código (`src/`, `supabase/migraciones/`) | La implementación, en el orden de los tickets |

Hoy solo se implementan dos historias: **registrar una nave** y **asignar una misión a una nave**. El resto queda descrito para después.

### Cómo se trabaja

- **Sigue la pantalla del docente.** Todos pegan los mismos prompts, en el mismo orden. Las respuestas de la IA serán distintas en cada computadora, y está bien.
- **Copia los prompts tal como están.** Los nombres de archivo importan: los pasos siguientes los usan.
- **Lee antes de aprobar.** Cada paso trae un "Revisa que": comprueba eso antes de seguir.
- **Regla de oro:** ninguna funcionalidad se implementa sin una spec en `docs/specs/`.
- **Tus claves nunca van al chat.** El `.env.local` lo escribes tú en el editor.

### Tres cosas de Claude Code que vas a usar

| Acción | Para qué |
| --- | --- |
| `Shift+Tab` | Cambia entre modo normal, aceptar ediciones y **plan mode** (el agente propone sin tocar archivos) |
| `!` al inicio | Ejecuta un comando de terminal sin salir de Claude Code, por ejemplo `!git status` |
| `Esc` | Detiene al agente si empieza a hacer algo que no pediste |

## Ficha de hechos del cliente

Esto es lo que el cliente nos contó. La vas a pegar completa en el paso 2. Tiene huecos a propósito: encontrarlos es parte del ejercicio.

```text
FICHA DE HECHOS — HANGAR ORBITAL (Centro de Comando Espacial)

- Quién lo usa: de 3 a 5 jefes de hangar. Todos tienen el mismo permiso.
- Problema: hoy deciden de memoria qué nave despega. El mes pasado una nave salió con el tanque casi vacío y otra encadenó seis misiones sin pasar por revisión.
- Qué quieren: registrar cada nave, asignarle misiones y saber en cualquier momento qué naves están aptas para despegar.
- Regla del cliente: una nave está apta si tiene al menos un cuarto del tanque de combustible y no ha hecho más de 3 misiones seguidas sin pasar por revisión.
- Reparación: algunas naves entran a dique seco y no pueden recibir misiones mientras estén así.
- Éxito: en un mes, cero despegues de naves no aptas.
- Comodín de NO-alcance: tripulación (ya la gestiona el Centro de Comando), usuarios e inicio de sesión, notificaciones, mapas o trayectorias, cálculo automático del consumo de combustible y app móvil quedan fuera del MVP.
```

## Paso a paso

Cada paso tiene el prompt para copiar, qué revisar y cómo guardar el avance. Pega los prompts dentro de Claude Code salvo que se indique "en tu terminal".

### Paso 0 · Esqueleto vacío

En tu terminal:

```bash
npm create vite@latest hangar-orbital -- --template react-ts
cd hangar-orbital
npm install
git init -b main
claude
```

Si Vite te pregunta si quieres instalar e iniciar el proyecto ahora, responde **No**. Si ofrece opciones experimentales, también **No**.

Prueba `Shift+Tab` para ver los tres modos y ejecuta `/context` para ver cuánto contexto usa la sesión.

### Paso 1 · Harness y skill de commit

**1a. Memoria del proyecto:**

```text
Este proyecto es un esqueleto de Vite (React + TypeScript) sin funcionalidad: vamos a construir el "Hangar Orbital".
Crea un AGENTS.md de máximo 40 líneas con estas secciones:
- Proyecto: app web para registrar las naves de un hangar, asignarles misiones y saber cuáles pueden despegar.
- Stack: Vite + React + TypeScript, Supabase (@supabase/supabase-js), tests con Vitest, formato con Prettier.
- Estructura prevista: src/lib/supabase.ts, src/types/, src/dominio/ (funciones puras y sus tests), src/services/, src/components/, supabase/migraciones/, docs/prd/, docs/backlog/, docs/specs/.
- Comandos: npm run dev, npm test, npm run build.
- Convenciones: nombres del dominio en español; camelCase en TypeScript y snake_case en la base de datos; nunca usar any; los componentes no llaman a Supabase, solo los servicios de src/services/.
- Reglas: nunca leer ni modificar .env ni .env.local; nunca escribir claves en el código; en el frontend solo va la clave pública (anon o publishable), nunca la service_role; ninguna funcionalidad se implementa sin una spec en docs/specs; ejecutar npm test y npm run build antes de dar una tarea por terminada.
Crea también CLAUDE.md con una sola línea: @AGENTS.md
Revisa el .gitignore que trae Vite y agrega .env y .env.local si no están cubiertos.
```

**Revisa que:** `AGENTS.md` tenga menos de 40 líneas, incluya "ninguna funcionalidad sin spec" y prohiba la `service_role`; y que el `.gitignore` cubra `.env.local`.

**1b. Skill `/commit`.** Escribe `/` y comprueba que `/commit` todavía no existe. Luego pega:

```text
Crea una skill de proyecto llamada commit en .claude/skills/commit/SKILL.md.
Frontmatter:
- name: commit
- description: qué hace y cuándo usarla, en una frase.
- disable-model-invocation: true, para que solo se ejecute cuando yo escriba /commit.
Instrucciones en pasos numerados:
1. Leer los cambios en staging con git diff --staged.
2. Si no hay nada en staging, avisar y detenerse. Nunca hacer git add por su cuenta.
3. Si los cambios incluyen .env, .env.local o algo que parezca una clave, detenerse y avisar.
4. Escribir el mensaje en formato Conventional Commits (feat, fix, docs, test, refactor, chore), en español y con máximo 72 caracteres.
5. Mostrar el mensaje y hacer el commit. Nunca hacer push.
```

Revisa el archivo con `!cat .claude/skills/commit/SKILL.md`. Escribe `/` otra vez: ahora `/commit` aparece.

**1c. Primer commit:**

```text
!git add .
/commit
```

### Paso 2 · Mini-PRD

**2a. Buscar huecos.** Activa **plan mode** con `Shift+Tab` y pega este prompt, reemplazando la línea entre corchetes por la ficha de hechos completa:

```text
Estás en plan mode: no modifiques ningún archivo.
Actúa como un socio de producto escéptico. El cliente quiere una app para que los jefes de hangar sepan qué naves pueden despegar. Estas son sus respuestas:
[pegar aquí la ficha de hechos completa]
Antes de proponer nada, señala como máximo 4 huecos o ambigüedades de la ficha que cambiarían el comportamiento del producto. Solo nivel de producto: nada de tablas, componentes, bases de datos ni tecnologías.
```

El docente, como cliente, va a responder los huecos. **Cuando lo indique**, pega:

```text
Decisiones del cliente:
- El combustible es un porcentaje entero de 0 a 100. Con exactamente 25 % la nave está apta.
- Una nave admite como máximo 3 misiones entre revisiones: si ya tiene 3, no recibe otra hasta su próxima revisión.
- Cuentan todas las misiones asignadas desde la última revisión, ya realizadas o programadas.
- Una nave recién registrada cuenta como revisada en su fecha de registro.
- Asignar una misión no cambia el combustible: se actualiza a mano.
Lo que siga sin resolver se anota como punto abierto.
```

**2b. Escribir el mini-PRD.** Sal de plan mode con `Shift+Tab` hasta el modo normal:

```text
Escribe docs/prd/hangar-mvp.md, un mini-PRD de máximo una página con estas secciones:
1. Problema
2. Usuarios
3. Objetivo y métrica de éxito
4. Alcance del MVP (máximo 4 puntos)
5. No-alcance
6. Reglas de negocio
7. Supuestos, marcados con [SUPUESTO]
8. Puntos abiertos
Es un documento de producto: prohibido incluir tablas, columnas, componentes, códigos de error o nombres de librerías.
```

**Revisa que:** las decisiones del cliente estén en "Reglas de negocio" y que no aparezca Supabase ni ningún nombre técnico. Si se coló algo, pide: *"Reescribe en lenguaje de producto cualquier frase que diga cómo se construye."*

```text
!git add docs/
/commit
```

### Paso 3 · Épicas e historias

**3a. Épicas:**

```text
Lee docs/prd/hangar-mvp.md y agrupa su alcance en exactamente estas dos épicas:
- E1 · Flota y misiones: registrar y consultar las naves y asignarles misiones.
- E2 · Mantenimiento: saber qué naves no están aptas, registrar revisiones y combustible, y manejar la reparación.
Para cada épica escribe: su objetivo en una frase, qué puntos del alcance del PRD cubre y qué reglas de negocio le aplican.
Al final, indica si algún punto del alcance quedó fuera de ambas épicas.
Guárdalo en docs/backlog/epicas.md.
```

**Revisa que:** ningún punto del alcance quede fuera y que nada del no-alcance se haya colado.

**3b. Historias de E1:**

```text
Descompón la épica E1 en historias de usuario con id HU-1.x y el formato "Como <rol>, quiero <acción>, para <beneficio>".
Aplica INVEST: pequeñas, independientes y comprobables. Todavía no escribas criterios de aceptación.
Valida cada historia contra el alcance del PRD: si alguna se sale del MVP, márcala como "fuera de alcance" en lugar de quitarla en silencio.
Guárdalas en docs/backlog/E1-flota-y-misiones.md.
```

Tus ids pueden ser distintos a los de tus compañeros; no importa.

```text
!git add docs/
/commit
```

### Paso 4 · Criterios y tickets

**4a. Criterios de aceptación:**

```text
Para el sprint de hoy tomamos solo dos historias de E1: la de registrar una nave y la de asignar una misión a una nave.
Para cada una, escribe criterios de aceptación como reglas de negocio observables, con el formato DADO / CUANDO / ENTONCES, e incluye las reglas del PRD que les aplican.
Después propón casos borde que los criterios todavía no cubren.
Sin tablas, componentes ni nombres de campos: solo lo que un jefe de hangar puede comprobar en la pantalla.
```

El docente decidirá sobre los casos borde. **Cuando lo indique**, pega:

```text
Decisiones del cliente sobre los casos borde:
- Nombre, clase y combustible son obligatorios al registrar una nave, y el nombre no se puede repetir.
- La clase es una de tres: exploradora, carguera o transporte.
- Una misión necesita nave, destino, fecha de despegue y duración.
- La fecha de despegue no puede ser anterior a hoy; hoy sí se permite.
- La duración es un número entero de días, mínimo 1.
- Una nave en reparación no recibe misiones.
- Que una nave tenga dos misiones con fechas superpuestas queda como punto abierto: anótalo también en el PRD.
Agrega estos criterios a las dos historias y guárdalas en docs/backlog/E1-flota-y-misiones.md. Las demás historias quedan como "por refinar".
```

**4b. Tickets:**

```text
Descompón las dos historias del sprint en tickets de trabajo, máximo 4 por historia. Para cada ticket:
- id (T-01, T-02…), historia a la que pertenece y tipo: Configuración, Modelo/Dominio, Datos/Interfaz o Test;
- descripción de una o dos líneas: qué capa toca y qué debe lograr, sin diseñarla todavía;
- Definition of Done como checklist ([ ]);
- dependencias: qué tickets deben estar terminados antes.
Termina con el orden de ejecución sugerido. Agrégalo a docs/backlog/E1-flota-y-misiones.md.
```

**Revisa que:** los tickets no diseñen tablas ni componentes, que haya tickets de tipo Test y que la misión dependa de la nave.

```text
!git add docs/
/commit
```

### Paso 5 · Spec 01

```text
Escribe docs/specs/01-flota-y-misiones.md, la spec técnica de las dos historias del sprint, a partir de docs/backlog/E1-flota-y-misiones.md. Debe incluir:
1. Base de datos (Supabase), en SQL dentro de la spec:
   - Tabla naves: id (uuid), nombre (único), clase (exploradora, carguera o transporte), combustible (entero de 0 a 100), en_reparacion (por defecto false), ultima_revision (por defecto, ahora) y created_at.
   - Tabla misiones: id, nave_id (referencia a naves), destino, fecha_despegue (fecha), duracion_dias (entero, mínimo 1) y created_at.
   - RLS activado en ambas, con políticas para el rol anon que solo permitan leer e insertar. Explica en una línea por qué es temporal.
2. Tipos de TypeScript para Nave y Mision.
3. Funciones puras en src/dominio/: validarNave, validarMision (recibe la fecha de hoy como parámetro) y puedeRecibirMision (recibe la nave y cuántas misiones tiene desde su última revisión; devuelve si puede y, si no, el motivo).
4. Servicios: navesService (crear y listar) y misionesService (contar las misiones creadas desde la última revisión de una nave, y crear una misión solo si puedeRecibirMision lo permite).
5. Componentes: FormularioNave, ListaNaves y FormularioMision, con los mensajes de error que verá el jefe de hangar.
6. Los criterios de aceptación de las dos historias, con su id, reescritos con DEBE y NO DEBE.
7. Una tabla criterio → verificación: test de Vitest sobre el dominio (sin base de datos) o prueba manual en el navegador.
8. Una tabla ticket → archivos que crea o modifica. La migración va en supabase/migraciones/001_hangar.sql.
Todavía no escribas código fuera de la spec.
```

**Revisa que:**

- Estén todos los criterios del backlog y cada ticket tenga sus archivos.
- `puedeRecibirMision` contemple los tres rechazos: poco combustible, 3 misiones desde la revisión y nave en reparación.
- Las políticas solo permitan leer e insertar.

```text
!git add docs/
/commit
```

### Paso 6 · Hook de formato

Escribe `/hooks` y comprueba que no hay ninguno. Luego pega:

```text
Crea un hook que formatee con Prettier cada archivo que crees o edites:
1. Instala prettier como dependencia de desarrollo.
2. Crea .claude/hooks/formatear.cjs (CommonJS, porque el package.json de Vite usa "type": "module"): lee de stdin el JSON que envía Claude Code, toma tool_input.file_path y, solo si el archivo es .ts, .tsx, .js, .json o .css, lo formatea con la API de Prettier del proyecto (resolveConfig y format). Si algo falla, termina sin bloquear.
3. En .claude/settings.json, agrega un hook PostToolUse con matcher "Edit|Write" que ejecute: node "$CLAUDE_PROJECT_DIR/.claude/hooks/formatear.cjs"
No crees ningún otro archivo.
```

Confirma con `/hooks` que el hook aparece bajo `PostToolUse`. **Pruébalo:**

```text
Crea demo-hook.ts con esta línea exactamente igual, sin corregir nada:
const saludo:string='hola'   ;console.log( saludo )
```

Con `!cat demo-hook.ts` deberías ver dos líneas bien formateadas. Si las ves, el hook funcionó:

```text
!rm demo-hook.ts
!git add .
/commit
```

### Paso 7 · Implementar y verificar

**7a. Plan e implementación de T-01.** Activa **plan mode**:

```text
Lee docs/specs/01-flota-y-misiones.md y docs/backlog/E1-flota-y-misiones.md y prepara un plan de implementación que siga el orden de los tickets. En cada ticket: primero sus tests (si aplica), después el código.
Incluye: instalar @supabase/supabase-js y vitest; el script "test": "vitest run" en package.json; un .env.example con VITE_SUPABASE_URL= y VITE_SUPABASE_ANON_KEY= vacíos; y la migración en supabase/migraciones/001_hangar.sql.
Indica qué ticket cubre cada paso. Cuando apruebe el plan, implementa solo T-01 y detente.
```

Lee el plan: cada paso debe nombrar su ticket. Apruébalo y aprueba cada edición a mano para ver qué se escribe.

**7b. Conectar Supabase (tú, fuera de Claude Code):**

1. Abre `supabase/migraciones/001_hangar.sql` en tu editor y léelo: ¿coincide con la spec?
2. Cópialo en el **SQL Editor** de tu proyecto de Supabase y ejecútalo.
3. En el **Table Editor**, comprueba que existen `naves` y `misiones`, con RLS activado.
4. Copia `.env.example` como `.env.local` y escribe **en el editor** la URL del proyecto y la clave pública. Nunca en el chat.

**7c. Implementar el resto.** De vuelta en Claude Code, en modo normal:

```text
T-01 está listo: la migración ya se ejecutó en Supabase y el .env.local existe (no lo leas). Continúa con los tickets T-02 a T-07 en el orden del plan, primero los tests de cada ticket. Al terminar ejecuta npm test y npm run build y muestra el resultado.
```

Espera a que `npm test` y `npm run build` pasen.

**7d. Verificar en el navegador.** Primero, la lista de comprobación:

```text
Escribe docs/VERIFICACION.md con una tabla para verificar la spec 01 en el navegador, criterio por criterio, con las columnas: criterio, pasos, resultado esperado y resultado obtenido (vacío). Incluye al menos:
- registrar una nave válida con 80 % de combustible y otra con 120 % (debe fallar); registrar un nombre repetido (debe fallar);
- asignar una misión válida; asignar una misión a una nave con 10 % (debe rechazarse) y a una con exactamente 25 % (debe aceptarse);
- asignar una cuarta misión a la misma nave (debe rechazarse); una misión con fecha de ayer (debe rechazarse) y otra con duración 0 (debe rechazarse).
No modifiques código.
```

En una **segunda terminal**, ejecuta `npm run dev` y abre la app en el navegador. Recorre la tabla fila por fila y llena **tú** la columna "resultado obtenido" en `docs/VERIFICACION.md`. Comprueba también en el Table Editor que las filas aparecen.

Si una fila falla, pide:

```text
Corrige solo lo necesario para cumplir el criterio [escribe aquí el criterio] de la spec 01 y vuelve a ejecutar npm test.
```

Antes de guardar, comprueba que `git status` **no** muestre `.env.local`:

```text
!git status
!git add .
/commit
```

### Paso 8 · Auditoría

```text
Audita el proyecto contra docs/specs/01-flota-y-misiones.md. Ejecuta npm test y npm run build, y lee docs/VERIFICACION.md, que ya completé en el navegador.
1. Escribe docs/AUDITORIA.md con una tabla: criterio, cómo se verificó (test o navegador), resultado (cumple / no cumple / sin verificar) y evidencia.
2. En docs/backlog/E1-flota-y-misiones.md, marca con [x] cada punto del Definition of Done que esté cumplido y agrega a cada ticket su estado: hecho o pendiente.
3. Agrega una sección de riesgos conocidos con este: las políticas RLS permiten leer e insertar a cualquiera que tenga la clave pública, porque el MVP no tiene usuarios.
No corrijas código; solo reporta.
```

```text
!git add docs/
/commit
```

### Paso 9 · Publicar en GitHub

Crea en github.com/new un repositorio **vacío** llamado `hangar-orbital`, sin README, .gitignore ni licencia. Luego, **en tu terminal** (no en Claude Code):

```bash
git ls-files               # .env.local NO debe aparecer; .env.example sí
git remote add origin https://github.com/<tu-usuario>/hangar-orbital.git
git push -u origin main
git log --oneline
```

Lee tu `git log`: cada documento aparece antes que el código que lo implementa.

## Referencias para comparar

Si lo que generó Claude no funciona, compara con estas versiones o pégalas tal cual. La lógica del dominio no está aquí a propósito: esa debe salir de tu spec.

### `.claude/skills/commit/SKILL.md`

```markdown
---
name: commit
description: Crea un commit en formato Conventional Commits con los cambios que están en staging. Úsala cuando el usuario quiera guardar su trabajo en git.
disable-model-invocation: true
---
# Commit

1. Ejecuta `git diff --staged` y lee los cambios.
2. Si no hay nada en staging, avisa y detente. Nunca hagas `git add` por tu cuenta.
3. Si los cambios incluyen `.env`, `.env.local` o algo que parezca una clave, detente y avisa.
4. Escribe el mensaje en formato `tipo(ámbito): resumen`, en español y con máximo 72 caracteres.
   Tipos: feat, fix, docs, test, refactor, chore.
5. Muestra el mensaje y haz el commit. Nunca hagas push.
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/formatear.cjs\""
          }
        ]
      }
    ]
  }
}
```

### `.claude/hooks/formatear.cjs`

```js
// Claude Code envía por stdin un JSON con la herramienta usada y sus parámetros.
const fs = require("node:fs");
const prettier = require("prettier");

let entrada = "";
process.stdin.on("data", (trozo) => (entrada += trozo));
process.stdin.on("end", async () => {
  try {
    const archivo = JSON.parse(entrada).tool_input?.file_path;
    if (!archivo || !/\.(ts|tsx|js|json|css)$/.test(archivo)) return;
    const codigo = fs.readFileSync(archivo, "utf8");
    const opciones = (await prettier.resolveConfig(archivo)) ?? {};
    const formateado = await prettier.format(codigo, { ...opciones, filepath: archivo });
    if (formateado !== codigo) fs.writeFileSync(archivo, formateado);
  } catch {
    // Si algo falla, no bloqueamos el trabajo del agente.
  }
});
```

### `supabase/migraciones/001_hangar.sql`

```sql
create table public.naves (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  clase text not null check (clase in ('exploradora', 'carguera', 'transporte')),
  combustible integer not null check (combustible between 0 and 100),
  en_reparacion boolean not null default false,
  ultima_revision timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.misiones (
  id uuid primary key default gen_random_uuid(),
  nave_id uuid not null references public.naves (id) on delete cascade,
  destino text not null,
  fecha_despegue date not null,
  duracion_dias integer not null check (duracion_dias >= 1),
  created_at timestamptz not null default now()
);

alter table public.naves enable row level security;
alter table public.misiones enable row level security;

-- Temporal: el MVP no tiene usuarios (no-alcance). Solo leer e insertar.
create policy "naves: leer" on public.naves for select to anon using (true);
create policy "naves: registrar" on public.naves for insert to anon with check (true);
create policy "misiones: leer" on public.misiones for select to anon using (true);
create policy "misiones: asignar" on public.misiones for insert to anon with check (true);
```

## Si algo falla

| Qué ves | Qué hacer |
| --- | --- |
| La IA creó archivos en el paso 2a | No estabas en plan mode. `!git status`, borra lo nuevo y repite con plan mode activo |
| "No puedo crear archivos en plan mode" | Sal con `Shift+Tab` hasta el modo normal y repite |
| El PRD o los criterios hablan de tablas, Supabase o componentes | Pide: "Reescribe en lenguaje de producto cualquier frase que diga cómo se construye" |
| La IA empieza a escribir código antes del paso 7 | `Esc`. Recuérdale la regla de AGENTS.md: ninguna funcionalidad sin spec |
| `/commit` no aparece al escribir `/` | Revisa que el frontmatter abra y cierre con `---`; luego `/exit` y vuelve a abrir `claude` |
| El primer commit falla | Configura Git en tu terminal: `git config --global user.name "..."` y `user.email` |
| El hook no formatea | El script debe terminar en `.cjs`. Revisa que Prettier esté instalado (`npm install -D prettier`) |
| La IA quiere leer `.env.local` | Rechaza el permiso. Es la regla de AGENTS.md funcionando |
| Error al ejecutar el SQL | Usa un proyecto sin tablas `naves` ni `misiones`, o pega la migración de referencia |
| "new row violates row-level security policy" | Faltan las políticas de insert: revisa que la migración se ejecutó completa |
| "Invalid API key" o la app no carga datos | Revisa la URL y la clave en `.env.local` y **reinicia `npm run dev`**: Vite solo lee esas variables al arrancar |
| `npm run build` falla por tipos | Pide que lo corrija citando el error. No aceptes que desactive TypeScript ni que use `any` |
| `git push` pide usuario o se queda esperando | Haz el push desde tu terminal, fuera de Claude Code |

## Cómo retomar si te quedaste atrás

El docente publica su ensayo en un repositorio de rescate con una etiqueta por paso (`paso-1` a `paso-8`). Puedes traer solo el archivo o la carpeta que te falta, sin perder tu trabajo. En tu terminal:

```bash
git remote add rescate https://github.com/<usuario-del-docente>/hangar-orbital-solucion.git
git fetch rescate --tags
git checkout paso-4 -- docs/backlog/
```

En el último comando cambia `paso-4` por la etiqueta del paso que te falta y `docs/backlog/` por el archivo o carpeta que necesitas. Luego haz commit como siempre.

| Si te falta… | Etiqueta | Qué traer |
| --- | --- | --- |
| El harness | `paso-1` | `AGENTS.md CLAUDE.md .claude/skills/` |
| El mini-PRD | `paso-2` | `docs/prd/` |
| Épicas e historias | `paso-3` | `docs/backlog/` |
| Criterios y tickets | `paso-4` | `docs/backlog/` |
| La spec | `paso-5` | `docs/specs/` |
| El hook | `paso-6` | `.claude/settings.json .claude/hooks/` |

El código (`paso-7`) es mejor no copiarlo: el objetivo es que salga de tu propia spec.

### Si quieres ir más lejos

Lleva la épica E2 · Mantenimiento por el mismo camino: criterios → tickets → spec 02 → código → verificación. Empieza por "ver las naves no aptas": deberías poder reutilizar la regla que ya escribiste sin copiarla.
