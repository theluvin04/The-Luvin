
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Page, FrameConfig, AllProducts, AllBackgrounds, CheckoutFormDetails } from '@/types';
import { INITIAL_FRAME_CONFIG } from '@/constants';
import { supabase } from '@/supabase';
import { useAuth } from '@/AuthContext';

// Import Page Components
import HomePage from '@/components/HomePage';
import BuilderPage from '@/components/BuilderPage';
import CollectionPage from '@/components/CollectionPage';
import CartPage from '@/components/CartPage';
import CheckoutPage from '@/components/CheckoutPage';
import OrderConfirmationPage from '@/components/OrderConfirmationPage';
import OrderLookupPage from '@/components/OrderLookupPage';
import ContactPage from '@/components/ContactPage';
import LoginPage from '@/components/LoginPage';
import AdminLayout from '@/components/AdminLayout';
import DashboardPage from '@/components/DashboardPage';
import OrderManagementPage from '@/components/OrderManagementPage';
import ProductManagementPage from '@/components/ProductManagementPage';
import AdminBackgroundsPage from '@/components/AdminBackgroundsPage';

// Import UI Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import CartPanel from '@/components/CartPanel';
import { calculatePrice } from '@/utils/priceCalculator';

const App: React.FC = () => {
  const getPageFromHash = (): Page => {
    const hash = window.location.hash.replace(/^#\//, '');
    const validPages: Page[] = ['home', 'builder', 'collection', 'cart', 'checkout', 'order-confirmation', 'order-lookup', 'contact', 'login', 'admin-dashboard', 'admin-orders', 'admin-products', 'admin-backgrounds'];
    return validPages.includes(hash as Page) ? (hash as Page) : 'home';
  };
  const [page, setPage] = useState<Page>(getPageFromHash);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [frameConfig, setFrameConfig] = useState<FrameConfig>(() => {
    try { const saved = localStorage.getItem('luvinFrameConfig'); return saved ? JSON.parse(saved) : INITIAL_FRAME_CONFIG; } catch (e) { return INITIAL_FRAME_CONFIG; }
  });
  const [cartItems, setCartItems] = useState<FrameConfig[]>(() => {
    try { const saved = localStorage.getItem('luvinCartItems'); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });
  
  const [allProducts, setAllProducts] = useState<AllProducts | null>(null);
  const [allBackgrounds, setAllBackgrounds] = useState<AllBackgrounds | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutFormDetails | null>(null);

  useEffect(() => {
    const handleHashChange = () => { setPage(getPageFromHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((newPage: Page) => { window.location.hash = `/${newPage}`; }, []);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); };
  
  const fetchInitialData = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const productsPromise = supabase.from('products').select('*');
        const backgroundsPromise = supabase.from('backgrounds').select('*');
        const [{ data: pData, error: pError }, { data: bData, error: bError }] = await Promise.all([productsPromise, backgroundsPromise]);
        if (pError || bError) throw pError || bError;
        
        const products: AllProducts = { frames: [], lego_parts: { hair: [], face: [], shirt: [], pants: [], hat: [], accessory: [], pet: [] } };
        (pData || []).forEach(p => { if (p.type === 'frame') products.frames.push(p as any); else if ((products.lego_parts as any)[p.type]) (products.lego_parts as any)[p.type].push(p as any); });
        const backgrounds: AllBackgrounds = { square: [], rectangle: [] };
        (bData || []).forEach(b => { if (b.type === 'square') backgrounds.square.push(b as any); else if (b.type === 'rectangle') backgrounds.rectangle.push(b as any); });
        
        setAllProducts(products);
        setAllBackgrounds(backgrounds);
    } catch (error) { console.error("Failed to fetch initial data", error); showToast("Không thể tải dữ liệu sản phẩm.", "error"); } 
    finally { setIsDataLoading(false); }
  }, []);

  const handleUserImageUpload = async (file: File, folder: 'backgrounds' | 'charms'): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `user_uploads/${folder}/${fileName}`;
        const { error } = await supabase.storage.from('assets').upload(filePath, file);
        if (error) throw error;
        const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) { console.error(`Error uploading image:`, error); showToast('Lỗi khi tải ảnh lên.', 'error'); return null; }
  };

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
  useEffect(() => { try { const { previewImageUrl, ...c } = frameConfig; localStorage.setItem('luvinFrameConfig', JSON.stringify(c)); } catch (e) {} }, [frameConfig]);
  useEffect(() => { try { localStorage.setItem('luvinCartItems', JSON.stringify(cartItems)); } catch (e) {} }, [cartItems]);

  const handleAddToCart = (config: FrameConfig) => { setCartItems(prev => [...prev, config]); showToast('Đã thêm vào giỏ hàng!'); };
  const handleRemoveFromCart = (index: number) => { setCartItems(prev => prev.filter((_, i) => i !== index)); };

  const handleConfirmOrder = async (details: CheckoutFormDetails) => {
      const { error: orderError } = await supabase.from('orders').insert({
          order_id_str: details.orderId, status: 'Chờ thanh toán', customer_name: details.customer.name, customer_phone: details.customer.phone,
          customer_email: details.customer.email, customer_address: details.customer.address, shipping_method: details.shippingMethod,
          shipping_cost: details.pricing.shippingCost, packaging_fee: details.pricing.packagingFee, total_price: details.pricing.total,
          amount_paid: details.pricing.paid, amount_remaining: details.pricing.remaining, payment_method: details.paymentMethod,
          desired_delivery_date: details.desiredDeliveryDate, notes: details.notes, created_at: details.createdAt,
      });
      if (orderError) { showToast('Không thể tạo đơn hàng, vui lòng thử lại.', 'error'); console.error('Order insert error:', orderError); return; }
      setCheckoutDetails(details);
      setCartItems([]);
      navigateTo('order-confirmation');
  };
  
  const renderCurrentPage = () => {
    if (isAuthLoading || isDataLoading) { return <div className="flex items-center justify-center h-screen"><p>Đang tải ứng dụng...</p></div>; }
    const adminPages: Page[] = ['admin-dashboard', 'admin-orders', 'admin-products', 'admin-backgrounds'];
    if (adminPages.includes(page) && !isAuthenticated) { return <LoginPage navigateTo={navigateTo} showToast={showToast} />; }
    switch (page) {
      case 'home': return <HomePage navigateTo={navigateTo} />;
      // FIX: Corrected prop passing from shorthand properties with undefined variables to explicit props with correct variables.
      case 'builder': return <BuilderPage config={frameConfig} setConfig={setFrameConfig} navigateTo={navigateTo} onAddToCart={handleAddToCart} showToast={showToast} allProducts={allProducts} allBackgrounds={allBackgrounds} handleUserImageUpload={handleUserImageUpload} />;
      case 'collection': return <CollectionPage navigateTo={navigateTo} setConfig={setFrameConfig} allProducts={allProducts} />;
      case 'cart': return <CartPage cartItems={cartItems} onRemoveItem={handleRemoveFromCart} allProducts={allProducts} navigateTo={navigateTo} />;
      case 'checkout': return <CheckoutPage cartItems={cartItems} allProducts={allProducts} onConfirmOrder={handleConfirmOrder} />;
      case 'order-confirmation': return checkoutDetails ? <OrderConfirmationPage details={checkoutDetails} allProducts={allProducts} /> : <HomePage navigateTo={navigateTo} />;
      case 'order-lookup': return <OrderLookupPage />;
      case 'contact': return <ContactPage />;
      case 'login': return <LoginPage navigateTo={navigateTo} showToast={showToast} />;
      case 'admin-dashboard': return <AdminLayout navigateTo={navigateTo} page={page}><DashboardPage showToast={showToast} /></AdminLayout>;
      case 'admin-orders': return <AdminLayout navigateTo={navigateTo} page={page}><OrderManagementPage showToast={showToast} /></AdminLayout>;
      case 'admin-products': return <AdminLayout navigateTo={navigateTo} page={page}><ProductManagementPage allProducts={allProducts} onProductUpdate={fetchInitialData} showToast={showToast} /></AdminLayout>;
      case 'admin-backgrounds': return <AdminLayout navigateTo={navigateTo} page={page}><AdminBackgroundsPage allBackgrounds={allBackgrounds} onUpdate={fetchInitialData} showToast={showToast} /></AdminLayout>;
      default: return <HomePage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-800 bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header navigateTo={navigateTo} cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} />
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemoveItem={handleRemoveFromCart} allProducts={allProducts} navigateTo={navigateTo} />
      <main className="flex-grow">{renderCurrentPage()}</main>
      <Footer />
    </div>
  );
};

export default App;
