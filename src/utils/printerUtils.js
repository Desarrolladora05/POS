const generateESCPOSCommands = (ticketData, template) => {
  let commands = '';
  
  // Inicializar impresora
  commands += '\x1B\x40'; // ESC @
  
  // Configurar alineación centrada para el encabezado
  commands += '\x1B\x61\x01'; // ESC a 1
  
  // Encabezado
  if (template.header.businessName) {
    commands += `\x1B\x21\x30${template.header.businessName}\n`; // Texto grande
  }
  
  commands += '\x1B\x21\x00'; // Texto normal
  
  if (template.header.address) {
    commands += `${template.header.address}\n`;
  }
  
  if (template.header.phone) {
    commands += `${template.header.phone}\n`;
  }
  
  if (template.header.rfc) {
    commands += `${template.header.rfc}\n`;
  }
  
  // Línea separadora
  commands += '--------------------------------\n';
  
  // Alineación izquierda para el contenido
  commands += '\x1B\x61\x00'; // ESC a 0
  
  // Información del ticket
  if (template.content.showTicketNumber) {
    commands += `Ticket: ${ticketData.number}\n`;
  }
  
  if (template.content.showDate) {
    commands += `Fecha: ${ticketData.date}\n`;
  }
  
  if (template.content.showCashier && ticketData.cashier) {
    commands += `Cajero: ${ticketData.cashier}\n`;
  }
  
  if (template.content.showWaiter && ticketData.waiter) {
    commands += `Mesero: ${ticketData.waiter}\n`;
  }
  
  commands += '--------------------------------\n';
  
  // Productos
  ticketData.items.forEach(item => {
    commands += `${item.name}\n`;
    commands += `${item.quantity} x ${item.price} = ${item.total}\n`;
    
    if (template.content.showModifiers && item.modifiers && item.modifiers.length > 0) {
      commands += `  + ${item.modifiers.join(', ')}\n`;
    }
    
    if (template.content.showSpecialInstructions && item.specialInstructions) {
      commands += `  Nota: ${item.specialInstructions}\n`;
    }
  });
  
  commands += '--------------------------------\n';
  
  // Totales
  commands += `Subtotal: ${ticketData.subtotal}\n`;
  commands += `IVA: ${ticketData.tax}\n`;
  
  if (ticketData.discount > 0) {
    commands += `Descuento: -${ticketData.discount}\n`;
  }
  
  if (ticketData.tip > 0) {
    commands += `Propina: ${ticketData.tip}\n`;
  }
  
  commands += `TOTAL: ${ticketData.total}\n`;
  commands += '--------------------------------\n';
  
  // Método de pago
  commands += `Pago: ${ticketData.paymentMethod}\n`;
  
  if (ticketData.change > 0) {
    commands += `Cambio: ${ticketData.change}\n`;
  }
  
  // Pie de página
  commands += '\x1B\x61\x01'; // Centrar
  
  if (template.footer.thankYouMessage) {
    commands += `\n${template.footer.thankYouMessage}\n`;
  }
  
  if (template.footer.returnPolicy) {
    commands += `${template.footer.returnPolicy}\n`;
  }
  
  if (template.footer.additionalInfo) {
    commands += `${template.footer.additionalInfo}\n`;
  }
  
  // Cortar papel
  commands += '\x1D\x56\x00'; // GS V 0
  
  return commands;
};

const printToThermalPrinter = async (ticketData, template, printer) => {
  try {
    if ('serial' in navigator) {
      // Web Serial API para impresoras USB/Serial
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const writer = port.writable.getWriter();
      const commands = generateESCPOSCommands(ticketData, template);
      const encoder = new TextEncoder();
      
      await writer.write(encoder.encode(commands));
      writer.releaseLock();
      await port.close();
      
      return { success: true, message: 'Ticket impreso correctamente' };
    } else {
      // Fallback a window.print()
      return printWithBrowserDialog(ticketData, template);
    }
  } catch (error) {
    console.error('Error al imprimir:', error);
    return { success: false, message: 'Error al conectar con la impresora' };
  }
};

const printWithBrowserDialog = (ticketData, template) => {
  // Crear contenido HTML para impresión
  const printContent = generatePrintHTML(ticketData, template);
  
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
  
  return { success: true, message: 'Diálogo de impresión abierto' };
};

const generatePrintHTML = (ticketData, template) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket de Venta</title>
      <style>
        @media print {
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 10px;
            width: 80mm;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .business-name { font-size: 16px; font-weight: bold; }
          .separator { border-top: 1px dashed #000; margin: 5px 0; }
          .item { margin: 2px 0; }
          .total { font-weight: bold; }
          .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        }
        @media screen {
          body { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${template.header.businessName}</div>
        <div>${template.header.address}</div>
        <div>${template.header.phone}</div>
        <div>${template.header.rfc}</div>
      </div>
      
      <div class="separator"></div>
      
      <div>Ticket: ${ticketData.number}</div>
      <div>Fecha: ${ticketData.date}</div>
      ${ticketData.cashier ? `<div>Cajero: ${ticketData.cashier}</div>` : ''}
      
      <div class="separator"></div>
      
      ${ticketData.items.map(item => `
        <div class="item">
          <div>${item.name}</div>
          <div>${item.quantity} x ${item.price} = ${item.total}</div>
          ${item.modifiers && item.modifiers.length > 0 ? `<div style="font-size: 10px;">+ ${item.modifiers.join(', ')}</div>` : ''}
          ${item.specialInstructions ? `<div style="font-size: 10px; color: #666;">Nota: ${item.specialInstructions}</div>` : ''}
        </div>
      `).join('')}
      
      <div class="separator"></div>
      
      <div>Subtotal: ${ticketData.subtotal}</div>
      <div>IVA: ${ticketData.tax}</div>
      ${ticketData.discount > 0 ? `<div>Descuento: -${ticketData.discount}</div>` : ''}
      ${ticketData.tip > 0 ? `<div>Propina: ${ticketData.tip}</div>` : ''}
      <div class="total">TOTAL: ${ticketData.total}</div>
      
      <div class="separator"></div>
      
      <div>Pago: ${ticketData.paymentMethod}</div>
      ${ticketData.change > 0 ? `<div>Cambio: ${ticketData.change}</div>` : ''}
      
      <div class="footer">
        <div>${template.footer.thankYouMessage}</div>
        <div>${template.footer.returnPolicy}</div>
        <div>${template.footer.additionalInfo}</div>
      </div>
    </body>
    </html>
  `;
};

const generateQRCode = (data) => {
  // Simulación de generación de código QR
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data)}`;
};

export { 
  generateESCPOSCommands, 
  printToThermalPrinter, 
  printWithBrowserDialog, 
  generatePrintHTML,
  generateQRCode 
};