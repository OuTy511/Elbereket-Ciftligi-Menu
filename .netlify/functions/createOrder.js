import { supaAdmin } from './_client.js';

const json = (statusCode, payload, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...extraHeaders,
  },
  body: JSON.stringify(payload),
});

const calcLine = (it = {}) => {
  const price = Number(it.price) || 0;
  const qty = Number(it.qty) || 0;
  if (Number(it.sellMode) === 2) {
    const approx = Number(it.approxKg) || 0;
    return approx > 0 ? price * approx * Math.max(1, Math.floor(qty)) : 0;
  }
  if (Number(it.sellMode) === 1) return price * qty;
  return price * Math.max(1, Math.floor(qty));
};

const parseBody = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
};

export const handler = async (event = {}) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, { Allow: 'POST' });
  }

  try {
    const body = parseBody(event.body);
    const {
      customer = {},
      items = [],
      notes = '',
      payMethod = 'cash',
      address = '',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return json(400, { ok: false, error: 'Order requires at least one item' });
    }

    const subtotal = items.reduce((sum, item) => sum + calcLine(item), 0);
    const discount_total = 0;
    const total = Math.max(0, subtotal - discount_total);

    const supa = supaAdmin();

    let customer_id = null;
    if (customer?.phone) {
      const { data: existing, error: findErr } = await supa
        .from('customers')
        .select('id')
        .eq('phone', customer.phone)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing?.id) {
        customer_id = existing.id;
      } else {
        const { data: created, error: createErr } = await supa
          .from('customers')
          .insert({
            name: customer.name || null,
            phone: customer.phone,
            note: customer.note || null,
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        customer_id = created.id;
      }
    }

    const order_no = `ELB-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 99999),
    ).padStart(5, '0')}`;

    const { data: order, error: orderErr } = await supa
      .from('orders')
      .insert({
        order_no,
        customer_id,
        status: 'new',
        pay_method: payMethod,
        address,
        notes,
        subtotal,
        discount_total,
        total,
      })
      .select('id')
      .single();

    if (orderErr) throw orderErr;

    const rows = items.map((it) => ({
      order_id: order.id,
      product_id: it.productId || null,
      name_snapshot: (it.name?.ar || it.name?.tr || '').trim(),
      category_snapshot: (
        it.category?.names?.ar || it.category?.names?.tr || ''
      ).trim(),
      cut_snapshot: (it.cut?.ar || it.cut?.tr || '').trim(),
      price: Number(it.price) || 0,
      qty: Number(it.qty) || 0,
      sell_mode: Number(it.sellMode) || 0,
      approx_kg: Number(it.approxKg) || 0,
    }));

    if (rows.length) {
      const { error: itemsErr } = await supa.from('order_items').insert(rows);
      if (itemsErr) throw itemsErr;
    }

    return json(200, { ok: true, orderId: order.id, orderNo: order_no, total });
  } catch (error) {
    return json(500, { ok: false, error: String(error?.message || error) });
  }
};

export default handler;
