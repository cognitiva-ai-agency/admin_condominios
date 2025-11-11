# Instrucciones de Configuración - Admin Condominios

## Paso 1: Crear Base de Datos en Neon

### 1.1 Acceder a Neon Console
1. Ir a [https://console.neon.tech](https://console.neon.tech)
2. Iniciar sesión con tu cuenta

### 1.2 Crear Nuevo Proyecto
1. Click en **"New Project"**
2. Configurar el proyecto:
   - **Project name**: `admin_condominios`
   - **Region**: Seleccionar la región más cercana (recomendado: `US East (Ohio)` o `South America (São Paulo)`)
   - **PostgreSQL version**: Dejar la versión por defecto (última estable)
3. Click en **"Create Project"**

### 1.3 Obtener Cadenas de Conexión
Una vez creado el proyecto, verás la página de configuración:

1. En la sección **"Connection Details"**:
   - **Database**: `neondb` (por defecto)
   - **Role**: El rol que se creó automáticamente

2. Copiar las dos URLs de conexión:

   **A) Pooled Connection (para DATABASE_URL)**
   ```
   postgresql://[user]:[password]@[host]/admin_condominios?sslmode=require
   ```

   **B) Direct Connection (para DIRECT_URL)**
   ```
   postgresql://[user]:[password]@[host]/admin_condominios?sslmode=require&options=endpoint%3D[endpoint]
   ```

3. Guardar estas URLs para el siguiente paso

### 1.4 Actualizar Variables de Entorno Locales

Editar el archivo `.env` en el proyecto:

```env
DATABASE_URL="[pegar Pooled Connection aquí]"
DIRECT_URL="[pegar Direct Connection aquí]"
```

### 1.5 Verificar Conexión

Ejecutar en la terminal:
```bash
npm run db:generate
npm run db:push
```

Si todo está correcto, verás:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema
```

---

## Paso 2: Crear Proyecto en Vercel

### 2.1 Acceder a Vercel
1. Ir a [https://vercel.com](https://vercel.com)
2. Iniciar sesión con tu cuenta de GitHub

### 2.2 Importar Repositorio
1. Click en **"Add New..."** → **"Project"**
2. Buscar el repositorio: `cognitiva-ai-agency/admin_condominios`
3. Click en **"Import"**

### 2.3 Configurar Proyecto
En la página de configuración del proyecto:

**Configure Project:**
- **Project Name**: `admin-condominios`
- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: `plataforma` (⚠️ IMPORTANTE)
- **Build Command**: `npm run build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Install Command**: `npm install` (por defecto)

### 2.4 Configurar Variables de Entorno

Antes de hacer deploy, agregar las siguientes variables de entorno:

Click en **"Environment Variables"** y agregar:

1. **DATABASE_URL**
   - Value: `[pegar Pooled Connection de Neon]`
   - Environments: `Production`, `Preview`, `Development` (seleccionar todos)

2. **DIRECT_URL**
   - Value: `[pegar Direct Connection de Neon]`
   - Environments: `Production`, `Preview`, `Development` (seleccionar todos)

3. **NEXTAUTH_URL**
   - Value: Dejar vacío por ahora (se configurará después del primer deploy)
   - Environments: `Production` solamente

4. **NEXTAUTH_SECRET**
   - Value: Generar un secret aleatorio:
     - En Windows PowerShell:
       ```powershell
       -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
       ```
     - O usar: `https://generate-secret.vercel.app/32`
   - Environments: `Production`, `Preview`, `Development` (seleccionar todos)

### 2.5 Deploy
1. Click en **"Deploy"**
2. Esperar a que el build y deploy se completen (2-5 minutos)
3. Una vez completado, verás un mensaje de éxito con la URL del proyecto

### 2.6 Actualizar NEXTAUTH_URL
1. Copiar la URL de producción (ej: `https://admin-condominios.vercel.app`)
2. Ir a **"Settings"** → **"Environment Variables"**
3. Editar la variable `NEXTAUTH_URL` y pegar la URL de producción
4. Guardar cambios
5. Hacer un redeploy desde la pestaña **"Deployments"**

---

## Paso 3: Verificar el Despliegue

### 3.1 Verificar Aplicación
1. Abrir la URL de producción en el navegador
2. Deberías ver la página de inicio: "Admin Condominios"

### 3.2 Verificar Base de Datos
1. En Neon Console, ir a **"Tables"**
2. Deberías ver la tabla `User` creada por Prisma

### 3.3 Verificar Logs
En Vercel:
1. Ir a **"Deployments"** → Click en el último deployment
2. Click en **"View Function Logs"**
3. Verificar que no haya errores

---

## Paso 4: Configurar Dominio Personalizado (Opcional)

Si deseas usar un dominio personalizado:

### 4.1 En Vercel
1. Ir a **"Settings"** → **"Domains"**
2. Click en **"Add Domain"**
3. Ingresar tu dominio (ej: `admin.cognitiva-ai.com`)
4. Seguir las instrucciones para configurar los registros DNS

### 4.2 Actualizar NEXTAUTH_URL
1. Una vez configurado el dominio, actualizar la variable `NEXTAUTH_URL`
2. Cambiar de `https://admin-condominios.vercel.app` a tu dominio personalizado
3. Guardar y hacer redeploy

---

## Resumen de URLs y Credenciales

**GitHub Repository:**
- URL: `https://github.com/cognitiva-ai-agency/admin_condominios`

**Neon Database:**
- Console: `https://console.neon.tech`
- Proyecto: `admin_condominios`
- Pooled URL: `[tu DATABASE_URL]`
- Direct URL: `[tu DIRECT_URL]`

**Vercel Project:**
- Console: `https://vercel.com/cognitiva-ai-agency/admin-condominios`
- Production URL: `https://admin-condominios.vercel.app`

---

## Solución de Problemas

### Error: "Failed to connect to database"
- Verificar que las URLs de Neon estén correctamente configuradas en Vercel
- Verificar que las variables de entorno tengan `?sslmode=require`
- Verificar que la base de datos en Neon esté activa

### Error: "Build failed"
- Verificar que el Root Directory esté configurado como `plataforma`
- Verificar que todas las variables de entorno estén configuradas
- Revisar los logs de build en Vercel

### Error: "Prisma Client not generated"
- Asegurarse de ejecutar `npm run db:generate` localmente
- Verificar que la carpeta `src/generated/prisma` exista

---

## Próximos Pasos

Una vez completada la configuración:

1. Verificar que la aplicación esté funcionando en producción
2. Configurar las migraciones de Prisma para producción
3. Implementar el esquema de base de datos definitivo
4. Comenzar con el desarrollo de funcionalidades

---

**Desarrollado por Cognitiva SpA**
**Contacto**: cognitivaspa@gmail.com
