import Settings from './Settings';
import History from './History';
import ItemDetail from './ItemDetail';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  Plus, Trash2, CheckCircle2, Circle, ShoppingCart,
  Settings as SettingsIcon, History as HistoryIcon,
  Users, Trash, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { ShoppingItem } from '../types';
import { cn, capitalize } from '../lib/utils';
import { useState, useEffect, useMemo } from 'react';

export default function ShoppingList() {
  const { user, familyId, familyName } = useStore();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'price-desc' | 'price-asc'>('recent');

  useEffect(() => {
    if (!familyId) return;

    const q = query(
      collection(db, 'families', familyId, 'shoppingList'),
      orderBy('purchased', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ShoppingItem[];
      setItems(newItems);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !familyId || !user) return;

    try {
      await addDoc(collection(db, 'families', familyId, 'shoppingList'), {
        name: capitalize(newItemName),
        purchased: false,
        priceEstimate: parseFloat(newItemPrice) || 0,
        priceReal: 0,
        quantity: newItemQty,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty(1);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    if (!familyId) return;
    try {
      await updateDoc(doc(db, 'families', familyId, 'shoppingList', item.id), {
        purchased: !item.purchased
      });
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleCircleClick = (item: ShoppingItem) => {
    if (item.purchased) {
      togglePurchased(item);
    } else {
      setSelectedItem(item);
    }
  };

  const confirmPurchase = async (priceReal: number) => {
    if (!familyId || !selectedItem) return;
    try {
      await updateDoc(doc(db, 'families', familyId, 'shoppingList', selectedItem.id), {
        purchased: true,
        priceReal
      });
    } catch (error) {
      console.error('Error updating item:', error);
    }
    setSelectedItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!familyId) return;
    try {
      await deleteDoc(doc(db, 'families', familyId, 'shoppingList', id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const clearPurchased = async () => {
    if (!familyId || !user) return;
    const purchased = items.filter(i => i.purchased);
    if (purchased.length === 0) return;

    const total = purchased.reduce(
      (sum, i) => sum + (i.priceReal > 0 ? i.priceReal : i.priceEstimate || 0) * (i.quantity || 1),
      0
    );

    try {
      await addDoc(collection(db, 'families', familyId, 'historial'), {
        date: serverTimestamp(),
        total,
        itemCount: purchased.length,
        items: purchased.map(i => ({
          name: i.name,
          priceEstimate: i.priceEstimate || 0,
          priceReal: i.priceReal || 0,
          quantity: i.quantity || 1
        })),
        archivedBy: user.uid
      });

      await Promise.all(purchased.map(i => deleteItem(i.id)));
    } catch (error) {
      console.error('Error archivando compra:', error);
    }

    setShowClearConfirm(false);
  };

  const totalEstimated = items.reduce(
    (sum, item) => sum + (item.priceEstimate || 0) * (item.quantity || 1), 0
  );
  const totalPurchased = items.filter(i => i.purchased).reduce(
    (sum, item) => sum + (item.priceReal > 0 ? item.priceReal : item.priceEstimate || 0) * (item.quantity || 1), 0
  );
  const purchasedCount = items.filter(i => i.purchased).length;
  const progress = totalEstimated > 0 ? (totalPurchased / totalEstimated) * 100 : 0;

  const sortedItems = useMemo(() => {
  const pending = items.filter(i => !i.purchased);
  const purchased = items.filter(i => i.purchased);

  const sortFn = (a: ShoppingItem, b: ShoppingItem) => {
    const totalA = (a.priceEstimate || 0) * (a.quantity || 1);
    const totalB = (b.priceEstimate || 0) * (b.quantity || 1);
    switch (sortBy) {
      case 'az': return a.name.localeCompare(b.name, 'es');
      case 'price-desc': return totalB - totalA;
      case 'price-asc': return totalA - totalB;
      default: return 0;
    }
  };

  if (sortBy !== 'recent') {
    pending.sort(sortFn);
    purchased.sort(sortFn);
  }

  return [...pending, ...purchased];
  }, [items, sortBy]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 leading-tight">SuperLista</h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Users size={12} /> {familyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Historial"
            >
              <HistoryIcon size={20} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Ajustes"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-neutral-900 rounded-xl p-4 text-white">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1">
                Total estimado
              </p>
              <p className="text-2xl font-bold">${totalEstimated.toLocaleString('es-CL')}</p>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1">
                Comprado
              </p>
              <p className="text-lg font-semibold text-orange-400">
                ${totalPurchased.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
          <div className="bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="bg-orange-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </header>

      {/* Add Item Form */}
      <form onSubmit={addItem} className="p-4 bg-white border-b border-neutral-100">
        <input
          type="text"
          placeholder="¿Qué falta comprar?"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm mb-2"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="Precio estimado"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-2 w-24 flex-shrink-0">
            <button
              type="button"
              onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
              className="text-neutral-500 hover:text-neutral-700 p-1"
            >
              <Minus size={14} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-neutral-900">
              {newItemQty}
            </span>
            <button
              type="button"
              onClick={() => setNewItemQty(q => q + 1)}
              className="text-neutral-500 hover:text-neutral-700 p-1"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="bg-orange-500 text-white px-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0"
          >
            <Plus size={22} />
          </button>
        </div>
      </form>

      {/* List */}
      <main className="flex-1 p-4 overflow-y-auto">
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              {items.length} producto{items.length !== 1 ? 's' : ''}
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs bg-neutral-100 rounded-lg px-2 py-1.5 text-neutral-600 border-none focus:outline-none"
            >
              <option value="recent">Más recientes</option>
              <option value="az">Nombre (A-Z)</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="price-asc">Precio: menor a mayor</option>
            </select>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">La lista está vacía</p>
            <p className="text-xs mt-1">¡Empieza a agregar productos!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedItems.map((item) => {
                const qty = item.quantity || 1;
                const unitPrice = item.purchased && item.priceReal > 0 ? item.priceReal : item.priceEstimate;
                const totalPrice = unitPrice * qty;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      'bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3 transition-all',
                      item.purchased && 'opacity-50 bg-neutral-50'
                    )}
                  >
                    <button
                      onClick={() => handleCircleClick(item)}
                      className={cn(
                        'transition-colors flex-shrink-0',
                        item.purchased ? 'text-orange-500' : 'text-neutral-300 hover:text-neutral-400'
                      )}
                    >
                      {item.purchased
                        ? <CheckCircle2 size={24} />
                        : <Circle size={24} />
                      }
                    </button>

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-medium text-neutral-900 truncate',
                          item.purchased && 'line-through text-neutral-400'
                        )}>
                          {item.name}
                        </p>
                        {qty > 1 && (
                          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            x{qty}
                          </span>
                        )}
                      </div>
                      {totalPrice > 0 && (
                        <p className="text-xs text-neutral-500">
                          {qty > 1
                            ? `$${unitPrice.toLocaleString('es-CL')} c/u · $${totalPrice.toLocaleString('es-CL')} total`
                            : `$${totalPrice.toLocaleString('es-CL')}`}
                          {item.purchased && item.priceReal > 0 && (
                            <span className="text-orange-500 font-medium"> (real)</span>
                          )}
                        </p>
                      )}
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Clear purchased button */}
            {purchasedCount > 0 && (
              <div className="pt-2">
                {showClearConfirm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={clearPurchased}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-bold"
                    >
                      Eliminar {purchasedCount} comprado{purchasedCount > 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2 rounded-xl border border-neutral-200 text-neutral-400 text-sm flex items-center justify-center gap-2 hover:border-red-300 hover:text-red-400 transition-all"
                  >
                    <Trash size={14} />
                    Limpiar comprados ({purchasedCount})
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={confirmPurchase}
        />
      )}
      {showHistory && <History onClose={() => setShowHistory(false)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}