import { useState, useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient.ts";

import { getCurrentSession, closeSession } from "./services/authService.ts";
import type { Media } from "./types/Media.ts";

import { LoadingScreen } from "./components/LoadingScreen.tsx" 
import { AuthScreen } from "./components/AuthScreen.tsx"
import { Navbar } from "./components/Navbar.tsx"
import { SearchScreen } from "./components/SearchScreen.tsx"
import { ListingScreen } from "./components/ListingScreen.tsx";
import { ListingDetailScreen } from "./components/ListingDetailScreen.tsx";
import { ListingEditScreen } from "./components/ListingEditScreen.tsx";

type View = "search" | "listing" | "details" | "edit"

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [view, setView] = useState<View>("search");
  const [targetListing, setTargetListing] = useState<Media | null>(null)

  function onNavListing() {
    setView("listing")
  }  

  function onNavSearch() {
    setView("search")
  }

  async function handleLogout() {
    try {
      await closeSession()
      setView("search")
      setTargetListing(null)
    }

    catch (error) {
      console.error("Logout failed:", error);
      return;
    }
  }

  function onListingDetail(listing: Media) {
    setTargetListing(listing)
    setView("details")
  }

  function onListingEdit(listing: Media) {
    setTargetListing(listing)
    setView("edit")
  }

  function onListingExit() {
    setView("listing")
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
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch} handleLogout={handleLogout}/>
        <SearchScreen />
      </>
    )
    
  if (view === "listing")
      return (
      <>
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch} handleLogout={handleLogout}/>
        <ListingScreen 
          onListingDetail={onListingDetail}
          onListingEdit={onListingEdit}
        />
      </>
    )
  
    if (view === "details" && targetListing)
      return (
      <>
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch} handleLogout={handleLogout}/>
        <ListingDetailScreen listing={targetListing} onListingExit={onListingExit} />
      </>
    )

    if (view === "edit" && targetListing)
      return (
      <>
        <Navbar onNavListing={onNavListing} onNavSearch={onNavSearch} handleLogout={handleLogout}/>
        <ListingEditScreen listing={targetListing} onListingExit={onListingExit} />
      </>
    )
}

export default App
