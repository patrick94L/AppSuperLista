# SuperLista Familiar 🛒

Lista de compras colaborativa para familias — PWA que funciona en Android e iOS.

## Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
El archivo `.env` ya viene configurado con tus credenciales de Firebase.

### 3. Reglas de Firestore
En Firebase Console → Firestore → Reglas, pega el contenido de `firestore.rules`.

### 4. Correr en desarrollo
```bash
npm run dev
```

### 5. Deploy en Vercel
1. Sube este proyecto a GitHub
2. Entra a vercel.com → "Add New Project" → importa el repo
3. En "Environment Variables" agrega todas las variables del `.env`
4. Deploy → listo ✅

## Estructura del proyecto
```
src/
  components/
    Login.tsx        — pantalla de login
    FamilySetup.tsx  — crear/unirse a familia
    ShoppingList.tsx — lista principal
  lib/
    firebase.ts      — configuración Firebase
    utils.ts         — helpers
  store/
    useStore.ts      — estado global (Zustand)
  App.tsx            — router principal
  main.tsx           — entry point
firestore.rules      — reglas de seguridad
vite.config.ts       — config Vite + PWA
```

## Instalar como app en el celular

**Android (Chrome):** abre la URL → menú (⋮) → "Agregar a pantalla de inicio"

**iOS (Safari):** abre la URL → botón compartir → "Agregar a pantalla de inicio"
