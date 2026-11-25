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

## Alcance (por definir)

Preguntas abiertas:

1. ¿Qué pagos centraliza el hub? ¿Pagos de clientes a CMF (cuotas), liquidaciones a Comercios Aliados, o ambos?
2. ¿Qué canales o proveedores se integran? (pasarelas de tarjeta, ACH, billeteras digitales, sucursales, bancos)
3. ¿Con qué sistema central (core de crédito) se conecta y si tiene API?
4. ¿Qué áreas aprueban la arquitectura? (Tecnología, Seguridad, Cumplimiento)

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
