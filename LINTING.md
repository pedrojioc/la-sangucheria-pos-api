# 🔧 Linting y Formateo - La Sanguchería POS

## 📋 Configuración

Este proyecto utiliza **ESLint** y **Prettier** con el estilo de código **Standard JS** para mantener consistencia y calidad en el código.

### 🛠️ Herramientas Configuradas

- **ESLint 9** - Análisis estático de código
- **Prettier** - Formateo automático de código  
- **Standard JS Style** - Guía de estilo de código
- **TypeScript ESLint** - Reglas específicas para TypeScript

## 📜 Scripts Disponibles

### Linting
```bash
# Verificar problemas de linting
pnpm run lint:check

# Arreglar problemas automáticamente
pnpm run lint:fix

# Atajo para lint:fix
pnpm run lint
```

### Formateo
```bash
# Formatear todos los archivos
pnpm run format

# Solo verificar formato (CI/CD)
pnpm run format:check
```

## 🎯 Estilo de Código (Standard JS)

### Características principales:
- **No semicolons** - No usar `;` al final de líneas
- **Single quotes** - Usar comillas simples `'text'`
- **2 spaces** - Indentación de 2 espacios
- **No trailing commas** - Sin comas finales en objetos/arrays
- **Space before function parens** - Espacio antes de paréntesis en funciones

### Ejemplos:

```typescript
// ✅ Correcto
function myFunction () {
  const name = 'La Sanguchería'
  const config = {
    host: 'localhost',
    port: 3000
  }
  return config
}

// ❌ Incorrecto
function myFunction() {
  const name = "La Sanguchería";
  const config = {
    host: 'localhost',
    port: 3000,
  };
  return config;
}
```

## ⚙️ Configuración del Editor

### VS Code
Las configuraciones están en `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Extensiones Recomendadas:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

## 📁 Archivos de Configuración

### ESLint - `eslint.config.mjs`
```javascript
export default tseslint.config(
  // Configuración con Standard JS style
  // TypeScript support
  // Prettier integration
)
```

### Prettier - `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "printWidth": 80
}
```

### Archivos Ignorados - `.prettierignore`
```
dist/
node_modules/
coverage/
*.d.ts
migrations/
```

## 🚀 Flujo de Desarrollo

### 1. Antes de commit:
```bash
# Formatear código
pnpm run format

# Verificar linting
pnpm run lint:check
```

### 2. CI/CD Pipeline:
```bash
# En el pipeline
pnpm run format:check
pnpm run lint:check
```

### 3. Pre-commit hooks (opcional):
```bash
# Instalar husky si no está
npm install --save-dev husky

# Configurar pre-commit
npx husky add .husky/pre-commit "pnpm run lint:fix && pnpm run format"
```

## ⚠️ Reglas Importantes

### TypeScript Específicas:
- `@typescript-eslint/no-explicit-any: warn` - Evitar `any`
- `@typescript-eslint/no-unused-vars: error` - Variables sin usar
- `@typescript-eslint/no-floating-promises: warn` - Promises sin await

### Deshabilitadas en casos específicos:
- Archivos de test: `no-explicit-any` permitido
- Funciones de NestJS: `explicit-function-return-type` off

## 🔧 Solución de Problemas

### Error: "Parsing error"
```bash
# Limpiar cache de ESLint
rm -rf .eslintcache

# Reinstalar dependencias
pnpm install
```

### Conflictos Prettier vs ESLint:
- La configuración ya está sincronizada
- Prettier maneja formato, ESLint maneja lógica
- En caso de conflicto, Prettier tiene prioridad

### Performance:
```bash
# Para proyectos grandes, usar cache
export ESLINT_USE_FLAT_CONFIG=true
```

## 🎯 Integración con Git

### Git hooks:
```bash
# .husky/pre-commit
#!/bin/sh
pnpm run lint:fix
pnpm run format
```

### .gitignore additions:
```
.eslintcache
.prettierignore
```

## 📊 Métricas de Calidad

### Comandos útiles:
```bash
# Contar errores de linting
pnpm run lint:check | grep -c "error"

# Ver archivos con más problemas
pnpm run lint:check --format=unix | sort | uniq -c | sort -nr
```

## 🔄 Actualización

### Actualizar dependencias:
```bash
pnpm update eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Migrar configuración:
- ESLint 9 usa `eslint.config.mjs` (flat config)
- No usar `.eslintrc` (deprecated)

---

## 🏗️ Para Nuevos Desarrolladores

1. **Instalar extensiones** de VS Code mencionadas
2. **Ejecutar** `pnpm install` 
3. **Verificar** configuración: `pnpm run lint:check src/app.module.ts`
4. **Configurar** git hooks si es necesario

¡El código limpio es código feliz! 🚀