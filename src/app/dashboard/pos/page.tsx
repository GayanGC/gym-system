'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  QrCode, 
  Search, 
  User, 
  Printer, 
  X, 
  CheckCircle2, 
  CreditCard,
  Building2,
  Users,
  UserCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { 
  getGym, 
  getInventory, 
  getMembers, 
  addSale, 
  getActiveGymId,
  Gym, 
  InventoryItem, 
  User as UserType, 
  Sale 
} from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function PosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PosContent />
    </Suspense>
  );
}

interface CartItem {
  item: InventoryItem;
  qty: number;
}

function PosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [gymId, setGymId] = useState<string | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  
  // Catalog & Cart
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout settings
  const [members, setMembers] = useState<UserType[]>([]);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('Guest');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'LANKAQR' | 'Credit'>('Cash');

  // Receipt Modal
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadData = (id: string) => {
    const currentGym = getGym(id);
    if (!currentGym) {
      toast({
        title: 'Gym Not Found',
        description: 'The specified Gym ID does not exist.',
        type: 'error',
      });
      router.push('/login');
      return;
    }
    setGym(currentGym);
    setCatalog(getInventory(id));
    setMembers(getMembers(id));
  };

  useEffect(() => {
    let activeId = searchParams.get('gym_id');
    if (!activeId) {
      activeId = getActiveGymId();
    }

    if (!activeId) {
      router.push('/login');
      return;
    }

    setGymId(activeId);
    loadData(activeId);
  }, [searchParams, router, toast]);

  const handleAddToCart = (item: InventoryItem) => {
    if (item.stock === 0) {
      toast({
        title: 'Out of Stock',
        description: `${item.name} is currently out of stock.`,
        type: 'error',
      });
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx > -1) {
        const newQty = prev[idx].qty + 1;
        if (newQty > item.stock) {
          toast({
            title: 'Stock Limit Reached',
            description: `Only ${item.stock} units available in inventory.`,
            type: 'error',
          });
          return prev;
        }
        const updated = [...prev];
        updated[idx].qty = newQty;
        return updated;
      } else {
        return [...prev, { item, qty: 1 }];
      }
    });
  };

  const handleUpdateQty = (itemId: string, diff: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === itemId);
      if (idx === -1) return prev;

      const newQty = prev[idx].qty + diff;
      if (newQty <= 0) {
        return prev.filter((c) => c.item.id !== itemId);
      }
      
      const stockLimit = prev[idx].item.stock;
      if (newQty > stockLimit) {
        toast({
          title: 'Stock Limit Reached',
          description: `Only ${stockLimit} units available.`,
          type: 'error',
        });
        return prev;
      }

      const updated = [...prev];
      updated[idx].qty = newQty;
      return updated;
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !gym) return;

    if (cart.length === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items before processing checkout.',
        type: 'error',
      });
      return;
    }

    if (paymentMethod === 'Credit' && assignedMemberId === 'Guest') {
      toast({
        title: 'Billing Block',
        description: 'You cannot bill credit purchases to Walk-in Guests.',
        type: 'error',
      });
      return;
    }

    const memberDetails = members.find((m) => m.id === assignedMemberId);
    const customerName = memberDetails ? memberDetails.name : 'Walk-in Guest';

    const saleTotal = cart.reduce((acc, c) => acc + c.item.sellingPrice * c.qty, 0);

    const newSale = addSale({
      gymId,
      memberId: assignedMemberId,
      memberName: customerName,
      items: cart.map((c) => ({
        itemId: c.item.id,
        name: c.item.name,
        qty: c.qty,
        price: c.item.sellingPrice,
      })),
      totalAmount: saleTotal,
      paymentMethod,
    });

    setReceiptSale(newSale);
    setShowReceipt(true);
    setCart([]);
    setAssignedMemberId('Guest');
    setPaymentMethod('Cash');

    // Reload catalog items
    loadData(gymId);

    toast({
      title: 'Checkout Completed!',
      description: `Sale registered to ${customerName} successfully.`,
      type: 'success',
    });
  };

  const handleLogout = () => {
    toast({ title: 'Logged Out', description: 'Session ended.', type: 'info' });
    router.push('/login');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Catalog
  const filteredCatalog = catalog.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((acc, c) => acc + c.item.sellingPrice * c.qty, 0);

  if (!gym) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative">
      
      {/* -------------------- PRINT-ONLY COMPONENT (INVOICE RECEIPT) -------------------- */}
      {receiptSale && (
        <div className="hidden print:flex flex-col p-12 min-h-screen bg-white text-slate-900 text-center w-full justify-between items-center" id="printable-receipt">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-1.5 pb-4 border-b border-dashed border-slate-300">
              <Dumbbell className="h-8 w-8 text-slate-800" />
              <h2 className="text-xl font-black uppercase tracking-wider">{gym.gymName}</h2>
              <p className="text-xs text-slate-500">{gym.location} • {gym.phone}</p>
              <p className="text-[10px] text-slate-400 mt-1">Invoice ID: {receiptSale.id}</p>
            </div>

            <div className="text-left text-xs space-y-1.5 py-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono text-slate-700">{new Date(receiptSale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{receiptSale.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold uppercase text-slate-800">{receiptSale.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 text-xs space-y-2.5">
              {receiptSale.items.map((itm, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{itm.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{itm.qty} × LKR {itm.price.toLocaleString()}</p>
                  </div>
                  <span className="font-mono text-slate-700">LKR {(itm.qty * itm.price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 text-sm font-black">
              <span>Total Amount:</span>
              <span className="font-mono text-lg text-slate-900">LKR {receiptSale.totalAmount.toLocaleString()}</span>
            </div>

            {receiptSale.paymentMethod === 'LANKAQR' && (
              <div className="flex flex-col items-center py-4 space-y-2 border-t border-dashed border-slate-300">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">LANKAQR Merchant Scan</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent('fitpulse_merchant_lankaqr_txn_' + receiptSale.id)}`}
                  alt="LANKAQR Merchant Code"
                  className="w-28 h-28 border border-slate-200 p-1 bg-white rounded-lg"
                />
              </div>
            )}

            <div className="border-t border-dashed border-slate-300 pt-6 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Thank you for training with us! 🔥
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MAIN POS DASHBOARD UI (HIDDEN ON PRINT) -------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row print:hidden w-full">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-900 p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between lg:justify-start gap-2.5 mb-10 px-2">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Dumbbell className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                FitPulse<span className="text-emerald-400">.AI</span>
              </span>
            </div>
            <button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            <button
              onClick={() => router.push(`/dashboard?gym_id=${gym.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Overview
            </button>

            <button
              onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=trainers`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <UserCheck className="h-4.5 w-4.5" /> Trainers
            </button>

            <button
              onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=qr`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <QrCode className="h-4.5 w-4.5" /> Counter QR Poster
            </button>

            <button
              onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=slips`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <FileText className="h-4.5 w-4.5" /> Member Slips
            </button>

            <button
              onClick={() => router.push(`/dashboard?gym_id=${gym.id}&tab=billing`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <CreditCard className="h-4.5 w-4.5" /> Billing & Licensing
            </button>

            <div className="h-[1px] bg-slate-900 my-4" />

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-sm cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5" /> Supplement POS
              <ChevronRight className="ml-auto h-4 w-4" />
            </button>

            <button
              onClick={() => router.push(`/dashboard/retention?gym_id=${gym.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-semibold text-slate-400 hover:text-slate-250 hover:bg-slate-900/50 text-sm cursor-pointer"
            >
              <Users className="h-4.5 w-4.5" /> Retention Engine
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
                {gym.ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{gym.ownerName}</p>
                <p className="text-[10px] text-slate-505 truncate">Gym Owner</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto relative">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-900">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{gym.id}</span>
                <span>•</span>
                <span>Supplement Shop POS</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{gym.gymName}</h1>
            </div>

            <div className="px-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Billing Active</span>
            </div>
          </header>

          {/* POS Workspace: Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Catalog Grid (8 columns) */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search catalog items (e.g. Whey, Creatine, Water)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="absolute left-4 top-4.5 h-4.5 w-4.5 text-slate-550" />
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCatalog.map((item) => (
                  <Card 
                    key={item.id} 
                    onClick={() => handleAddToCart(item)}
                    className={`hover:border-emerald-500/25 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      item.stock === 0 ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                          {item.id}
                        </span>
                        {item.stock <= 5 && item.stock > 0 && (
                          <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Low Stock
                          </span>
                        )}
                        {item.stock === 0 && (
                          <span className="text-[8px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold mt-2 text-white group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-baseline pt-2 border-t border-slate-900/60 mt-2">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Unit Stock</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{item.stock} left</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Selling Price</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">LKR {item.sellingPrice.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Shopping Cart & checkout (5 columns) */}
            <div className="xl:col-span-5">
              <Card glow={cart.length > 0}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Transaction Cart</span>
                    <ShoppingBag className="h-5 w-5 text-emerald-400" />
                  </CardTitle>
                  <CardDescription>Add supplements, specify details, and run billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Cart Items list */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="h-32 flex flex-col justify-center items-center text-center p-4 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
                        Cart is currently empty.
                      </div>
                    ) : (
                      cart.map((c) => (
                        <div key={c.item.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-bold text-white truncate">{c.item.name}</p>
                            <p className="text-[9px] text-emerald-400 font-mono mt-0.5">LKR {c.item.sellingPrice.toLocaleString()}</p>
                          </div>
                          
                          {/* Quantity control */}
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg mr-3">
                            <button onClick={() => handleUpdateQty(c.item.id, -1)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-mono text-white font-bold">{c.qty}</span>
                            <button onClick={() => handleUpdateQty(c.item.id, 1)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button onClick={() => handleRemoveFromCart(c.item.id)} className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Totals */}
                  {cart.length > 0 && (
                    <div className="border-t border-slate-900 pt-4 space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">LKR {cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>LKR Tax Equivalent:</span>
                        <span className="font-mono">LKR 0.00</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-900">
                        <span>Total Due LKR:</span>
                        <span className="font-mono text-emerald-400 text-base">LKR {cartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Checkout configuration Form */}
                  <form onSubmit={handleCheckout} className="border-t border-slate-900 pt-4 space-y-4">
                    
                    {/* Assign Customer */}
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-emerald-400" /> Assign Customer Account
                      </label>
                      <select
                        value={assignedMemberId}
                        onChange={(e) => setAssignedMemberId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Guest">Walk-in Guest</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Toggles */}
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        Select Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Cash')}
                          className={`py-2 text-center rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            paymentMethod === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md'
                              : 'bg-slate-950 border border-slate-900 text-slate-505 hover:text-slate-300'
                          }`}
                        >
                          Cash
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('LANKAQR')}
                          className={`py-2 text-center rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            paymentMethod === 'LANKAQR'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md'
                              : 'bg-slate-950 border border-slate-900 text-slate-505 hover:text-slate-300'
                          }`}
                        >
                          LANKAQR/Card
                        </button>

                        <button
                          type="button"
                          disabled={assignedMemberId === 'Guest'}
                          onClick={() => setPaymentMethod('Credit')}
                          className={`py-2 text-center rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer ${
                            paymentMethod === 'Credit'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md'
                              : 'bg-slate-950 border border-slate-900 text-slate-505 hover:text-slate-300'
                          }`}
                        >
                          Credit Tab
                        </button>
                      </div>
                      {assignedMemberId === 'Guest' && (
                        <span className="text-[8px] text-slate-550 block mt-1">
                          * Note: Credit Billing requires selecting a registered member account.
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={cart.length === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ShoppingBag className="h-4.5 w-4.5" /> Process POS Invoice
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* -------------------- WEB SCREEN RECEIPT MODAL -------------------- */}
          {showReceipt && receiptSale && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <Card className="max-w-md w-full border-slate-800 bg-slate-900 overflow-hidden relative shadow-2xl" glow>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <button
                  onClick={() => setShowReceipt(false)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>

                <CardHeader className="text-center pt-8">
                  <div className="mx-auto h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Checkout Completed</CardTitle>
                  <CardDescription className="text-xs">Invoice generated. Choose option to print receipt.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-3.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice ID:</span>
                      <span className="text-white font-bold">{receiptSale.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="text-white font-bold">{receiptSale.memberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment:</span>
                      <span className="text-emerald-450 uppercase font-black">{receiptSale.paymentMethod}</span>
                    </div>

                    <div className="border-t border-dashed border-slate-850 pt-3 space-y-2">
                      {receiptSale.items.map((itm, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{itm.name} (x{itm.qty})</span>
                          <span>LKR {(itm.qty * itm.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-slate-850 pt-3 flex justify-between font-black text-sm text-white">
                      <span>Total Amount:</span>
                      <span>LKR {receiptSale.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-4.5 w-4.5" /> Print Receipt
                    </button>
                    <button
                      onClick={() => setShowReceipt(false)}
                      className="flex-1 py-3 border border-slate-800 bg-slate-950/60 hover:bg-slate-905 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Close Portal
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
