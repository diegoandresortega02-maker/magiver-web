import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// El isotipo fuente ya trae su propio margen de seguridad (el dibujo ocupa
// ~59%/48% del lienzo), así que le sacamos el padding extra de 30% que el
// preset le suma por defecto al icono maskable — si no, queda un cuadrado
// navy chiquito flotando en un mar de blanco.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.05 },
  },
  images: ['src/imports/logo/isotipo-navy.png'],
})
