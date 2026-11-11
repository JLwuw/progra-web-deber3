import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getCurrentSession,
  closeSession,
  subscribeToSession,
  getConfigurationError,
} from "./services/authService";
import type { Media } from "./types/Media";
import { LoadingScreen } from "./components/LoadingScreen";
import { AuthScreen } from "./components/AuthScreen";
import { Navbar } from "./components/Navbar";
import { SearchScreen } from "./components/SearchScreen";
import { ListingScreen } from "./components/ListingScreen";
import { ListingDetailScreen } from "./components/ListingDetailScreen";
import { ListingEditScreen } from "./components/ListingEditScreen";

import { MovieNightScreen } from "./components/MovieNightScreen";
import { SavedMovieNightsScreen } from "./components/SavedMovieNightsScreen";
import { MovieNightDetailScreen } from "./components/MovieNightDetailScreen";

function SignedInApp({ userId }: { userId: string }) {
  const [view, setView] = useState<
    | "search"
    | "listing"
    | "details"
    | "edit"
    | "movieNight"
    | "savedNights"
    | "nightDetail"
  >("search");
  const [nightId, setNightId] = useState<string | null>(null);
  const [target, setTarget] = useState<Media | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await closeSession();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please retry.",
      );
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <>
      <Navbar
        onNavListing={() => setView("listing")}
        onNavSearch={() => setView("search")}
        handleLogout={handleLogout}
        loggingOut={loggingOut}
        onMovieNight={() => setView("movieNight")}
        onSavedNights={() => setView("savedNights")}
      />
      {logoutError && (
        <p className="error-auth container" role="alert">
          {logoutError}
        </p>
      )}
      {view === "search" && <SearchScreen />}
      {view === "movieNight" && (
        <MovieNightScreen
          userId={userId}
          onSaved={(night) => {
            setNightId(night.id);
            setView("nightDetail");
          }}
        />
      )}
      {view === "savedNights" && (
        <SavedMovieNightsScreen
          userId={userId}
          onDetail={(id) => {
            setNightId(id);
            setView("nightDetail");
          }}
        />
      )}
      {view === "nightDetail" && nightId && (
        <MovieNightDetailScreen
          userId={userId}
          id={nightId}
          onBack={() => setView("savedNights")}
        />
      )}
      {view === "listing" && (
        <ListingScreen
          onListingDetail={(listing) => {
            setTarget(listing);
            setView("details");
          }}
          onListingEdit={(listing) => {
            setTarget(listing);
            setView("edit");
          }}
        />
      )}
      {view === "details" && target && (
        <ListingDetailScreen
          key={target.id}
          listing={target}
          onListingExit={() => setView("listing")}
        />
      )}
      {view === "edit" && target && (
        <ListingEditScreen
          key={target.id}
          listing={target}
          onListingExit={() => setView("listing")}
        />
      )}
    </>
  );
}
function App() {
  const [{ session, identityVersion }, setAuth] = useState<{
    session: Session | null;
    identityVersion: number;
  }>({ session: null, identityVersion: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const configurationError = getConfigurationError();
  useEffect(() => {
    if (configurationError) return;
    let active = true;
    let authChanged = false;
    function acceptSession(next: Session | null) {
      setAuth((previous) => ({
        session: next,
        identityVersion:
          previous.identityVersion +
          (previous.session?.user.id !== next?.user.id ? 1 : 0),
      }));
    }
    let unsubscribe = () => {};
    async function restoreSession() {
      try {
        unsubscribe = subscribeToSession((next) => {
          authChanged = true;
          if (active) {
            acceptSession(next);
            setLoading(false);
            setError(null);
          }
        });
        const savedSession = await getCurrentSession();
        if (active && !authChanged) {
          acceptSession(savedSession);
          setLoading(false);
        }
      } catch (err) {
        if (active && !authChanged) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to restore your session.",
          );
          setLoading(false);
        }
      }
    }
    void restoreSession();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [retry, configurationError]);
  if (configurationError)
    return (
      <main className="container py-5">
        <h1>Configuration required</h1>
        <p role="alert">{configurationError}</p>
        <p>Update local configuration and restart the development server.</p>
      </main>
    );
  if (loading) return <LoadingScreen />;
  if (error)
    return (
      <main className="container py-5">
        <p role="alert">{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setLoading(true);
            setError(null);
            setRetry((n) => n + 1);
          }}
        >
          Retry session
        </button>
      </main>
    );
  if (!session) return <AuthScreen />;
  return (
    <SignedInApp
      key={`${session.user.id}:${identityVersion}`}
      userId={session.user.id}
    />
  );
}
export default App;
