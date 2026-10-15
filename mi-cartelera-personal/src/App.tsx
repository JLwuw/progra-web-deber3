import { useState, useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { getCurrentSession, closeSession } from "./services/authService.ts";

import { LoadingScreen } from "./components/LoadingScreen.tsx" 
import { AuthScreen } from "./components/AuthScreen.tsx"

import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'


function App() {
  const [count, setCount] = useState(0)
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    getCurrentSession().then((saved_session) => {
      setSession(saved_session);
      setLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, new_session: Session | null) => {
      setSession(new_session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);


  if (loadingSession) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  )
}

export default App
