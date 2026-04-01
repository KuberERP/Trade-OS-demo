/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ShoppingCart, 
  History, 
  Scan, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  AlertCircle,
  IndianRupee,
  UserCircle2,
  Building2,
  Loader2,
  Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Product {
  id: number;
  name: string;
  basePrice: number;
  moq: number;
  category: string;
}

interface Order {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerType: 'Dealer' | 'Retail';
  timestamp: string;
}

interface ScanResult {
  barcode: string;
  productName: string;
  isValid: boolean;
  timestamp: string;
}

type Tab = 'catalog' | 'order' | 'history' | 'scanner';

// --- Constants ---

const PRODUCTS_API = 'https://dummyjson.com/products?limit=10';

const BARCODE_MAPPING: Record<string, string> = {
  'PROD-1000': 'Steel Rod 10mm',
  'PROD-1002': 'PVC Pipe 20ft',
  'PROD-1004': 'Copper Wire 50m',
  'PROD-1006': 'Cement Bag 50kg',
  'PROD-1008': 'Paint Bucket 5L',
  'PROD-1010': 'Tile Adhesive 10kg',
};

// --- Utils ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getPrice = (basePrice: number, type: 'Dealer' | 'Retail') => {
  // Dealer gets 22% discount
  return type === 'Dealer' ? Math.round(basePrice * 0.78) : Math.round(basePrice);
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [customerType, setCustomerType] = useState<'Dealer' | 'Retail'>('Dealer');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(PRODUCTS_API);
        if (!res.ok) throw new Error('Failed to fetch catalog');
        const data = await res.json();
        
        const mappedProducts = data.products.map((p: any, i: number) => ({
          id: p.id,
          name: p.title.split(' ').slice(0, 3).join(' '),
          basePrice: Math.round(p.price * 83), // Convert to INR approx
          moq: [5, 10, 20, 50, 100, 25, 15, 30, 40, 60][i % 10],
          category: p.category,
        }));
        
        setProducts(mappedProducts);
      } catch (err) {
        console.error(err);
        setError('Using offline catalog due to API error.');
        // Fallback data
        setProducts([
          { id: 1, name: 'Steel Rod 10mm', basePrice: 4800, moq: 50, category: 'hardware' },
          { id: 2, name: 'PVC Pipe 20ft', basePrice: 1200, moq: 10, category: 'plumbing' },
          { id: 3, name: 'Copper Wire 50m', basePrice: 8500, moq: 5, category: 'electrical' },
          { id: 4, name: 'Cement Bag 50kg', basePrice: 380, moq: 100, category: 'building' },
          { id: 5, name: 'Paint Bucket 5L', basePrice: 950, moq: 20, category: 'paint' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedProductId), 
    [products, selectedProductId]
  );

  const handlePlaceOrder = () => {
    if (!selectedProduct) return;
    if (quantity < selectedProduct.moq) return;

    const unitPrice = getPrice(selectedProduct.basePrice, customerType);
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: selectedProduct.name,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      customerType,
      timestamp: new Date().toLocaleTimeString(),
    };

    setOrders([newOrder, ...orders]);
    setActiveTab('history');
    // Reset form
    setSelectedProductId(null);
    setQuantity(0);
  };

  const handleScan = (manualCode?: string) => {
    const code = manualCode || `PROD-${1000 + Math.floor(Math.random() * 10) * 2 + (Math.random() > 0.5 ? 0 : 1)}`;
    const lastChar = code.slice(-1);
    const lastNum = parseInt(lastChar);
    
    const isValid = !isNaN(lastNum) ? lastNum % 2 === 0 : false;
    const productName = BARCODE_MAPPING[code] || 'Unknown Inventory Item';

    const result: ScanResult = {
      barcode: code,
      productName,
      isValid,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLastScan(result);
    setScanHistory([result, ...scanHistory]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">TradeOS</h1>
            <p className="text-[11px] text-slate-500 mt-1 font-medium uppercase tracking-wider">Internal Business Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 uppercase">
            Online
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-[61px] z-10 bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar">
        {[
          { id: 'catalog', label: 'Catalog', icon: Package },
          { id: 'order', label: 'Order', icon: ShoppingCart },
          { id: 'history', label: 'History', icon: History },
          { id: 'scanner', label: 'Scanner', icon: Scan },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex-1 min-w-[80px] py-3 px-2 flex flex-col items-center gap-1 transition-all relative ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[11px] font-semibold uppercase tracking-tight">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
              />
            )}
          </button>
        ))}
      </nav>

      <main className="max-w-md mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Product Catalog</h2>
                {loading && <Loader2 size={16} className="animate-spin text-indigo-600" />}
              </div>

              {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 text-xs">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{product.name}</h3>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {product.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Base Price</div>
                        <div className="text-lg font-black text-slate-900">{formatCurrency(product.basePrice)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dealer Price</div>
                        <div className="text-sm font-bold text-emerald-600">{formatCurrency(getPrice(product.basePrice, 'Dealer'))}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Min Order (MOQ)</div>
                        <div className="text-sm font-bold text-slate-700">{product.moq} Units</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Order Tab */}
          {activeTab === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section>
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">1. Customer Segment</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCustomerType('Dealer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      customerType === 'Dealer' 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <Building2 size={18} />
                    <span className="font-bold text-sm">Dealer</span>
                  </button>
                  <button
                    onClick={() => setCustomerType('Retail')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      customerType === 'Retail' 
                        ? 'bg-orange-50 border-orange-500 text-orange-700' 
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <UserCircle2 size={18} />
                    <span className="font-bold text-sm">Retail</span>
                  </button>
                </div>
              </section>

              <section>
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">2. Select Product</h2>
                <div className="grid grid-cols-2 gap-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedProductId === p.id 
                          ? 'bg-indigo-50 border-indigo-600' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`text-xs font-bold mb-1 ${selectedProductId === p.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500">MOQ: {p.moq}</div>
                    </button>
                  ))}
                </div>
              </section>

              {selectedProduct && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">3. Quantity</h2>
                    <div className="relative">
                      <input
                        type="number"
                        value={quantity || ''}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        placeholder={`Min ${selectedProduct.moq} units`}
                        className={`w-full bg-white border-2 rounded-xl py-4 px-4 font-bold text-lg focus:outline-none transition-all ${
                          quantity > 0 && quantity < selectedProduct.moq 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-slate-200 focus:border-indigo-600'
                        }`}
                      />
                      {quantity > 0 && quantity < selectedProduct.moq && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 flex items-center gap-1">
                          <AlertCircle size={16} />
                          <span className="text-[10px] font-bold uppercase">Below MOQ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order Summary</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-1 rounded font-bold uppercase tracking-tighter">
                        {customerType} Rate
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Unit Price</span>
                        <span className="font-bold">{formatCurrency(getPrice(selectedProduct.basePrice, customerType))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Quantity</span>
                        <span className="font-bold">{quantity} Units</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Payable</div>
                        <div className="text-2xl font-black text-indigo-400">
                          {formatCurrency(getPrice(selectedProduct.basePrice, customerType) * quantity)}
                        </div>
                      </div>
                      <button
                        disabled={quantity < selectedProduct.moq}
                        onClick={handlePlaceOrder}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                          quantity >= selectedProduct.moq
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Order History</h2>
                <span className="text-[10px] font-bold text-slate-400">{orders.length} Total</span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                  <History size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No orders placed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{order.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          order.customerType === 'Dealer' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {order.customerType}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="font-bold text-slate-900">{order.productName}</h3>
                          <p className="text-xs text-slate-500">{order.quantity} Units @ {formatCurrency(order.unitPrice)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">{formatCurrency(order.totalPrice)}</div>
                          <div className="text-[9px] text-slate-400 font-medium uppercase">{order.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Scanner Tab */}
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section>
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quality Control Scan</h2>
                <button
                  onClick={() => handleScan()}
                  className="w-full aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-4 border-4 border-slate-800 hover:border-indigo-600 transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Barcode size={64} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="text-white font-bold text-sm block">Tap to Scan Barcode</span>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Simulated Camera Feed</span>
                  </div>
                </button>
              </section>

              {lastScan && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl p-5 border-2 shadow-lg ${
                    lastScan.isValid 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                      : 'bg-red-50 border-red-500 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {lastScan.isValid ? <CheckCircle2 size={24} className="text-emerald-600" /> : <XCircle size={24} className="text-red-600" />}
                      <span className="font-black text-lg uppercase tracking-tight">
                        {lastScan.isValid ? 'Valid Unit' : 'Invalid Unit'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold opacity-60 uppercase">{lastScan.timestamp}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-current border-opacity-10 pb-2">
                      <span className="text-[10px] font-bold uppercase opacity-60">Product</span>
                      <span className="font-bold text-sm">{lastScan.productName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-current border-opacity-10 pb-2">
                      <span className="text-[10px] font-bold uppercase opacity-60">Barcode</span>
                      <span className="font-mono font-bold text-sm">{lastScan.barcode}</span>
                    </div>
                    <div className="text-[10px] font-medium opacity-70 italic">
                      Rule: Barcodes ending in even numbers are marked as valid.
                    </div>
                  </div>
                </motion.section>
              )}

              <section>
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Scan History</h2>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {scanHistory.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-medium italic">
                      No recent scans
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {scanHistory.map((scan, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${scan.isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{scan.barcode}</div>
                              <div className="text-[10px] text-slate-500">{scan.productName}</div>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{scan.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Manual Input Modal/Overlay (Optional) */}
      {activeTab === 'scanner' && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl flex gap-2">
            <input 
              type="text" 
              placeholder="Manual Barcode Entry..."
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Manual Barcode Entry..."]') as HTMLInputElement;
                if (input.value) {
                  handleScan(input.value);
                  input.value = '';
                }
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
