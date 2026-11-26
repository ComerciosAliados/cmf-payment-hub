# Hub de Pagos · Demo

Demo estática (HTML/CSS/JS) de un hub de pagos, publicada con GitHub Pages desde la rama `main`.

## Reglas (repositorio PÚBLICO)

- ❌ Nunca subir credenciales, claves de API, tokens ni contraseñas.
- ❌ Nunca usar datos reales: solo datos ficticios.
- ❌ Nunca incluir información interna, estrategia, documentación de proveedores ni URLs o configuración de sistemas internos. Todo eso vive en el repositorio privado del proyecto.
- ✅ Todo pago es simulado.

## Estructura

- `index.html` + `assets/app.js`: panel interno (login simulado por rol, dashboard, cobros, nuevo cobro, clientes, usuarios y permisos, auditoría, integraciones).
- `pagar.html` + `assets/pagar.js`: página que ve el cliente al abrir el link. Los datos del cobro viajan codificados en el link (`?d=`).
- `assets/data.js`: datos ficticios y estado en `localStorage`.
- `assets/styles.css`: estilos.

Métodos de pago simulados: Tarjeta CMF (correo y cédula, al contado o en cuotas), Visa/Mastercard, Clave, ACH y Yappy.

## Convenciones

- Interfaz y documentación en español; código en inglés.
