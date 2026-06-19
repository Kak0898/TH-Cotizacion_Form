# TH Cotizaciones - Logo + Supabase

App estática para crear cotizaciones de Técnica Hidráulica Ltda.

## Cambios incluidos

- Mantiene el formato base de la app original.
- Encabezado con texto corporativo a la izquierda.
- Logo debajo del texto corporativo.
- Documento fijo como COTIZACIÓN.
- Número de cotización grande y bloqueado.
- Contador automático desde Supabase.
- Última cotización base: 11865. La próxima será 11866.

## Configurar Supabase

1. Abre Supabase > SQL Editor.
2. Ejecuta el archivo `supabase_counter.sql`.
3. En `index.html`, pega tu Project URL y anon public key:

```js
window.TH_SUPABASE = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_KEY"
};
```

Si no configuras Supabase, la app funciona igual con contador local del navegador.


## Versión v6 - Más espacio en formulario
- Panel izquierdo ampliado.
- Se quitó el scroll interno del panel de edición.
- La página completa maneja el scroll.
- Los campos ya no se cortan horizontalmente.
- Vista responsive mejorada para pantallas medianas.
# TH-Cotizacion_Form
# TH-Cotizacion_Form
# TH-Cotizacion_Form
