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

### Cambios pedidos por el cliente tras ver el prototipo

Detallados en [`docs/CAMBIOS-PEDIDOS.md`](docs/CAMBIOS-PEDIDOS.md):

1. **Sesión de cajero en cada tableta:** cada caja tiene su tableta. Desde un menú discreto en la esquina se cambia el cajero en sesión con el PIN de la tableta, y cada calificación queda ligada a la caja y al cajero. En **Tabletas** se ven el PIN, el cajero actual y los turnos.
2. **Color en cada calificación:** de verde fuerte (Excelente) a rojo (Muy mal), igual en la tableta y en el panel.
3. **Resumen de clientes satisfechos** por sucursal y por cajero en el **Panel**, en el resumen mensual por correo y en la exportación.
4. **Si se cae el internet:** la calificación queda en espera y la tableta reintenta enviarla sola. En la demo se simula con el enlace del pie de la tableta.
5. **Cuestionario de desempeño por rol:** vendedores (meta de venta), cajeros (satisfacción del cliente) y administrativos.

### Recorrido sugerido para la demo

1. Entra como **administrador** y ve a **Tabletas → Abrir la ruta de tableta**. Activa la tableta con el código de ejemplo que se muestra en pantalla (o genera uno nuevo) y elige al cajero en sesión.
2. En la tableta, califica «Muy mal» y llena la queja: verás la alerta con la vista previa del correo.
3. Toca el nombre del cajero en la esquina superior, pulsa **Cambiar cajero**, escribe el PIN de ejemplo que aparece en la nota y elige a otro cajero. Las calificaciones siguientes quedan a su nombre.
4. Pulsa **Simular que se cae el internet** en el pie de la tableta, califica, y vuelve a activar el internet: la calificación se envía sola en unos segundos.
5. Regresa al panel: la calificación aparece en **Calificaciones de clientes** (con caja y cajero) y en **Correos**. En **Panel** compara los clientes satisfechos por sucursal y por cajero.
6. Abre el expediente de **Carlos Vega** (anexos que no cambian su nota), **Daniel Ortega** (trasladado de sucursal) y la evaluación de septiembre de **Mariana López** (modificada, con historial).
7. En **Formularios → Desempeño · Vendedores** edita y guarda: se crea una versión nueva y las evaluaciones anteriores conservan la suya.
8. Entra como **gerente** para evaluar a un empleado de octubre (cada rol ve su cuestionario), y como **empleado** para contestar la encuesta anónima.

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
