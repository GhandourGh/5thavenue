// Bank Transfer Configuration for 5th Avenue Spanish
// Update these values with your actual bank account information

export const BANK_CONFIG = {
  // Bank Account Information
  bankName: '[NOMBRE DEL BANCO]', // e.g., 'Bancolombia', 'Banco de Bogotá', 'Davivienda'
  accountType: 'Corriente', // 'Corriente' or 'Ahorros'
  accountNumber: '[NÚMERO DE CUENTA]', // Your actual account number
  accountHolder: '5th Avenue Spanish', // Business name
  documentType: 'NIT', // 'NIT' or 'Cédula'
  documentNumber: '[NÚMERO DE NIT]', // Your actual NIT or ID number

  // Contact Information
  whatsappNumber: '[TU NÚMERO]', // Your WhatsApp number with country code, e.g., '+573001234567'
  email: '[TU EMAIL]', // Your business email

  // Processing Information
  processingTime: '24-48 horas', // Time to process payment after verification
  businessHours: 'Lunes a Viernes 8:00 AM - 6:00 PM',

  // Instructions
  instructions: [
    'Usa la referencia exacta del número de orden',
    'Verifica el monto antes de transferir',
    'Guarda el comprobante de transferencia',
    'Envía el comprobante por WhatsApp',
  ],
};

// WhatsApp message template
export const getWhatsAppMessage = (orderNumber, amount) => {
  return `Hola, tengo una consulta sobre mi transferencia para la orden ${orderNumber} por ${amount}`;
};

// WhatsApp URL generator
export const getWhatsAppUrl = (orderNumber, amount) => {
  const message = getWhatsAppMessage(orderNumber, amount);
  return `https://wa.me/${BANK_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
};
