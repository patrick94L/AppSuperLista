import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ShoppingItem } from '../types';

interface Props {
  item: ShoppingItem;
  onClose: () => void;
  onConfirm: (priceReal: number) => void;
}

export default function ItemDetail({ item, onClose, onConfirm }: Props) {
  const [priceReal, setPriceReal] = useState(
    item.priceReal > 0
      ? item.priceReal.toString()
      : item.priceEstimate > 0
        ? item.priceEstimate.toString()
        : ''
  );

  const quantity = item.quantity || 1;
  const realNum = parseFloat(priceReal) || 0;
  const total = realNum * quantity;

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
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-1">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{item.name}</h2>
            <p className="text-sm text-neutral-400">
              {quantity} unidad{quantity !== 1 ? 'es' : ''}
              {item.priceEstimate > 0 && ` · estimado $${item.priceEstimate.toLocaleString('es-CL')} c/u`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="border-t border-neutral-100 mt-4 pt-4">
          <p className="text-sm text-neutral-500 mb-2">Precio real por unidad</p>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
            <input
              type="number"
              step="1"
              min="0"
              value={priceReal}
              onChange={(e) => setPriceReal(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full pl-7 pr-4 py-3 rounded-xl bg-neutral-100 border-2 border-orange-500 focus:outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-neutral-500">Total real</span>
            <span className="text-lg font-bold text-orange-500">
              ${total.toLocaleString('es-CL')}
            </span>
          </div>

          <button
            onClick={() => onConfirm(realNum)}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {item.purchased ? 'Actualizar' : 'Marcar como comprado'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}