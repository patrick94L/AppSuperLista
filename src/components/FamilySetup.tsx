import React, { useState } from 'react';
import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { Users, Plus, LogIn, ArrowRight, Copy, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { generateInviteCode } from '../lib/utils';
import { motion } from 'motion/react';

export default function FamilySetup() {
  const { user } = useStore();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createFamily = async () => {
    if (!familyName.trim() || !user) return;
    setLoading(true);
    setError('');
    try {
      const code = generateInviteCode();
      const familyRef = await addDoc(collection(db, 'families'), {
        name: familyName.trim(),
        inviteCode: code,
        members: [user.uid],
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyRef.id
      });

      setCreatedCode(code);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinFamily = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'families'),
        where('inviteCode', '==', inviteCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Código de invitación no válido');
        setLoading(false);
        return;
      }

      const familyDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'families', familyDoc.id), {
        members: arrayUnion(user.uid)
      });

      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyDoc.id
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show invite code after creation
  if (createdCode) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-100 text-center"
        >
          <div className="bg-green-100 p-4 rounded-2xl text-green-600 mb-4 inline-block">
            <Check size={40} />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">¡Familia creada!</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Comparte este código con tu familia para que puedan unirse
          </p>
          <div className="bg-neutral-100 rounded-2xl p-6 mb-4">
            <p className="text-4xl font-mono font-bold text-neutral-900 tracking-widest mb-3">
              {createdCode}
            </p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 mx-auto text-sm text-orange-500 font-bold"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar código'}
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Puedes ver este código más tarde en los ajustes de la app
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 mb-4">
            <Users size={40} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Tu Familia</h1>
          <p className="text-neutral-500 text-sm text-center mt-2">
            Crea un grupo familiar o únete a uno existente
          </p>
        </div>

        {mode === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-between p-6 rounded-2xl bg-orange-50 border border-orange-100 text-orange-700 hover:bg-orange-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Plus size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">Crear Familia</p>
                  <p className="text-xs opacity-70">Empieza una lista nueva</p>
                </div>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-between p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <LogIn size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">Unirse a Familia</p>
                  <p className="text-xs opacity-70">Usa un código de invitación</p>
                </div>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre de la familia (ej. Los Pérez)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
              autoFocus
            />
            <button
              onClick={createFamily}
              disabled={loading || !familyName.trim()}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Familia'}
            </button>
            <button
              onClick={() => setMode('choice')}
              className="w-full text-neutral-400 text-xs font-bold uppercase tracking-widest py-2"
            >
              Volver
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Código de invitación"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-center font-mono text-lg tracking-widest"
              autoFocus
            />
            <button
              onClick={joinFamily}
              disabled={loading || inviteCode.length !== 6}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
            <button
              onClick={() => setMode('choice')}
              className="w-full text-neutral-400 text-xs font-bold uppercase tracking-widest py-2"
            >
              Volver
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-500 text-xs text-center bg-red-50 py-2 px-3 rounded-lg">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
