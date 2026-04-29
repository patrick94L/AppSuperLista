import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart, LogOut, Users, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { ShoppingItem } from '../types';
import { cn } from '../lib/utils';

export default function ShoppingList() {
  const { user, familyId, familyName } = useStore();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
        name: newItemName.trim(),
        purchased: false,
        priceEstimate: parseFloat(newItemPrice) || 0,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });
      setNewItemName('');
      setNewItemPrice('');
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

  const deleteItem = async (id: string) => {
    if (!familyId) return;
    try {
      await deleteDoc(doc(db, 'families', familyId, 'shoppingList', id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const clearPurchased = async () => {
    if (!familyId) return;
    const purchased = items.filter(i => i.purchased);
    await Promise.all(purchased.map(i => deleteItem(i.id)));
    setShowClearConfirm(false);
  };

  const totalEstimated = items.reduce((sum, item) => sum + (item.priceEstimate || 0), 0);
  const totalPurchased = items.filter(i => i.purchased).reduce((sum, item) => sum + (item.priceEstimate || 0), 0);
  const purchasedCount = items.filter(i => i.purchased).length;
  const progress = totalEstimated > 0 ? (totalPurchased / totalEstimated) * 100 : 0;

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
          <button
            onClick={() => auth.signOut()}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
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
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              placeholder="¿Qué falta comprar?"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Precio estimado (opcional)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="bg-orange-500 text-white px-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-all flex items-center justify-center self-stretch"
          >
            <Plus size={24} />
          </button>
        </div>
      </form>

      {/* List */}
      <main className="flex-1 p-4 overflow-y-auto">
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
              {items.map((item) => (
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
                    onClick={() => togglePurchased(item)}
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

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-neutral-900 truncate',
                      item.purchased && 'line-through text-neutral-400'
                    )}>
                      {item.name}
                    </p>
                    {item.priceEstimate > 0 && (
                      <p className="text-xs text-neutral-500">
                        ${item.priceEstimate.toLocaleString('es-CL')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
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
    </div>
  );
}
