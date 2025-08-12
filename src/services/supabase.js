import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create Supabase client - will throw error if credentials are missing
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database tables configuration
export const TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  USERS: 'user_profiles',
  ADMIN_USERS: 'admin_users',
};

// Authentication helpers
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (data.user && !error) {
      // Create user profile immediately since no email confirmation needed
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  getUserProfile: async userId => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    return { data, error };
  },
};

// User Data helpers
export const userData = {
  // Cart Items
  getCartItems: async userId => {
    const { data, error } = await supabase
      .from('user_cart_items')
      .select(
        `
        *,
        products (*)
      `
      )
      .eq('user_id', userId);
    return { data, error };
  },

  addToCart: async (userId, productId, quantity = 1) => {
    const { data, error } = await supabase
      .from('user_cart_items')
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          quantity: quantity,
        },
        {
          onConflict: 'user_id,product_id',
        }
      )
      .select();
    return { data, error };
  },

  updateCartItem: async (userId, productId, quantity) => {
    const { data, error } = await supabase
      .from('user_cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select();
    return { data, error };
  },

  removeFromCart: async (userId, productId) => {
    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    return { error };
  },

  clearCart: async userId => {
    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('user_id', userId);
    return { error };
  },

  // User Preferences
  getUserPreferences: async userId => {
    // Use maybeSingle to avoid 404/406; return default when not found
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') return { data: null, error };
    return { data: data || null, error: null };
  },

  updateUserPreferences: async (userId, preferences) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select();
    return { data, error };
  },

  // User Orders
  getUserOrders: async userId => {
    const { data, error } = await supabase
      .from('user_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createUserOrder: async (userId, orderData) => {
    const { data, error } = await supabase
      .from('user_orders')
      .insert({
        user_id: userId,
        ...orderData,
      })
      .select();
    return { data, error };
  },
};

