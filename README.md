# Loki TV Portal (Panel Administrativo)

Portal administrativo web para la gestión, control y monitoreo de instalaciones, contenidos y señales en vivo del ecosistema **Loki TV**.

---

## 🚀 Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos & Diseño:** Tailwind CSS (Light Theme en workspace con Sidebar Dark corporativo)
- **Iconografía:** Lucide React
- **Base de Datos & Backend:** Supabase (`@supabase/supabase-js`)
- **Control de Acceso:** Lógica de roles estricta multi-inquilino (`companies`)

---

## 🔐 Reglas de Autenticación y Permisos

El acceso al portal está estrictamente restringido a usuarios de la tabla `companies` que cumplan las siguientes condiciones:
1. **Estado de Bloqueo / Actividad:**
   - `is_blocked = false` (o `null`)
   - `is_active = true`
2. **Tipo de Rol Autorizado (`type`):**
   - `admin`
   - `multiuser`
   *(Usuarios con `type = 'user'` u otros son rechazados con mensaje explicativo).*

### Matriz de Roles
| Rol | Alcance de Datos | Acciones Permitidas |
| :--- | :--- | :--- |
| **`admin`** | **Global** (Todas las compañías y registros) | Monitoreo global, filtrado por empresa, gestión total de estados, bloqueos y configuración. |
| **`multiuser`** | **Aislado** (Estrictamente su `code` de empresa) | Visualización y gestión únicamente de los registros donde `company = user.code`. |

---

## 📱 Módulos Desarrollados

### 1. Layout Principal y Navegación
- **Menú Lateral Izquierdo (Sidebar):** Fijo, tema oscuro corporativo.
- **Header Superior:** Fijo, con selector de usuario, estado de conexión y actualización en vivo.
- **Área de Trabajo:** Fondo claro (Light theme), con scroll vertical estrictamente confinado al contenedor principal.

### 2. Dashboard
- Métricas en tiempo real con tarjetas estadísticas: total de instalaciones, dispositivos activos/bloqueados, canales generales y señales para adultos.

### 3. Instalaciones (`app_installations`)
- Celda unificada de Dispositivo: Device ID con botón de copiado rápido, modelo, versión de la app y del SO.
- Conmutadores con modal de confirmación obligatoria para activar/desactivar y bloquear/desbloquear dispositivos.
- Edición de alias amigable, modal de detalles técnicos y exportación a CSV.
- Filtro de búsqueda con botón de limpieza rápida (`X`).

### 4. Canales Generales (`channels`)
- Bloques de hasta 100 canales por categoría con auto-cálculo y reaprovechamiento automático de huecos disponibles.
- Rango reglamentario de 1 a 99 para la categoría Nacionales.
- Celda unificada con logo (con fallback), nombre en mayúsculas, formato `CH XXX` con icono de TV retro y categoría.
- Modales con header y footer estáticos y contenido con scroll interno.
- Paginación, ordenamiento alfabético y filtro con botón de limpieza rápida (`X`).

### 5. Canales Adultos (`adult_channels`)
- Señales protegidas (+18) bajo la categoría única reglamentaria `ADULTOS`.
- Mismo estándar visual y auto-cálculo de números.

---

## 🛠️ Instalación y Configuración Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/jbgisdev/lokitv-portal.git
   cd lokitv-portal
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura variables de entorno:
   Crea un archivo `.env` basado en `.env.example`:
   ```bash
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Compila para producción:
   ```bash
   npm run build
   ```
  - Menú lateral colapsable con apertura suave y fondo atenuado en dispositivos móviles.

### 2. Dashboard
- **Métricas Clave:**
  - **Total de Instalaciones:** Conteo de `app_installations` (filtrado automáticamente por la compañía si el usuario es `multiuser`).
  - **Total de Canales Generales:** Conteo de la grilla oficial de `channels`.
  - **Canales Adultos (+18):** Conteo de `adult_channels` y total de dispositivos con permiso asignado.
  - **Dispositivos Activos vs. Bloqueados:** Desglose porcentual y numérico en tiempo real.
  - **Top Modelos:** Distribución por hardware reportado (TV Box, FireTV Stick, Android TV, etc.).
  - **Instalaciones Recientes:** Listado de los últimos dispositivos registrados con acceso directo.

### 3. Instalaciones
- **Tabla y Tarjetas Interactivas:**
  - **En Escritorio (`lg+`):** Tabla estilizada con hover effects, estado de conexión, alias y acciones directas.
  - **En Móviles y Tablets (`< lg`):** Se transforma automáticamente en **Tarjetas Adaptables (Cards)** elegantes para evitar scroll horizontal indeseado y permitir interacción táctil rápida.
- **Acciones Rápidas Disponibles:**
  - 🔘 **Activar / Desactivar:** Toggle inmediato de `is_active`.
  - 🛡️ **Bloquear / Desbloquear:** Toggle de `is_blocked`.
  - 🔥 **Contenido Adulto (+18):** Toggle de `adult_content`.
  - ✏️ **Editar Alias:** Modal amigable para asignar un nombre descriptivo al dispositivo (ej: "TV Sala Principal").
  - 📋 **Copiar Device ID:** Copiado rápido al portapapeles.
- **Filtros y Búsqueda:**
  - Búsqueda en tiempo real por `device_id`, modelo, alias o empresa.
  - Filtro por estado (`Todos`, `Activos`, `Inactivos`, `Bloqueados`).
  - Filtro por contenido adulto (`Todos`, `Con +18`, `Sin +18`).
  - Selector de empresa específica (disponible exclusivamente para el rol `admin`).
  - Paginación dinámica configurable (10, 25, 50 por página).

---

## 🛠️ Ejecución Local

Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

El portal estará disponible por defecto en:
`http://localhost:3000`

Para generar la compilación de producción:
```bash
npm run build
```

