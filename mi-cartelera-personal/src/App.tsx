import { useState, useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { getCurrentSession, closeSession } from "./services/authService.ts";

import { LoadingScreen } from "./components/LoadingScreen.tsx" 
import { AuthScreen } from "./components/AuthScreen.tsx"
import { SearchScreen } from "./components/SearchScreen.tsx"

function App() {
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
      <SearchScreen />
    </>
  )
}

export default App
