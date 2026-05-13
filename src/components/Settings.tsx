import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { Copy, Check, Share2, Users, X, LogOut } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

interface Member {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const { familyId, familyName } = useStore();
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    const unsubFamily = onSnapshot(doc(db, 'families', familyId), async (famDoc) => {
      const data = famDoc.data();
      if (!data) return;
      setInviteCode(data.inviteCode);

      // Cargar info de cada miembro
      const memberIds: string[] = data.members;
      const memberData: Member[] = [];
      for (const uid of memberIds) {
        const userDoc = await getDocs(collection(db, 'users'));
        userDoc.forEach(d => {
          if (d.id === uid) memberData.push(d.data() as Member);
        });
      }
      setMembers(memberData);
    });

    return () => unsubFamily();
  }, [familyId]);

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

  return (
    <AnimatePresence>
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

          {/* Nombre familia */}
          <p className="text-sm text-neutral-500 mb-1">Familia</p>
          <p className="text-lg font-bold text-neutral-900 mb-6">{familyName}</p>

          {/* Código de invitación */}
          <p className="text-sm text-neutral-500 mb-2">Código de invitación</p>
          <div className="bg-neutral-100 rounded-2xl p-4 mb-3">
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
          <div className="flex items-center gap-2 mb-3 mt-6">
            <Users size={16} className="text-neutral-400" />
            <p className="text-sm text-neutral-500">Miembros ({members.length})</p>
          </div>
          <div className="space-y-2">
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
    </AnimatePresence>
  );
}