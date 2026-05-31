import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { X, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { HistoryEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';

function formatDate(ts: unknown): string {
  if (!ts) return '';
  const date = (ts as { toDate: () => Date }).toDate();
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonth(ts: unknown): string {
  if (!ts) return '';
  const date = (ts as { toDate: () => Date }).toDate();
  return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

export default function History({ onClose }: { onClose: () => void }) {
  const { familyId } = useStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    const q = query(
      collection(db, 'families', familyId, 'historial'),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }) as HistoryEntry));
      setLoading(false);
    });
    return () => unsub();
  }, [familyId]);

  // Agrupar por mes
  const grouped = entries.reduce((acc, entry) => {
    const month = formatMonth(entry.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-neutral-900">Historial de compras</h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Sin historial aún</p>
              <p className="text-xs mt-1">Las compras aparecerán aquí cuando limpies la lista</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([month, monthEntries]) => {
                const monthTotal = monthEntries.reduce((s, e) => s + e.total, 0);
                return (
                  <div key={month}>
                    {/* Month header */}
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider capitalize">
                        {month}
                      </p>
                      <p className="text-xs font-bold text-neutral-500">
                        ${monthTotal.toLocaleString('es-CL')} total
                      </p>
                    </div>

                    {/* Entries */}
                    <div className="space-y-2">
                      {monthEntries.map((entry) => (
                        <div key={entry.id} className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
                          <button
                            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                            className="w-full flex items-center justify-between p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-orange-100 p-2 rounded-lg">
                                <ShoppingBag size={16} className="text-orange-500" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-neutral-900">
                                  {formatDate(entry.date)}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {entry.itemCount} producto{entry.itemCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-neutral-900">
                                ${entry.total.toLocaleString('es-CL')}
                              </p>
                              {expanded === entry.id
                                ? <ChevronUp size={16} className="text-neutral-400" />
                                : <ChevronDown size={16} className="text-neutral-400" />
                              }
                            </div>
                          </button>

                          <AnimatePresence>
                            {expanded === entry.id && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-1 border-t border-neutral-100 pt-3">
                                  {entry.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1">
                                      <p className="text-sm text-neutral-700">{item.name}</p>
                                      {item.priceEstimate > 0 && (
                                        <p className="text-xs text-neutral-400">
                                          ${item.priceEstimate.toLocaleString('es-CL')}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}