// Database helpers
export const db = {
  // Products
  getProducts: async () => {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Orders (single by id via RPC preferred)
  getOrderById: async id => {
    // Try RPC if present
    try {
      const { data, error } = await supabase.rpc('get_order_by_id', {
        _id: id,
      });
      if (!error && data) return { data, error: null };
    } catch {}
    // Fallback: direct select (requires SELECT policy for this row)
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data, error };
  },

  getProduct: async id => {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  createProduct: async productData => {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert(productData)
      .select();
    return { data, error };
  },

  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  deleteProduct: async id => {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id);
    return { error };
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .order('name', { ascending: true });
    return { data, error };
  },

  // Promos
  getPromosProducts: async () => {
    // Try to get the promos category; avoid 406 when not found
    const { data: promosCategory, error: categoryError } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .ilike('name', 'promos')
      .maybeSingle();

    if (categoryError || !promosCategory) {
      // No promos category in this project; return empty set without error
      return { data: [], error: null };
    }

    // Get products only from the promos category (no parent_id dependency)
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(
        `
        *,
        categories (name)
      `
      )
      .eq('category_id', promosCategory.id)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  getRegularProducts: async (options = {}) => {
    const {
      categoryIds = null, // array of ids or null
      searchTerm = '', // string
      priceMin = null, // number or null
      priceMax = null, // number or null
      sortBy = 'newest', // 'newest' | 'price-low' | 'price-high'
      discountFilter = 'all', // 'all' | 'discounted' | 'no-discount'
      page = 1,
      pageSize = 24,
      excludePromos = true,
    } = options;

    // Optionally exclude promos category
    let promosCategoryId = null;
    if (excludePromos) {
      const { data: promosCategory } = await supabase
        .from(TABLES.CATEGORIES)
        .select('id')
        .ilike('name', 'promos')
        .maybeSingle();
      promosCategoryId = promosCategory?.id || null;
    }

    let query = supabase.from(TABLES.PRODUCTS).select(
      `
        id, name, price, discount, image_url, category_id, created_at,
        categories (name)
      `,
      { count: 'exact' }
    );

    // Filters
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }
    if (promosCategoryId) {
      query = query.neq('category_id', promosCategoryId);
    }
    if (priceMin != null) {
      query = query.gte('price', priceMin);
    }
    if (priceMax != null) {
      query = query.lte('price', priceMax);
    }
    if (discountFilter === 'discounted') {
      query = query.gt('discount', 0);
    } else if (discountFilter === 'no-discount') {
      query = query.or('discount.eq.0,discount.is.null');
    }
    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      // Search by name (brand omitted per your schema); include description if present in your schema
      query = query.or(`name.ilike.${term}`);
    }

    // Sorting
    if (sortBy === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  // Orders
  getOrders: async () => {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createOrder: async orderData => {
    // Use minimal returning to avoid SELECT permission issues under RLS
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .insert(orderData, { returning: 'minimal' });
    return { data: null, error };
  },

  updateOrderStatus: async (orderId, { status, is_verified }) => {
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .update({ status, is_verified })
      .eq('id', orderId);
    return { data: null, error };
  },

  updateOrderFulfillment: async (orderId, fulfillment_status) => {
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .update({ fulfillment_status })
      .eq('id', orderId);
    return { data: null, error };
  },

  // Analytics
  getSalesSummary: async (fromDate, toDate) => {
    // Returns total revenue and order count in range
    let query = supabase
      .from(TABLES.ORDERS)
      .select('total, created_at', { count: 'exact' });
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);
    const { data, error, count } = await query;
    const revenue = (data || []).reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0
    );
    return { revenue, count: count || 0, error };
  },

  getTopSellingProducts: async (limit = 10) => {
    // Assuming orders table has items array [{product_id, quantity, price}]
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('items')
      .order('created_at', { ascending: false });
    if (error) return { data: [], error };
    const map = new Map();
    for (const o of data || []) {
      for (const it of o.items || []) {
        const key = it.product_id;
        const prev = map.get(key) || { qty: 0, revenue: 0 };
        prev.qty += Number(it.quantity) || 0;
        prev.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0);
        map.set(key, prev);
      }
    }
    const arr = [...map.entries()].map(([product_id, v]) => ({
      product_id,
      ...v,
    }));
    arr.sort((a, b) => b.qty - a.qty);
    return { data: arr.slice(0, limit), error: null };
  },

  decrementProductQuantities: async items => {
    // items: [{ product_id, quantity }]
    return supabase.rpc('decrement_product_quantities', { _items: items });
  },

  // Scent Tags (normalized model)
  getScentTags: async () => {
    const { data, error } = await supabase
      .from('scent_tags')
      .select('*')
      .order('name', { ascending: true });
    return { data, error };
  },

  createScentTag: async name => {
    const clean = String(name || '').trim();
    if (!clean) return { data: null, error: new Error('Tag name required') };
    const { data, error } = await supabase
      .from('scent_tags')
      .insert({ name: clean })
      .select()
      .maybeSingle();
    return { data, error };
  },

  getProductScentTagIds: async productId => {
    const { data, error } = await supabase
      .from('product_scent_tags')
      .select('tag_id')
      .eq('product_id', productId);
    if (error) return { data: [], error };
    const ids = (data || []).map(r => r.tag_id);
    return { data: ids, error: null };
  },

  setProductScentTags: async (productId, tagIds) => {
    // Replace tags: delete existing then insert
    await supabase
      .from('product_scent_tags')
      .delete()
      .eq('product_id', productId);
    if (!Array.isArray(tagIds) || tagIds.length === 0)
      return { data: [], error: null };
    const rows = tagIds.map(tag_id => ({ product_id: productId, tag_id }));
    const { data, error } = await supabase
      .from('product_scent_tags')
      .insert(rows)
      .select();
    return { data, error };
  },

  // Lightweight customer storage without auth
  upsertUserByPhone: async ({
    full_name,
    phone,
    email = null,
    address = null,
  }) => {
    if (!phone || !full_name) {
      return {
        data: null,
        error: new Error('phone and full_name are required'),
      };
    }
    const normalizedPhone = String(phone).replace(/\D/g, '');
    const timestamp = new Date().toISOString();
    // 1) Try update-first to avoid insert conflicts
    const { error: updErr } = await supabase
      .from('user_profiles')
      .update({ full_name, email, address, updated_at: timestamp })
      .eq('phone', normalizedPhone);
    if (!updErr) return { data: null, error: null };
    // 2) Insert if no row was updated
    const { data, error } = await supabase.from('user_profiles').insert(
      {
        full_name,
        phone: normalizedPhone,
        email,
        address,
        updated_at: timestamp,
      },
      { returning: 'minimal', ignoreDuplicates: true }
    );
    return { data, error };
  },
};
