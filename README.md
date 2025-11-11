# Admin Condominios

Sistema de administración de condominios desarrollado con Next.js, TypeScript, Prisma y PostgreSQL (Neon).

## Tecnologías

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Estilos**: Tailwind CSS
- **Despliegue**: Vercel

## Arquitectura del Proyecto

```
plataforma/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Layout principal
│   │   └── page.tsx      # Página de inicio
│   ├── components/       # Componentes reutilizables
│   ├── lib/             # Utilidades y configuraciones
│   │   └── prisma.ts    # Cliente de Prisma
│   ├── types/           # Tipos TypeScript
│   └── styles/          # Estilos globales
│       └── globals.css  # CSS global con Tailwind
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
├── .env                 # Variables de entorno (local)
├── .env.example         # Plantilla de variables de entorno
└── vercel.json          # Configuración de Vercel
```

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear Base de Datos en Neon

1. Ir a [console.neon.tech](https://console.neon.tech)
2. Crear un nuevo proyecto llamado **admin_condominios**
3. Copiar las cadenas de conexión:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

### 3. Configurar Variables de Entorno

Copiar `.env.example` a `.env` y actualizar con las credenciales de Neon:

```bash
cp .env.example .env
```

Editar `.env` con las URLs de conexión obtenidas de Neon:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/admin_condominios?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/admin_condominios?sslmode=require"
```

### 4. Generar Cliente de Prisma y Sincronizar Base de Datos

```bash
# Generar el cliente de Prisma
npm run db:generate

# Sincronizar esquema con la base de datos (desarrollo)
npm run db:push
```

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Despliegue en Vercel

### Opción 1: Desde el Dashboard de Vercel

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio: `cognitiva-ai-agency/admin_condominios`
3. Configurar el proyecto:
   - **Project Name**: `admin-condominios`
   - **Framework Preset**: Next.js
   - **Root Directory**: `plataforma`
4. Agregar variables de entorno:
   - `DATABASE_URL` → URL de conexión pooled de Neon
   - `DIRECT_URL` → URL de conexión directa de Neon
   - `NEXTAUTH_URL` → URL de producción (ej: `https://admin-condominios.vercel.app`)
   - `NEXTAUTH_SECRET` → Generar con `openssl rand -base64 32`
5. Deploy

### Opción 2: Desde la CLI de Vercel

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Login a Vercel
vercel login

# Deploy
vercel
```

## Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir aplicación para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar ESLint
- `npm run db:generate` - Generar cliente de Prisma
- `npm run db:push` - Sincronizar esquema con BD (desarrollo)
- `npm run db:migrate` - Crear y aplicar migraciones
- `npm run db:studio` - Abrir Prisma Studio

## Base de Datos

### Modelo de Datos Actual

El esquema incluye un modelo `User` de ejemplo que será reemplazado con el esquema definitivo del sistema de administración de condominios.

### Trabajar con Prisma

**Ver y editar datos:**
```bash
npm run db:studio
```

**Crear una nueva migración:**
```bash
npm run db:migrate
```

**Aplicar cambios en desarrollo (sin migración):**
```bash
npm run db:push
```

## Mejores Prácticas Implementadas

1. **Separación de configuración**: Variables de entorno para desarrollo y producción
2. **Cliente Prisma singleton**: Evita múltiples instancias en modo desarrollo
3. **TypeScript estricto**: Configuración TypeScript con modo estricto activado
4. **App Router**: Uso del nuevo sistema de rutas de Next.js 15
5. **Tailwind CSS**: Sistema de diseño utility-first
6. **ESLint**: Configuración de linting con reglas de Next.js

## Próximos Pasos

Una vez completada la configuración base, se procederá a:

1. Definir el esquema completo de base de datos
2. Implementar autenticación y autorización
3. Desarrollar los módulos principales del sistema
4. Implementar la interfaz de usuario
5. Configurar testing y CI/CD

## Contacto

- **Desarrollado por**: Cognitiva SpA
- **Responsable**: Dr. Curiosity (Oscar Francisco Barros Tagle)
- **Email**: cognitivaspa@gmail.com
