import React from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { ShoppingCart, Mail, Lock } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [verificationSent, setVerificationSent] = React.useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      if (isMobile || isPWA) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        await auth.signOut();
        setVerificationSent(true);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          await auth.signOut();
          setError('Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
          setError('Correo o contraseña incorrectos');
        } else if (msg.includes('email-already-in-use')) {
          setError('Este correo ya está registrado');
        } else if (msg.includes('weak-password')) {
          setError('La contraseña debe tener al menos 6 caracteres');
        } else if (msg.includes('invalid-email')) {
          setError('El correo ingresado no es válido');
        } else {
          setError('Error al iniciar sesión. Intenta de nuevo.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-100 text-center"
        >
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Revisa tu correo</h2>
          <p className="text-neutral-500 text-sm mb-2">Enviamos un link de verificación a:</p>
          <p className="font-bold text-neutral-800 mb-6">{email}</p>
          <p className="text-neutral-400 text-xs mb-8">
            Una vez que confirmes tu correo, vuelve aquí e inicia sesión.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setIsRegistering(false); }}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
          >
            Volver al inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg mb-4">
            <ShoppingCart size={40} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">SuperLista</h1>
          <p className="text-neutral-500 text-sm text-center mt-2">
            La lista de compras colaborativa para tu familia
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
              required
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-100 border border-transparent focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-sm"
              required
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? 'Cargando...' : isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-neutral-200"></div>
          <span className="text-neutral-400 text-xs uppercase font-bold">O</span>
          <div className="flex-1 h-px bg-neutral-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-6 bg-white border border-neutral-200 text-neutral-700 py-3 rounded-xl font-medium hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="w-5 h-5"
            alt="Google"
          />
          Continuar con Google
        </button>

        <p className="mt-8 text-center text-sm text-neutral-500">
          {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="ml-1 text-orange-500 font-bold hover:underline"
          >
            {isRegistering ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}