import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Copy, Check, Share2, Users, X, LogOut, Pencil } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';

interface Member {
  uid: string;
  email: string;
  displayName: string | null;
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const { familyId, familyName, user } = useStore();
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    const unsubFamily = onSnapshot(doc(db, 'families', familyId), async (famDoc) => {
      const data = famDoc.data();
      if (!data) return;
      setInviteCode(data.inviteCode);

      const memberIds: string[] = data.members;
      const memberData: Member[] = [];

      for (const uid of memberIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            memberData.push({
              uid,
              email: d.email,
              displayName: d.displayName || null
            });
          } else {
            memberData.push({ uid, email: '(usuario sin perfil)', displayName: null });
          }
        } catch {
          if (uid === user?.uid) {
            memberData.push({
              uid,
              email: user.email || '',
              displayName: user.displayName || null
            });
          } else {
            memberData.push({ uid, email: '(miembro)', displayName: null });
          }
        }
      }
      setMembers(memberData);
    });

    return () => unsubFamily();
  }, [familyId, user]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Únete a mi familia en SuperLista',
        text: `Usa este código para unirte a "${familyName}" en SuperLista: ${inviteCode}`,
        url: window.location.href
      });
    } else {
      copyCode();
    }
  };

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: nameInput.trim() });
      await updateDoc(doc(db, 'users', user.uid), { displayName: nameInput.trim() });
      setEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setSavingName(false);
    }
  };

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neutral-900">Ajustes de familia</h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        {/* Mi nombre */}
        <p className="text-sm text-neutral-500 mb-2">Mi nombre / alias</p>
        {editingName ? (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 border-2 border-orange-500 focus:outline-none text-sm"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={savingName || !nameInput.trim()}
              className="bg-orange-500 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {savingName ? '...' : 'Guardar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(user?.displayName || ''); setEditingName(true); }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-100 mb-6 text-left"
          >
            <span className="text-sm font-medium text-neutral-900">
              {user?.displayName || 'Sin nombre — toca para agregar'}
            </span>
            <Pencil size={14} className="text-neutral-400" />
          </button>
        )}

        {/* Nombre familia */}
        <p className="text-sm text-neutral-500 mb-1">Familia</p>
        <p className="text-lg font-bold text-neutral-900 mb-6">{familyName}</p>

        {/* Código de invitación */}
        <p className="text-sm text-neutral-500 mb-2">Código de invitación</p>
        <div className="bg-neutral-100 rounded-2xl p-4 mb-6">
          <p className="text-3xl font-mono font-bold text-neutral-900 tracking-widest text-center mb-3">
            {inviteCode}
          </p>
          <div className="flex gap-2">
            <button
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-neutral-200 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={shareCode}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-all"
            >
              <Share2 size={16} />
              Compartir
            </button>
          </div>
        </div>

        {/* Miembros */}
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-neutral-400" />
          <p className="text-sm text-neutral-500">Miembros ({members.length})</p>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {members.map((member) => (
            <div key={member.uid} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                {member.displayName
                  ? member.displayName[0].toUpperCase()
                  : member.email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {member.displayName || member.email}
                </p>
                {member.displayName && (
                  <p className="text-xs text-neutral-400 truncate">{member.email}</p>
                )}
              </div>
              {member.uid === user?.uid && (
                <span className="ml-auto text-xs text-orange-500 font-medium">Tú</span>
              )}
            </div>
          ))}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={() => auth.signOut()}
          className="w-full mt-8 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-neutral-500 text-sm font-medium hover:bg-neutral-50 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </motion.div>
    </motion.div>
  );
}