import { useState, useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";
import { getCurrentSession, closeSession } from "./services/authService.ts";

import { LoadingScreen } from "./components/LoadingScreen.tsx" 
import { AuthScreen } from "./components/AuthScreen.tsx"
import { Navbar } from "./components/NavBar.tsx"
import { SearchScreen } from "./components/SearchScreen.tsx"

type View = "search" | "listing" | "editing"

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [view, setView] = useState<View>("search");

  function onNavListing() {
    setView("listing")
  }  

  function onNavSearch() {
    setView("search")
  }

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
    return <LoadingScreen />
  }

  if (!session) {
    return <AuthScreen />
  }

  if (view === "search")
    return (
      <>
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch}/>
        <SearchScreen />
      </>
    )
    
  if (view === "listing")
      return (
      <>
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch}/>
      </>
    )
}

export default App
