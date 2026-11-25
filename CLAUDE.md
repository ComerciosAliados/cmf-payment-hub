# CMF Payment Hub

Hub de pagos centralizado para CMF Panamá.

## Contexto de la empresa

CMF es una empresa del sector financiero en Panamá que ofrece soluciones de financiamiento y productos de crédito:

- **Productos financieros**: tarjetas de crédito, tarjetas digitales, productos prepagados y financiamiento.
- **Comercios Aliados**: establecimientos donde los clientes usan productos CMF para comprar y pagar en cuotas.
- **Gestión de cartera y cobros**: seguimiento de clientes, morosidad, recuperación de saldos y comportamiento de pago.
- **Canales comerciales**: vendedores, sucursales, referidos y campañas.

El responsable del proyecto es Data & Analytics Officer, vinculado al departamento de Cobros, y trabaja con las áreas Comercial, Operaciones, Tecnología y Gestión de Cartera.

## Estado del proyecto

**Fase actual: demo pública en GitHub Pages.**

Este repositorio es **PÚBLICO**. Reglas obligatorias:

- ❌ **Nunca** subir credenciales, claves de API, tokens ni contraseñas.
- ❌ **Nunca** usar datos reales de clientes, cuentas, saldos ni transacciones. Solo datos ficticios.
- ❌ **Nunca** incluir URLs, endpoints ni configuración de sistemas internos de CMF.
- ✅ La demo es estática (HTML/CSS/JS) y simula los flujos con datos inventados.
- ✅ El backend real con integraciones de pago vivirá en un **repositorio privado separado**.

## Alcance

### El problema
El grupo dueño de CMF adquirió las empresas de **Grupo Rapid**, cuya cobranza es muy manual: según el método que elija el cliente (Yappy, ACH, tarjeta), el gestor tiene que entrar a sistemas distintos, pedir datos y registrar todo a mano.

### Lo que ya existe
La app de CMF tiene una pasarela de pago (vía APIs) con:
- **Tarjeta CMF** (tarjetas de crédito propias de CMF): método **separado** de Visa/Mastercard, con opción de pago en cuotas. El cliente se identifica con **correo y cédula** (no con número de tarjeta)
- Tarjeta **Visa / Mastercard** (débito y crédito)
- **Clave**
- **ACH**
- **Yappy** (Banco General)

La documentación de esas APIs se recibirá más adelante.

### Fase 1 (objetivo inicial)
Web con base de datos donde el gestor **solo ingresa el monto** (y datos del cliente), se genera un **link de pago** y se le envía al cliente. El **cliente elige** cómo pagar. Todo centralizado: sin preguntar método, sin entrar a sistemas diferentes.

Requisitos transversales:
- Seguridad completa: login, perfiles, roles, permisos, auditoría.
- **API / web services** propios para que otros sistemas se conecten en el futuro.

### Fases siguientes (visión)
- **Fase 2 – Odoo (ERP de Grupo Rapid)**: traer catálogo de precios, servicios, clientes, y registrar pagos de vuelta. Ya existen APIs de Odoo usadas antes para Rapid.
- **Fase 3 – WhatsApp Business**: que el cliente se autogestione (consultar saldo, recibir y pagar links) desde WhatsApp.

### Preguntas abiertas
1. ¿Con qué sistema central se registran hoy los pagos de Rapid (¿Odoo?)?
2. ¿Qué áreas aprueban la arquitectura? (Tecnología, Seguridad, Cumplimiento)
3. ¿Los links vencen? ¿Se permiten pagos parciales?

## Demo (este repo)

Sitio estático en la raíz, publicado con GitHub Pages:
- `index.html` + `assets/app.js`: panel interno (login simulado por rol, dashboard, cobros, nuevo cobro, clientes, usuarios y permisos, auditoría, integraciones).
- `pagar.html` + `assets/pagar.js`: página que ve el cliente al abrir el link. Los datos del cobro viajan codificados en el link (`?d=`), así el link funciona en cualquier dispositivo.
- `assets/data.js`: datos ficticios y estado guardado en `localStorage` del navegador.
- Ningún pago es real: todo está simulado.

## Arquitectura propuesta (producción, repo privado)

| Componente | Tecnología |
|---|---|
| API del hub | Cloud Run (Python / FastAPI) |
| Transacciones | Cloud SQL (PostgreSQL): ACID, libro contable |
| Credenciales | Secret Manager |
| Webhooks y asíncronos | Pub/Sub + Cloud Tasks (reintentos, idempotencia) |
| Analítica y conciliación | BigQuery + Looker Studio |
| Auditoría | Logs inmutables de cada movimiento |

Principios: idempotencia en todo cobro, tokenización del proveedor (no almacenar tarjetas, PCI DSS), registro de auditoría completo y conciliación diaria.

## Stack del equipo

BigQuery, SQL, Python, Looker Studio, Google Cloud (Cloud Run, Firestore, Secret Manager), Firebase, Apps Script, GitHub, HTML/CSS/JS.

## Convenciones

- Idioma de la documentación y la interfaz: **español**.
- Código (variables, funciones): inglés.
- La demo se publica con GitHub Pages desde la rama `main`.
