# prototipo-sistema-calificacion

Prototipo navegable del **Sistema Integral de Evaluación y Seguimiento** de Grupo Inolite (Ferreisla y Ferretería La Gloria), para enseñárselo al cliente antes de construir el sistema real.

> **Todos los datos son falsos.** Nombres, teléfonos, comentarios, preguntas, puntos y ponderaciones son de ejemplo. No hay servidor, base de datos, inicio de sesión real ni correos reales: todo corre en el navegador y lo que se captura se guarda en `localStorage`. El botón **«Restablecer datos de la demo»** (menú del administrador) vuelve todo al estado inicial.

**URL pública:** https://juan436.github.io/prototipo-sistema-calificacion/

## Qué incluye

| Pantalla | Ruta |
|---|---|
| Entrada «Entrar como…» (administrador, gerente o empleado) | `#/` |
| Tableta de clientes (acceso independiente, activación con código) | `#/tableta` |
| Panel y estadísticas | `#/app/panel` |
| Calificaciones de clientes y resumen mensual | `#/app/clientes` |
| Encuesta anónima: periodos, participación y resultados | `#/app/encuesta` |
| Desempeño: empleados, captura, expediente y modificación | `#/app/desempeno` |
| Reportes disciplinarios y actas (vista de impresión) | `#/app/disciplinario` |
| Formularios dinámicos y versionados | `#/app/formularios` |
| Usuarios, tabletas, correos y seguridad | `#/app/usuarios`, `#/app/tabletas`, `#/app/correos`, `#/app/seguridad` |

Lo que el documento del cliente no define aparece marcado como **«Por definir»**.

### Recorrido sugerido para la demo

1. Entra como **administrador** y ve a **Tabletas → Abrir la ruta de tableta**. Activa la tableta con el código de ejemplo que se muestra en pantalla (o genera uno nuevo).
2. En la tableta, califica «Muy mal» y llena la queja: verás la alerta con la vista previa del correo.
3. Regresa al panel: la calificación aparece en **Calificaciones de clientes** y en **Correos**.
4. Abre el expediente de **Carlos Vega** (anexos que no cambian su nota), **Daniel Ortega** (trasladado de sucursal) y la evaluación de septiembre de **Mariana López** (modificada, con historial).
5. En **Formularios → Evaluación de desempeño** edita y guarda: se crea una versión nueva y las evaluaciones anteriores conservan la suya.
6. Entra como **gerente** para evaluar a un empleado de octubre, y como **empleado** para contestar la encuesta anónima.

## Cómo correrlo

Requiere Node 22 y [pnpm](https://pnpm.io).

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm test
```

```bash
pnpm build
```

## Publicación

El workflow `.github/workflows/deploy.yml` publica en GitHub Pages cada push a `main` (también se puede lanzar a mano desde la pestaña **Actions**). Solo hace falta una vez: **Settings → Pages → Source: GitHub Actions**.

## Stack

Vite + React + TypeScript, `react-router-dom` con `HashRouter`, Tailwind CSS, Recharts, Zustand persistido en `localStorage` y Vitest para la lógica de cálculo y versionado. Los datos de ejemplo están en `src/mock/`.

El encargo completo está en [`docs/ENCARGO.md`](docs/ENCARGO.md).
