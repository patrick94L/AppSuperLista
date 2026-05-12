import React, { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { useStore } from './store/useStore';
import Login from './components/Login';
import FamilySetup from './components/FamilySetup';
import ShoppingList from './components/ShoppingList';

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: unknown; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
            <h1 className="text-xl font-bold text-red-600 mb-4">Algo salió mal</h1>
            <p className="text-neutral-600 text-sm mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { user, familyId, isAuthReady, setUser, setFamily, setAuthReady } = useStore();

  useEffect(() => {
    // Handle redirect result from Google sign-in on mobile
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Solo crear perfil si el email está verificado o es Google
          if (firebaseUser.emailVerified || firebaseUser.providerData[0]?.providerId === 'google.com') {
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              familyId: null
          });
        } else {
            // Email no verificado — cerrar sesión
            await auth.signOut();
            return;
            }
          }

        let unsubFamily: (() => void) | null = null;
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
          const data = docSnap.data();
          if (data?.familyId) {
            if (unsubFamily) unsubFamily();
            unsubFamily = onSnapshot(doc(db, 'families', data.familyId), (famDoc) => {
              const famData = famDoc.data();
              setFamily(data.familyId, famData?.name || 'Mi Familia');
              setAuthReady(true);
            });
          } else {
            if (unsubFamily) unsubFamily();
            setFamily(null, null);
            setAuthReady(true);
          }
        });

        return () => {
          unsubUser();
          if (unsubFamily) unsubFamily();
        };
      } else {
        setUser(null);
        setFamily(null, null);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!user ? <Login /> : !familyId ? <FamilySetup /> : <ShoppingList />}
    </ErrorBoundary>
  );
}
