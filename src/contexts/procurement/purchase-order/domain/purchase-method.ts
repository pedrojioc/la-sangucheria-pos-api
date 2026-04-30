/**
 * PurchaseMethod - Value Object (Enum)
 *
 * Método utilizado para procesar/comunicar la orden de compra.
 *
 * Este campo es opcional y se establece cuando la orden es aprobada.
 * Permite trackear cómo se realizó la compra sin necesidad de un estado "SENT".
 */
export enum PurchaseMethod {
  /**
   * Sistema envió la orden automáticamente al proveedor
   * (email, API, webhook, etc.)
   */
  SENT_AUTOMATICALLY = 'SENT_AUTOMATICALLY',

  /**
   * Admin/Usuario contactó manualmente al proveedor
   * (WhatsApp, teléfono, email manual, etc.)
   */
  SENT_MANUALLY = 'SENT_MANUALLY',

  /**
   * Compra directa/presencial en tienda del proveedor
   * No se "envió" una orden, personal fue a comprar
   */
  DIRECT_PURCHASE = 'DIRECT_PURCHASE',

  /**
   * Proveedor entrega sin orden formal previa
   * (ej: vendedor ambulante, entrega recurrente automática)
   */
  SUPPLIER_DELIVERY = 'SUPPLIER_DELIVERY',

  /**
   * Orden realizada a través de plataforma externa
   * (marketplace, app de proveedor, etc.)
   */
  PLATFORM_ORDER = 'PLATFORM_ORDER'
}
