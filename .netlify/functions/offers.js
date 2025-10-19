import { supaAdmin } from './_client.js';

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

export const handler = async () => {
  try {
    const supa = supaAdmin();
    const { data, error } = await supa
      .from('products')
      .select(`
        id, name_ar, name_tr, price, sale_price, sell_mode, approx_kg, image_url,
        categories:category_id ( id, name_ar, name_tr ),
        product_cuts ( id, name_ar, name_tr )
      `)
      .gt('sale_price', 0)
      .not('sale_price', 'is', null);

    if (error) throw error;

    const mapped = (data || [])
      .filter((p) => Number(p.sale_price) < Number(p.price))
      .map((p) => ({
        id: p.id,
        names: { ar: p.name_ar, tr: p.name_tr },
        category: {
          id: p.categories?.id || 'misc',
          names: {
            ar: p.categories?.name_ar || 'عام',
            tr: p.categories?.name_tr || 'Genel',
          },
        },
        price: Number(p.price) || 0,
        salePrice: Number(p.sale_price) || 0,
        cuts: (p.product_cuts || []).map((c) => ({
          id: c.id,
          names: { ar: c.name_ar, tr: c.name_tr },
        })),
        image: p.image_url || '',
        sellMode: Number(p.sell_mode) || 0,
        approxKg: Number(p.approx_kg) || 0,
      }));

    return json(200, mapped);
  } catch (error) {
    return json(500, { error: String(error?.message || error) });
  }
};

export default handler;
