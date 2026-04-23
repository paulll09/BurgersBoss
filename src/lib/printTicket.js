function fmt(n) {
    return '$' + Number(n).toLocaleString('es-AR');
}

function padNum(n) {
    return String(n).padStart(4, '0');
}

function buildHTML(order) {
    const date    = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const items   = Array.isArray(order.items) ? order.items : [];

    const itemsHTML = items.map(item => {
        const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
        const extrasHTML = (item.extras ?? []).map(e =>
            `<div class="extra">+ ${e.name}</div>`
        ).join('');
        return `
            <div class="item">
                <span class="qty">${item.quantity}x</span>
                <span class="iname">${name}</span>
                <span class="iprice">${fmt(item.price * item.quantity)}</span>
            </div>
            ${extrasHTML}
        `;
    }).join('');


    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comanda #${padNum(order.order_number)}</title>
<style>
  @page { size: 58mm auto; margin: 3mm 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11.5px;
    width: 54mm;
    color: #000;
    background: #fff;
    line-height: 1.4;
  }
  .title {
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 2px;
    margin: 4px 0 3px;
  }
  .solid { border-top: 1.5px solid #000; margin: 5px 0; }
  .dashed { border-top: 1px dashed #000; margin: 5px 0; }
  .row { margin: 2px 0; }
  .bold { font-weight: bold; }
  .item {
    display: flex;
    gap: 3px;
    margin: 3px 0 1px;
  }
  .qty   { flex-shrink: 0; width: 20px; }
  .iname { flex: 1; word-break: break-word; }
  .iprice { flex-shrink: 0; text-align: right; }
  .extra { font-size: 10px; padding-left: 22px; color: #444; margin-bottom: 1px; }
  .total-row {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 13.5px;
    margin: 4px 0 2px;
  }
  .meta { font-size: 10.5px; color: #333; margin: 1px 0; }
  .address { font-size: 10px; color: #333; margin: 1px 0; }
  .thanks {
    text-align: center;
    font-size: 11px;
    margin-top: 10px;
    line-height: 1.6;
  }
</style>
</head>
<body>
  <div class="title">BURGERS BOSS</div>
  <div class="solid"></div>

  <div class="row bold">Pedido #${padNum(order.order_number)}</div>
  <div class="row">${dateStr} &nbsp; ${timeStr}</div>
  <div class="row bold">Cliente: ${order.customer_name}</div>

  <div class="dashed"></div>

  ${itemsHTML}

  ${order.notes ? `<div class="dashed"></div><div class="meta bold">Aclaración: ${order.notes}</div>` : ''}

  <div class="solid"></div>

  <div class="total-row">
    <span>TOTAL</span>
    <span>${fmt(order.total)}${order.order_type === 'delivery' ? ' + envio' : ''}</span>
  </div>

  <div class="meta">${order.order_type === 'delivery' ? 'Envio a domicilio' : 'Retira en el local'}</div>

  <div class="dashed"></div>

  <div class="thanks">
    Muchas gracias<br>por elegirnos
  </div>
</body>
</html>`;
}

export function printTicket(order) {
    const win = window.open('', '_blank', 'width=380,height=650,scrollbars=no,toolbar=no');
    if (!win) {
        alert('Permitir ventanas emergentes para imprimir la comanda.');
        return;
    }
    win.document.write(buildHTML(order));
    win.document.close();
    win.focus();
    // Small delay to ensure styles are applied before print dialog
    setTimeout(() => {
        win.print();
        win.addEventListener('afterprint', () => win.close());
    }, 300);
}
