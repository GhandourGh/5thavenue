import React, { useState, useEffect } from 'react';
import {
  Save,
  Edit,
  X,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { db } from '../services/supabase';
import { calculateDiscountPercentage, formatCOP } from '../utils/helpers';
import { resizeImage, supportsWebP } from '../utils/imageConverter';
import AdminLogin from '../components/AdminLogin';

// Common fragrance notes to speed up tagging; admin can add custom too
const PRESET_NOTES = [
  'Bergamota',
  'Limón',
  'Pomelo',
  'Naranja',
  'Piña',
  'Manzana',
  'Pera',
  'Lavanda',
  'Rosa',
  'Jazmín',
  'Violeta',
  'Iris',
  'Geranio',
  'Lirio',
  'Pimienta',
  'Cardamomo',
  'Canela',
  'Nuez moscada',
  'Azafrán',
  'Ámbar',
  'Vainilla',
  'Almizcle',
  'Sándalo',
  'Cedro',
  'Pachulí',
  'Oud',
  'Vetiver',
  'Haba tonka',
  'Cuero',
  'Incienso',
];

// Utilities to convert between stored strings and tag arrays
const parseNotesStringToTags = value => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

const toNotesString = tags => {
  return (Array.isArray(tags) ? tags : [])
    .map(t => String(t).trim())
    .filter(t => t.length > 0)
    .join(', ');
};

// Reusable tag selector component for notes
const NotesTagSelector = ({ label, tags, setTags }) => {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = nextTag => {
    const normalized = String(nextTag || '').trim();
    if (!normalized) return;
    if (tags.includes(normalized)) return;
    setTags([...tags, normalized]);
    setInputValue('');
  };

  const removeTag = tag => {
    setTags(tags.filter(t => t !== tag));
  };

  const onKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const availableSuggestions = PRESET_NOTES.filter(n => !tags.includes(n));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.length === 0 && (
          <span className="text-xs text-gray-500">No notes added yet.</span>
        )}
        {tags.map(tag => (
          <span
            key={`${label}-sel-${tag}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200"
          >
            <span className="capitalize">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="ml-1 text-gray-500 hover:text-gray-700"
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {/* Input */}
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
        placeholder="Type a note and press Enter (e.g., bergamot)"
        aria-label={`${label} input`}
      />
      <p className="mt-1 text-xs text-gray-500">
        Press Enter to add custom notes. Suggestions below.
      </p>
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mt-2">
        {availableSuggestions.map(n => (
          <button
            key={`${label}-sugg-${n}`}
            type="button"
            onClick={() => addTag(n)}
            className="px-2.5 py-1 rounded-full text-xs border border-gray-300 hover:border-red-600 hover:text-red-700 capitalize"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Pricing fields
    original_price: '',
    discounted_price: '',
    discount: 0,
    quantity: '',
    image_url: '',
    category_id: '',
    scent_tags: '', // optional, comma-separated (legacy text field not used when normalized join is enabled)
    top_notes: '',
    middle_notes: '',
    base_notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [salesSummary, setSalesSummary] = useState({ revenue: 0, count: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState('30'); // days
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // Scent tags state (normalized)
  const [allScentTags, setAllScentTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'analytics'
  // Orders page UI state
  const [ordersFilter, setOrdersFilter] = useState('all'); // all|unpaid|waiting|processing|finished|cod|bold|refunded
  const [selectedOrders, setSelectedOrders] = useState({});
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [fulfillment, setFulfillment] = useState({}); // client-only: waiting|processing|finished|cancelled
  const [fulfillmentMenu, setFulfillmentMenu] = useState({});

  // Notes tags state for Add Product form
  const [topNoteTags, setTopNoteTags] = useState([]);
  const [middleNoteTags, setMiddleNoteTags] = useState([]);
  const [baseNoteTags, setBaseNoteTags] = useState([]);
  // Multiple images (Add form)
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  // Multiple images (Edit modal)
  const [editGalleryUrls, setEditGalleryUrls] = useState([]);
  // Upload progress (coarse, per-file count)
  const [uploadsInProgress, setUploadsInProgress] = useState(0);

  // Upload a single image file to Supabase Storage and return its public URL
  const uploadImageAndGetUrl = async file => {
    if (!file) return null;
    setUploadsInProgress(c => c + 1);
    try {
      let processedFile = file;
      try {
        processedFile = await resizeImage(file, 1200, 1200, 0.8);
      } catch {
        // fall back to original file
      }
      const fileName = `${Math.random()}.webp`;
      const filePath = `product-images/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, processedFile);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Error uploading image: ' + (err?.message || 'unknown'));
      return null;
    } finally {
      setUploadsInProgress(c => Math.max(0, c - 1));
    }
  };

  const moveItemToFront = (index, list, setList) => {
    setList(prev => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  };

  const reorderByDrag = (from, to, list, setList) => {
    if (from === to || from < 0 || to < 0) return;
    setList(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage('Error loading categories: ' + error.message);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        setMessage('Error loading products: ' + error.message);
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products: ' + error.message);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
      loadProducts();
      loadAnalytics();
      loadOrders();
      db.getScentTags().then(({ data }) => setAllScentTags(data || []));
    }
  }, [isAuthenticated]);

  // Poll products periodically to reflect stock decrements after checkout
  useEffect(() => {
    const id = setInterval(loadProducts, 5000);
    return () => clearInterval(id);
  }, []);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data, error } = await db.getOrders();
      if (!error) {
        setOrders(data || []);
        // hydrate local fulfillment map from DB column if present
        const next = {};
        (data || []).forEach(o => {
          if (o.fulfillment_status) next[o.id] = o.fulfillment_status;
        });
        setFulfillment(next);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatCurrency = (n, currency = 'COP') => {
    const raw = Number(n) || 0;
    // For COP we store some values in thousands. Convert and show "200.000 COP"
    if (String(currency).toUpperCase() === 'COP') {
      const amountInCop = raw < 1000 ? raw * 1000 : raw;
      return `${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amountInCop))} COP`;
    }
    // Other currencies: default Intl currency format
    const locale = currency === 'USD' ? 'en-US' : undefined;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(Math.round(raw));
    } catch {
      return `${currency} ${Math.round(raw).toLocaleString()}`;
    }
  };

  const markPaid = async o => {
    const autoVerify =
      o.payment_method &&
      ['bold', 'card', 'credit', 'visa', 'amex', 'discover'].includes(
        String(o.payment_method).toLowerCase()
      );
    const { error } = await db.updateOrderStatus(o.id, {
      status: 'paid',
      is_verified: !!autoVerify,
    });
    if (error) {
      setMessage('Error updating order: ' + (error.message || 'unknown'));
    } else {
      setMessage('Order marked paid');
      loadOrders();
    }
  };

  const verifyPayment = async orderId => {
    const { error } = await db.updateOrderStatus(orderId, {
      status: 'paid',
      is_verified: true,
    });
    if (error) {
      setMessage('Error verifying order: ' + (error.message || 'unknown'));
    } else {
      setMessage('Order verified');
      loadOrders();
    }
  };

  const unpayOrder = async orderId => {
    const { error } = await db.updateOrderStatus(orderId, {
      status: 'awaiting_payment',
      is_verified: false,
    });
    if (error) {
      setMessage('Error reverting order: ' + (error.message || 'unknown'));
    } else {
      setMessage('Order reverted to unpaid');
      loadOrders();
    }
  };

  // Helpers for orders UI
  const methodBadge = method => {
    const m = String(method || '').toUpperCase();
    const isBold =
      m === 'BOLD' ||
      m === 'CARD' ||
      ['VISA', 'AMEX', 'DISCOVER', 'CREDIT'].includes(m);
    return (
      <span
        title={
          isBold
            ? 'Auto-verified—no manual confirmation required.'
            : 'Cash on delivery'
        }
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${isBold ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
      >
        {isBold ? 'BOLD (Card)' : 'COD'}
      </span>
    );
  };

  const paymentBadge = o => {
    const status = String(o.status || '').toLowerCase();
    if (status === 'paid') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800"
          title={
            o.payment_method &&
            String(o.payment_method).toLowerCase() === 'bold'
              ? 'Verified via BOLD'
              : ''
          }
        >
          Paid
        </span>
      );
    }
    if (status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
          Refunded
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800">
          Failed
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800"
        title="Awaiting payment confirmation."
      >
        Unpaid
      </span>
    );
  };

  const fulfillmentColor = state =>
    state === 'waiting'
      ? 'bg-red-500'
      : state === 'processing'
        ? 'bg-blue-500'
        : state === 'finished'
          ? 'bg-green-600'
          : state === 'cancelled'
            ? 'bg-slate-500'
            : 'bg-gray-500';

  // Visual emphasis for the selected fulfillment button
  const fulfillmentSelectedClasses = {
    waiting: 'bg-red-600 text-white border-red-600 ring-2 ring-red-300',
    processing: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300',
    finished: 'bg-green-600 text-white border-green-600 ring-2 ring-green-300',
    cancelled: 'bg-slate-600 text-white border-slate-600 ring-2 ring-slate-300',
  };

  const setFulfillmentFor = async (ids, state) => {
    // optimistic UI
    setFulfillment(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        next[id] = state;
      });
      return next;
    });
    // persist each order's fulfillment
    await Promise.all(
      ids.map(async id => {
        const { error } = await db.updateOrderFulfillment(id, state);
        if (error) {
          setMessage(
            'Error updating fulfillment: ' + (error.message || 'unknown')
          );
        }
      })
    );
    // reload to ensure consistency
    loadOrders();
  };

  const filteredOrders = orders.filter(o => {
    const pm = String(o.payment_method || '').toLowerCase();
    const paid = String(o.status || '').toLowerCase() === 'paid';
    if (ordersFilter === 'unpaid') return !paid;
    if (ordersFilter === 'paid') return paid;
    if (ordersFilter === 'cod') return pm === 'cod';
    if (ordersFilter === 'bold') return pm === 'bold';
    if (ordersFilter === 'refunded')
      return String(o.status || '').toLowerCase() === 'refunded';
    if (
      ['waiting', 'processing', 'finished', 'cancelled'].includes(ordersFilter)
    )
      return (fulfillment[o.id] || 'waiting') === ordersFilter;
    return true;
  });

  const counts = (() => {
    const today = new Date().toDateString();
    let unpaid = 0,
      paidCount = 0,
      waiting = 0,
      processing = 0,
      finished = 0,
      bold = 0,
      cod = 0,
      todayCount = 0;
    orders.forEach(o => {
      const paid = String(o.status || '').toLowerCase() === 'paid';
      if (!paid) unpaid++;
      if (paid) paidCount++;
      const f = fulfillment[o.id] || 'waiting';
      if (f === 'waiting') waiting++;
      if (f === 'processing') processing++;
      if (f === 'finished') finished++;
      const pm = String(o.payment_method || '').toLowerCase();
      if (pm === 'bold') bold++;
      if (pm === 'cod') cod++;
      if (new Date(o.created_at).toDateString() === today) todayCount++;
    });
    return {
      unpaid,
      paid: paidCount,
      waiting,
      processing,
      finished,
      bold,
      cod,
      today: todayCount,
    };
  })();

  const loadAnalytics = async () => {
    const days = parseInt(analyticsRange);
    const toDate = new Date().toISOString();
    const fromDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();
    const summary = await db.getSalesSummary(fromDate, toDate);
    const tops = await db.getTopSellingProducts(5);
    if (!summary.error)
      setSalesSummary({ revenue: summary.revenue, count: summary.count });
    if (!tops.error) setTopProducts(tops.data);
  };

  // Helper function to format price for display (e.g., 100000 -> 100.000)
  const formatPriceForDisplay = price => {
    if (!price) return '';
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    // Manual formatting to ensure Colombian Peso format
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function to parse price from display format (e.g., 100.000 -> 100000)
  const parsePriceFromDisplay = displayPrice => {
    if (!displayPrice) return '';
    // Remove dots and convert to number
    const cleanPrice = displayPrice.replace(/\./g, '');
    const num = parseFloat(cleanPrice);
    return isNaN(num) ? displayPrice : num.toString();
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      // Handle price formatting for display
      if (name === 'original_price' || name === 'discounted_price') {
        // Format the display value
        const formattedValue = formatPriceForDisplay(value);
        next[name] = formattedValue;

        // Auto-calculate discount when original/discounted change
        const original =
          parseFloat(
            parsePriceFromDisplay(
              name === 'original_price' ? value : next.original_price
            )
          ) || 0;
        const discounted =
          parseFloat(
            parsePriceFromDisplay(
              name === 'discounted_price' ? value : next.discounted_price
            )
          ) || 0;

        if (original > 0 && discounted > 0) {
          const pct = calculateDiscountPercentage(original, discounted);
          next.discount = pct;
        } else {
          next.discount = 0;
        }
      }
      return next;
    });
  };

  const handleImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage('');

      // Check if browser supports WebP
      if (!supportsWebP()) {
        setMessage(
          'Warning: Your browser does not support WebP. Image will be uploaded in original format.'
        );
      }

      // Convert to WebP and optimize
      let processedFile = file;
      try {
        processedFile = await resizeImage(file, 1200, 1200, 0.8);
        setMessage('Image resized and optimized successfully!');
      } catch (conversionError) {
        console.warn(
          'Image optimization failed, using original file:',
          conversionError
        );
        setMessage('Warning: Could not optimize image, using original format.');
      }

      // Create a unique file name with .webp extension
      const fileName = `${Math.random()}.webp`;
      const filePath = `product-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, processedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
      }));
      setImagePreview(publicUrl);
      setMessage('Image uploaded successfully as WebP!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image_url: '',
    }));
    setImagePreview('');
  };

  const handleEditClick = product => {
    const currentDiscount = Number(product.discount) || 0;
    const discountedPrice = Number(product.price) || 0;
    const originalFromExisting =
      currentDiscount > 0
        ? discountedPrice / (1 - currentDiscount / 100)
        : discountedPrice;

    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      // Keep discounted price as active price in the form
      original_price: originalFromExisting
        ? formatPriceForDisplay(Number(originalFromExisting.toFixed(2)))
        : '',
      discounted_price: formatPriceForDisplay(discountedPrice) || '',
      discount: currentDiscount,
      quantity: product.quantity,
      image_url: product.image_url,
      category_id: product.category_id,
      scent_tags: Array.isArray(product.scent_tags)
        ? product.scent_tags.join(', ')
        : '',
      top_notes: product.top_notes || '',
      middle_notes: product.middle_notes || '',
      base_notes: product.base_notes || '',
    });
    setImagePreview(product.image_url);
    // load existing tag ids for the product
    db.getProductScentTagIds(product.id).then(({ data }) =>
      setSelectedTagIds(data || [])
    );
    // hydrate notes arrays from existing strings
    setTopNoteTags(parseNotesStringToTags(product.top_notes));
    setMiddleNoteTags(parseNotesStringToTags(product.middle_notes));
    setBaseNoteTags(parseNotesStringToTags(product.base_notes));
    // hydrate gallery arrays
    const existingGallery = Array.isArray(product.image_urls)
      ? product.image_urls.filter(Boolean)
      : [];
    const unique = Array.from(
      new Set([...(existingGallery || []), product.image_url].filter(Boolean))
    );
    setEditGalleryUrls(unique);
    setShowEditModal(true);
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const computedEditDiscount = parseInt(editingProduct.discount, 10) || 0;
      const productData = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(
          parsePriceFromDisplay(editingProduct.discounted_price)
        ),
        discount: computedEditDiscount > 0 ? computedEditDiscount : 0,
        quantity: parseInt(editingProduct.quantity),
        image_url: editGalleryUrls[0] || editingProduct.image_url || null,
        image_urls:
          editGalleryUrls && editGalleryUrls.length > 0
            ? editGalleryUrls
            : null,
        category_id: editingProduct.category_id,
        top_notes: toNotesString(topNoteTags) || null,
        middle_notes: toNotesString(middleNoteTags) || null,
        base_notes: toNotesString(baseNoteTags) || null,
      };

      const { data: updatedArr, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .select();

      if (error) throw error;

      await db.setProductScentTags(editingProduct.id, selectedTagIds);
      setMessage('Product updated successfully!');
      setShowEditModal(false);
      setEditingProduct(null);
      setImagePreview('');
      // clear tag arrays after edit
      setTopNoteTags([]);
      setMiddleNoteTags([]);
      setBaseNoteTags([]);
      setEditGalleryUrls([]);
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Error updating product: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInputChange = e => {
    const { name, value } = e.target;
    setEditingProduct(prev => {
      const next = { ...prev, [name]: value };

      // Handle price formatting for display
      if (name === 'original_price' || name === 'discounted_price') {
        // Format the display value
        const formattedValue = formatPriceForDisplay(value);
        next[name] = formattedValue;

        // Auto-calculate discount when original/discounted change
        const original =
          parseFloat(
            parsePriceFromDisplay(
              name === 'original_price' ? value : next.original_price
            )
          ) || 0;
        const discounted =
          parseFloat(
            parsePriceFromDisplay(
              name === 'discounted_price' ? value : next.discounted_price
            )
          ) || 0;

        if (original > 0 && discounted > 0) {
          const pct = calculateDiscountPercentage(original, discounted);
          next.discount = pct;
        } else {
          next.discount = 0;
        }
      }
      return next;
    });
  };

  const handleEditImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage('');

      // Check if browser supports WebP
      if (!supportsWebP()) {
        setMessage(
          'Warning: Your browser does not support WebP. Image will be uploaded in original format.'
        );
      }

      // Convert to WebP and optimize
      let processedFile = file;
      try {
        processedFile = await resizeImage(file, 1200, 1200, 0.8);
        setMessage('Image resized and optimized successfully!');
      } catch (conversionError) {
        console.warn(
          'Image optimization failed, using original file:',
          conversionError
        );
        setMessage('Warning: Could not optimize image, using original format.');
      }

      // Create a unique file name with .webp extension
      const fileName = `${Math.random()}.webp`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath);

      setEditingProduct(prev => ({
        ...prev,
        image_url: publicUrl,
      }));
      setImagePreview(publicUrl);
      setMessage('Image uploaded successfully as WebP!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeEditImage = () => {
    setEditingProduct(prev => ({
      ...prev,
      image_url: '',
    }));
    setImagePreview('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const original =
        parseFloat(parsePriceFromDisplay(formData.original_price)) || 0;
      const discounted =
        parseFloat(parsePriceFromDisplay(formData.discounted_price)) || 0;
      const shouldApplyDiscount =
        original > 0 && discounted > 0 && discounted < original;
      const priceToSave = shouldApplyDiscount ? discounted : original;
      const computedDiscount = shouldApplyDiscount
        ? calculateDiscountPercentage(original, discounted)
        : 0;

      const productData = {
        name: formData.name,
        description: formData.description,
        // If no discounted price, use original as active price
        price: priceToSave,
        discount: computedDiscount,
        quantity: parseInt(formData.quantity),
        image_url: galleryUrls[0] || formData.image_url || null,
        image_urls: galleryUrls && galleryUrls.length > 0 ? galleryUrls : null,
        category_id: formData.category_id,
        top_notes: toNotesString(topNoteTags) || null,
        middle_notes: toNotesString(middleNoteTags) || null,
        base_notes: toNotesString(baseNoteTags) || null,
      };
      const { data: created, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (created?.id && selectedTagIds.length > 0) {
        await db.setProductScentTags(created.id, selectedTagIds);
      }
      setMessage('Product added successfully!');
      setFormData({
        name: '',
        description: '',
        original_price: '',
        discounted_price: '',
        discount: 0,
        quantity: '',
        image_url: '',
        category_id: '',
        scent_tags: '',
        top_notes: '',
        middle_notes: '',
        base_notes: '',
      });
      setImagePreview('');
      setSelectedTagIds([]);
      setTopNoteTags([]);
      setMiddleNoteTags([]);
      setBaseNoteTags([]);
      setGalleryUrls([]);

      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage('Error adding product: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = product => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      setMessage('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      setMessage('Error deleting product: ' + error.message);
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
  };

  const handleLogin = success => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Product Management
              </h1>
              <p className="text-gray-600 mt-2">
                Add and manage your perfume collection
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {products.length}
                </div>
                <div className="text-sm text-gray-500">Total Productos</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b">
            <nav className="flex gap-4">
              {[
                { key: 'products', label: 'Productos' },
                { key: 'orders', label: 'Pedidos' },
                { key: 'analytics', label: 'Análisis de Ventas' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 -mb-px border-b-2 ${activeTab === t.key ? 'border-[#a10009] text-[#a10009] font-semibold' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Sales Analytics */}
          {activeTab === 'analytics' && (
            <div className="mb-12 bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-red-600" />
                  Análisis de Ventas
                </h2>
                <select
                  value={analyticsRange}
                  onChange={e => {
                    setAnalyticsRange(e.target.value);
                    setTimeout(loadAnalytics, 0);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500">Pedidos</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {salesSummary.count}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500">Revenue (COP)</div>
                  <div className="text-2xl font-bold text-gray-800">
                    ${' '}
                    {new Intl.NumberFormat('es-CO').format(
                      Math.round(salesSummary.revenue)
                    )}
                  </div>
                </div>
              </div>
              {topProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Productos Más Vendidos
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Product ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topProducts.map(tp => (
                          <tr key={tp.product_id}>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {tp.product_id}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {tp.qty}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              ${' '}
                              {new Intl.NumberFormat('es-CO').format(
                                Math.round(tp.revenue)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Management */}
          {activeTab === 'orders' && (
            <div className="mb-12 bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Pedidos
                </h2>
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 mr-2">
                    <span className="text-xs text-gray-500">Filter:</span>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'paid', label: `Paid (${counts.paid})` },
                      { key: 'unpaid', label: `Unpaid (${counts.unpaid})` },
                      { key: 'waiting', label: `Waiting (${counts.waiting})` },
                      {
                        key: 'processing',
                        label: `Processing (${counts.processing})`,
                      },
                      {
                        key: 'finished',
                        label: `Finished (${counts.finished})`,
                      },
                      { key: 'cod', label: `COD (${counts.cod})` },
                      { key: 'bold', label: `BOLD (${counts.bold})` },
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setOrdersFilter(f.key)}
                        className={`px-2 py-1 rounded-full text-xs border ${ordersFilter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={loadOrders}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </button>
                </div>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no hay pedidos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-white sticky top-0 z-10">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Order #
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Payment
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Fulfillment
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Created
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.map(o => {
                        const isOpen = expandedOrders[o.id];
                        return (
                          <React.Fragment key={o.id}>
                            <tr
                              onClick={() =>
                                setExpandedOrders(prev => ({
                                  ...prev,
                                  [o.id]: !isOpen,
                                }))
                              }
                              className={`align-top cursor-pointer ${o.status === 'paid' && (o.is_verified ? 'bg-green-50' : 'bg-green-50')} ${o.status !== 'paid' ? 'bg-red-50' : ''}`}
                            >
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {o.customer?.full_name || '—'}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {o.customer?.phone || ''}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span>{o.order_number || '—'}</span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm space-x-2 flex items-center">
                                {methodBadge(o.payment_method)}
                                {paymentBadge(o)}
                                {o.status === 'paid' &&
                                  String(
                                    o.payment_method || ''
                                  ).toLowerCase() === 'bold' && (
                                    <span
                                      className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
                                      title="Auto-verified—no manual confirmation required."
                                    >
                                      Verified via BOLD
                                    </span>
                                  )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {/* Progress style indicator */}
                                <div className="flex items-center gap-2">
                                  {['waiting', 'processing', 'finished'].map(
                                    (s, idx) => (
                                      <div
                                        key={s}
                                        className="flex items-center gap-1"
                                      >
                                        <span
                                          className={`inline-block w-2.5 h-2.5 rounded-full ${(fulfillment[o.id] || 'waiting') === s ? fulfillmentColor(s) : 'bg-gray-200'}`}
                                        ></span>
                                        {idx < 2 && (
                                          <span
                                            className={`inline-block w-6 h-0.5 ${(fulfillment[o.id] || 'waiting') === s || (fulfillment[o.id] === 'finished' && s !== 'finished') ? 'bg-gray-300' : 'bg-gray-200'}`}
                                          ></span>
                                        )}
                                      </div>
                                    )
                                  )}
                                  <span className="ml-2 text-xs text-gray-600">
                                    {(fulfillment[o.id] || 'waiting').replace(
                                      /^./,
                                      c => c.toUpperCase()
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold">
                                {formatCurrency(o.total, o.currency || 'COP')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {new Date(o.created_at).toLocaleString()}
                              </td>
                              <td
                                className="px-4 py-2 text-right space-x-3"
                                onClick={e => e.stopPropagation()}
                              >
                                {o.status !== 'paid' && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      markPaid(o);
                                    }}
                                    className="inline-flex items-center gap-1 text-sm bg-[#a10009] text-white px-3 py-1.5 rounded-lg hover:bg-[#8a0008]"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                                {o.status === 'paid' &&
                                  !o.is_verified &&
                                  String(
                                    o.payment_method || ''
                                  ).toLowerCase() === 'bold' && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        verifyPayment(o.id);
                                      }}
                                      className="inline-flex items-center gap-1 text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                                    >
                                      Verify Payment
                                    </button>
                                  )}
                                {o.status === 'paid' && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      unpayOrder(o.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                                  >
                                    Unpay
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr>
                                <td colSpan={7} className="px-4 pb-4">
                                  <div className="bg-gray-50 rounded-lg p-4 relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedOrders(prev => ({
                                          ...prev,
                                          [o.id]: false,
                                        }))
                                      }
                                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                      aria-label="Close details"
                                    >
                                      <X className="w-14 h-14" />
                                    </button>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                                      Details —{' '}
                                      <span className="text-gray-700">
                                        {o.order_number || '—'}
                                      </span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                          Payment / Shipping
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          Payment: {o.payment_method || '—'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Shipping: {o.shipping_method || '—'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Currency: {o.currency || 'COP'}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                          Dirección de Envío
                                        </h4>
                                        <div className="space-y-0.5 text-sm text-gray-600">
                                          <p>
                                            <span className="font-medium">
                                              Ciudad/Municipio:
                                            </span>{' '}
                                            {o.shipping_address?.city || '—'}
                                          </p>
                                          <p>
                                            <span className="font-medium">
                                              Departamento:
                                            </span>{' '}
                                            {o.shipping_address?.department ||
                                              '—'}
                                          </p>
                                          <p>
                                            <span className="font-medium">
                                              Dirección:
                                            </span>{' '}
                                            {o.shipping_address?.street || '—'}
                                          </p>
                                          {o.shipping_address?.apartment && (
                                            <p>
                                              <span className="font-medium">
                                                Apartamento:
                                              </span>{' '}
                                              {o.shipping_address.apartment}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                          Amounts
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          Subtotal:{' '}
                                          {formatCurrency(
                                            o.subtotal,
                                            o.currency || 'COP'
                                          )}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Shipping:{' '}
                                          {formatCurrency(
                                            o.shipping_cost,
                                            o.currency || 'COP'
                                          )}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          Total:{' '}
                                          {formatCurrency(
                                            o.total,
                                            o.currency || 'COP'
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-4">
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                        Fulfillment
                                      </h4>
                                      <div
                                        className="flex flex-wrap gap-2"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        {[
                                          'waiting',
                                          'processing',
                                          'finished',
                                          'cancelled',
                                        ].map(opt => {
                                          const isActive =
                                            (fulfillment[o.id] || 'waiting') ===
                                            opt;
                                          const base =
                                            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors';
                                          const inactive =
                                            'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700';
                                          const active =
                                            fulfillmentSelectedClasses[opt];
                                          return (
                                            <button
                                              key={opt}
                                              type="button"
                                              onClick={e => {
                                                e.stopPropagation();
                                                setFulfillmentFor([o.id], opt);
                                              }}
                                              className={`${base} ${isActive ? active : inactive}`}
                                            >
                                              <span
                                                className={`w-2.5 h-2.5 rounded-full ${fulfillmentColor(opt)}`}
                                              ></span>
                                              {opt[0].toUpperCase() +
                                                opt.slice(1)}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="mt-4">
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                        Items
                                      </h4>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead>
                                            <tr>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Product
                                              </th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Qty
                                              </th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {(o.items || []).map((it, idx) => (
                                              <tr key={idx}>
                                                <td className="px-3 py-2 text-sm text-gray-700">
                                                  {it.name || it.product_id}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-700">
                                                  {it.quantity}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-700">
                                                  {formatCurrency(
                                                    it.price,
                                                    o.currency || 'COP'
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Product Form */}
          {activeTab === 'products' && (
            <div className="mb-12 bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Save className="w-6 h-6 mr-3 text-red-600" />
                Add New Product
              </h2>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price *
                  </label>
                  <input
                    type="text"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                    placeholder="e.g. 310.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discounted Price
                  </label>
                  <input
                    type="text"
                    name="discounted_price"
                    value={formData.discounted_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                    placeholder="e.g. 242.000"
                  />
                  {Number(formData.original_price) > 0 &&
                    Number(formData.discounted_price) > 0 &&
                    formData.discount > 0 && (
                      <div className="mt-2 text-sm font-semibold text-green-700">
                        {formData.discount}% OFF (auto)
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Scent breakdown (optional) */}
                <NotesTagSelector
                  label="Notas de Salida"
                  tags={topNoteTags}
                  setTags={setTopNoteTags}
                />
                <NotesTagSelector
                  label="Notas de Corazón"
                  tags={middleNoteTags}
                  setTags={setMiddleNoteTags}
                />
                <NotesTagSelector
                  label="Notas de Fondo"
                  tags={baseNoteTags}
                  setTags={setBaseNoteTags}
                />

                {/* Removed scent tags UI per request */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  <div
                    className={`w-full p-4 border-2 border-dashed rounded-lg ${isDragging ? 'border-red-600 bg-red-50' : 'border-gray-300'} transition-colors`}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async e => {
                      e.preventDefault();
                      setIsDragging(false);
                      const files = Array.from(
                        e.dataTransfer.files || []
                      ).filter(f => f.type.startsWith('image/'));
                      for (const f of files) {
                        const url = await uploadImageAndGetUrl(f);
                        if (url)
                          setGalleryUrls(prev =>
                            Array.from(new Set([...prev, url]))
                          );
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        for (const f of files) {
                          const url = await uploadImageAndGetUrl(f);
                          if (url)
                            setGalleryUrls(prev =>
                              Array.from(new Set([...prev, url]))
                            );
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full py-6 cursor-pointer text-sm text-gray-600"
                    >
                      <Upload className="w-5 h-5 mr-2 text-gray-400" />
                      {uploading
                        ? 'Uploading...'
                        : 'Click to upload or drag & drop images'}
                    </label>
                    {uploadsInProgress > 0 && (
                      <p className="text-xs text-gray-500">
                        Uploading {uploadsInProgress} image(s)…
                      </p>
                    )}
                    {galleryUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {galleryUrls.map((url, idx) => (
                          <div
                            key={`gal-${idx}`}
                            className="relative group"
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              const from = parseInt(
                                e.dataTransfer.getData('text/plain'),
                                10
                              );
                              const to = idx;
                              reorderByDrag(
                                from,
                                to,
                                galleryUrls,
                                setGalleryUrls
                              );
                            }}
                          >
                            <img
                              src={url}
                              alt={`Imagen ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-gray-300" />
                            <div className="absolute -top-2 right-[-34px] flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() =>
                                  moveItemToFront(
                                    idx,
                                    galleryUrls,
                                    setGalleryUrls
                                  )
                                }
                                className="px-2 py-1 text-[10px] bg-white border rounded shadow"
                              >
                                Cover
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setGalleryUrls(
                                    galleryUrls.filter((_, i) => i !== idx)
                                  )
                                }
                                className="px-2 py-1 text-[10px] bg-red-600 text-white rounded shadow"
                                aria-label="Remove image"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Adding Product...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes('Error')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          {/* Products Table */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Todos los Productos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imagen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {product.categories?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600">
                          {formatCOP(product.price)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">
                              {product.quantity}
                            </span>
                            {product.quantity <= 50 && (
                              <span className="flex items-center text-orange-600 text-xs font-medium">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Stock Bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                              title="Editar Producto"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                              title="Eliminar Producto"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Product
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold">"{productToDelete?.name}"</span>
                ? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                <Edit className="w-6 h-6 mr-3 text-blue-600" />
                Edit Product
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={editingProduct.category_id}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price *
                </label>
                <input
                  type="text"
                  name="original_price"
                  value={editingProduct.original_price}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discounted Price
                </label>
                <input
                  type="text"
                  name="discounted_price"
                  value={editingProduct.discounted_price}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
                {Number(editingProduct.original_price) > 0 &&
                  Number(editingProduct.discounted_price) > 0 &&
                  Number(editingProduct.discount) > 0 && (
                    <div className="mt-2 text-sm font-semibold text-blue-700">
                      {editingProduct.discount}% OFF (auto)
                    </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={editingProduct.quantity}
                  onChange={handleEditInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editingProduct.description}
                  onChange={handleEditInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Scent breakdown (optional) */}
              <NotesTagSelector
                label="Notas de Salida"
                tags={topNoteTags}
                setTags={setTopNoteTags}
              />
              <NotesTagSelector
                label="Notas de Corazón"
                tags={middleNoteTags}
                setTags={setMiddleNoteTags}
              />
              <NotesTagSelector
                label="Notas de Fondo"
                tags={baseNoteTags}
                setTags={setBaseNoteTags}
              />

              {/* Removed scent tags UI per request */}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div
                  className={`w-full p-4 border-2 border-dashed rounded-lg ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300'} transition-colors`}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async e => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = Array.from(e.dataTransfer.files || []).filter(
                      f => f.type.startsWith('image/')
                    );
                    for (const f of files) {
                      const url = await uploadImageAndGetUrl(f);
                      if (url)
                        setEditGalleryUrls(prev =>
                          Array.from(new Set([...prev, url]))
                        );
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      for (const f of files) {
                        const url = await uploadImageAndGetUrl(f);
                        if (url)
                          setEditGalleryUrls(prev =>
                            Array.from(new Set([...prev, url]))
                          );
                      }
                    }}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label
                    htmlFor="edit-image-upload"
                    className="flex items-center justify-center w-full py-6 cursor-pointer text-sm text-gray-600"
                  >
                    <Upload className="w-5 h-5 mr-2 text-gray-400" />
                    {uploading
                      ? 'Uploading...'
                      : 'Click to upload or drag & drop images'}
                  </label>
                  {uploadsInProgress > 0 && (
                    <p className="text-xs text-gray-500">
                      Uploading {uploadsInProgress} image(s)…
                    </p>
                  )}
                  {editGalleryUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {editGalleryUrls.map((url, idx) => (
                        <div
                          key={`edit-gal-${idx}`}
                          className="relative group"
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('text/plain', String(idx));
                          }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const from = parseInt(
                              e.dataTransfer.getData('text/plain'),
                              10
                            );
                            const to = idx;
                            reorderByDrag(
                              from,
                              to,
                              editGalleryUrls,
                              setEditGalleryUrls
                            );
                          }}
                        >
                          <img
                            src={url}
                            alt={`Imagen ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-gray-300" />
                          <div className="absolute -top-2 right-[-34px] flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                moveItemToFront(
                                  idx,
                                  editGalleryUrls,
                                  setEditGalleryUrls
                                )
                              }
                              className="px-2 py-1 text-[10px] bg-white border rounded shadow"
                            >
                              Cover
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditGalleryUrls(
                                  editGalleryUrls.filter((_, i) => i !== idx)
                                )
                              }
                              className="px-2 py-1 text-[10px] bg-red-600 text-white rounded shadow"
                              aria-label="Remove image"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating Product...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
