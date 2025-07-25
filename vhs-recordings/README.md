# VHS Terminal Recordings

Esta carpeta contiene las grabaciones de terminal creadas con [VHS](https://github.com/charmbracelet/vhs) para demostrar el sistema de concurrencia.

## 📹 Grabaciones Disponibles

### `simple-demo.gif` (2.1MB)
Demo básico que muestra:
- Configuración del API y datos de prueba
- Simulación de 5 workers concurrentes
- Resultados finales de jobs y transacciones procesadas

![Simple Demo](simple-demo.gif)

## 🎬 Cómo Grabar Nuevas Demos

### Prerrequisitos
```bash
# Instalar VHS
go install github.com/charmbracelet/vhs@latest

# Instalar ttyd (requerido por VHS)
wget https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64
chmod +x ttyd.x86_64
mv ttyd.x86_64 ~/.local/bin/ttyd

# Añadir al PATH
export PATH=$HOME/.local/bin:$PATH:$(go env GOPATH)/bin
```

### Grabar Demo
```bash
# Usar script automatizado
./scripts/record-demo.sh

# O manualmente
vhs vhs-recordings/simple-demo.tape
```

## 📝 Estructura de Archivos VHS Tape

```tape
# Configuración
Output vhs-recordings/demo.gif
Set FontSize 12
Set Width 1000
Set Height 600
Set Theme "TokyoNight"
Set Shell bash

# Comandos
Type "echo 'Hello World'"
Enter
Sleep 2s
```

## 🎯 Tips para Mejores Grabaciones

1. **Tamaño optimizado**: Usar dimensiones apropiadas (1000x600)
2. **Fuente legible**: FontSize 12 es ideal para demos
3. **Tiempos apropiados**: Sleep entre comandos para legibilidad
4. **Themes disponibles**: TokyoNight, Dracula, Catppuccin, etc.
5. **Comandos simples**: Evitar pipes complejos que pueden fallar

## 🔧 Troubleshooting

### Error: `ttyd is not installed`
```bash
# Descargar e instalar ttyd
wget https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64
chmod +x ttyd.x86_64
mkdir -p ~/.local/bin
mv ttyd.x86_64 ~/.local/bin/ttyd
```

### Error: `Invalid command`
- Evitar caracteres Unicode complejos en comandos
- Simplificar pipes con jq
- Usar comandos básicos de shell

### Error: `Theme not found`
- Usar themes válidos: `TokyoNight`, `Dracula`, `CatppuccinMocha`
- Verificar capitalización exacta

## 📊 Métricas de Archivo

| Archivo | Tamaño | Duración | Descripción |
|---------|--------|----------|-------------|
| `simple-demo.gif` | 2.1MB | ~45s | Demo básico de concurrencia |

## 🚀 Publicar en Charm

```bash
# Publicar GIF en vhs.charm.sh
vhs publish vhs-recordings/simple-demo.gif
```

Esto genera una URL pública para compartir la demo.