import { closeSession } from "../services/authService.ts";

interface NavbarProps {
  onNavSearch: () => void
  onNavListing: () => void
}

export function Navbar( {onNavSearch, onNavListing}: NavbarProps) {
  async function handleLogout() {
    
    try {
      closeSession()
    }

    catch (error) {
      console.error("Logout failed:", error);
      return;
    }
  }

  return (
    <nav className="navbar navbar-expand">
      <div className="container justify-content-center">
        <ul className="navbar-nav align-items-center gap-3">
          <li className="nav-item">
            <button 
              onClick={onNavSearch}
              className="btn btn-outline-secondary"
            > 
              Search 
            </button>
          </li>

          <li className="nav-item">
            <button 
              onClick={onNavListing}
              className="btn btn-outline-primary"
            > 
              My Listing 
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
