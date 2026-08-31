# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-13
**Status:** Active Development
**Stack:** React (Vite, TS, Shadcn/UI, Tailwind) + Python (Pipenv, Requests, BS4)

## OVERVIEW
KCouper is a web application that collects KFC coupon data from Taiwan's official API and displays it in a searchable, filterable interface. It features a Python backend for data scraping/processing and a modern React frontend for the UI.

## STRUCTURE
```
kfc_coupon/
├── script/            # Python backend (scraping & processing)
│   ├── gatherer/      # Coupon and single product data collection
│   ├── checker/       # Coupon existence verification
│   └── kfc.py         # Main entry point for data collection
├── src/               # React frontend (Vite + TypeScript)
│   ├── components/    # UI components (shadcn/ui + custom)
│   ├── hooks/         # Custom React hooks (useCoupons, useFavorites, etc.)
│   ├── data/          # Static data and types
│   └── main.tsx       # Frontend entry point
├── public/            # Static assets and legacy JS files
└── index.html         # Main HTML entry
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Update coupon data | `script/kfc.py` | Run with `--mode main` or `--mode quick` |
| UI components | `src/components/` | Custom components and shadcn/ui primitives |
| State/Logic | `src/hooks/` | Business logic for filtering and favorites |
| Data processing | `script/gatherer/` | API response to Coupon object conversion |
| Styling | `src/index.css` | Tailwind config and global styles |

## CODE MAP (Key Symbols)
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `query_coupon` | Function | `script/gatherer/coupon.py` | Main scraping logic |
| `useCoupons` | Hook | `src/hooks/useCoupons.ts` | Fetches and manages coupon state |
| `CouponCard` | Component | `src/components/CouponCard.tsx` | Individual coupon display |
| `CouponGrid` | Component | `src/components/CouponGrid.tsx` | Main layout for coupon list |
| `api_caller` | Function | `script/utils.py` | Robust API requester with retries |

## CONVENTIONS
### Python Backend
- **Naming**: snake_case for functions/variables, PascalCase for classes.
- **Formatting**: PEP 8, 100 char line limit, 4 spaces indentation.
- **Error Handling**: Log with `utils.LOG`. Retry 502s up to 10x.

### React Frontend
- **Components**: PascalCase, functional components with hooks.
- **Hooks**: camelCase, `use` prefix.
- **TypeScript**: Mandatory types/interfaces for all data structures.
- **Styling**: Tailwind CSS classes (mobile-first).

## COMMANDS
### Backend
```bash
pipenv run python script/kfc.py --mode main   # Full update
pipenv run python script/kfc.py --mode quick  # Quick update
pylint script/                                # Lint Python
```
### Frontend
```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Lint TS/React
```

## NOTES
- **API Sensitivity**: KFC API is sensitive to request frequency; use `utils.api_caller` for delays.
- **Data Persistence**: Favorites are stored in `localStorage`.
- **Legacy Path**: Some legacy JS files exist in `public/v1/` for compatibility.


## Project Overview

KCouper is a web app that automatically collects KFC coupon data from Taiwan's official API and displays it in a searchable interface. The backend (Python) gathers data via `script/kfc.py`, processes it into structured JSON/JS files (`coupon.json`, `public/coupon.js`), and the frontend (HTML/JS/CSS) renders coupons with filtering, sorting, and favorites functionality.

## Build, Lint, and Test Commands

### Python Backend Commands

**Install dependencies:**
```bash
pipenv install
```

**Run data collection (main mode - full coupon gathering):**
```bash
pipenv run python script/kfc.py --mode main
```

**Run data collection (quick mode - incremental update):**
```bash
pipenv run python script/kfc.py --mode quick
```

**Check coupon existence without processing:**
```bash
pipenv run python script/kfc.py --mode check
```

**Query single product prices:**
```bash
pipenv run python script/kfc.py --mode single
```

**Lint Python code:**
```bash
pylint script/
```

### Testing

The project uses Python unittest for backend test coverage. Tests are located in `script/tests/` and strictly mirror the `script/` directory structure.

**Run Python unit tests:**
```bash
pipenv run python -m unittest discover -s script/tests -t script
```

**Run all data collection modes for testing:**
```bash
pipenv run python script/kfc.py --mode check && \
pipenv run python script/kfc.py --mode quick && \
pipenv run python script/kfc.py --mode single
```

## Code Style Guidelines

### Python Style (PEP 8 with Pylint)

**Naming Conventions:**
- Functions and variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_CASE`
- Private methods/functions: `_snake_case`
- Module names: `snake_case`

**Formatting:**
- Maximum line length: 100 characters
- Indentation: 4 spaces
- Use single quotes for strings unless double quotes are needed for escaping

**Import Guidelines:**
- All imports must be at module top-level; **NEVER** place imports inside functions or methods.
- **NEVER** use `try...except ImportError` fallback blocks for imports; use direct, standard imports.
- **NEVER** modify or add `__init__.py` files for `sys.path` manipulation.
- Import organization: Standard library → Third-party → Local modules. Separate import groups with blank lines.

**Test Structure Guidelines:**
- Test files must be placed under `script/tests/` and mirror the source code structure 1-to-1 (e.g., `script/notifier/storage.py` → `script/tests/notifier/test_storage.py`).

**Error Handling:**
- Use specific exception types, avoid bare `except:`
- Log all errors with the `utils.LOG.error` logger; never silently ignore errors
- Pure formatting functions must not swallow exceptions or silently degrade/fallback to partial text
- API calls should retry up to 10 times on 502 errors with 0.3s delays
- Skip invalid coupons with logging instead of crashing

**Example Python function:**
```python
def normalize_name(name: str) -> str:
    """Normalize coupon/food names by stripping parentheses."""
    if name.startswith('(') and name.endswith(')'):
        name = name[1:-1].strip()
    return name

def convert_coupon_data(data: dict, coupon_code: str) -> dict:
    """Convert raw API data to structured coupon format."""
    try:
        detail = data['FoodDetail']
    except KeyError:
        LOG.error('food detail not found in data=%r', data)
        raise

    if len(detail) != 1:
        LOG.error('unknown food detail format, detail=%r', detail)
        raise ValueError(f'unknown food detail format, {detail=}')

    # Process coupon data...
```

### JavaScript Style

**Naming Conventions:**
- Variables and functions: `camelCase`
- Constants: `UPPER_CASE`
- Constructor functions: `PascalCase`

**Code Structure:**
- Use JSDoc comments for all functions and types
- Declare constants with `const`, variables with `let`
- Use arrow functions for callbacks when appropriate
- Organize code with clear section comments

**Type Documentation:**
- Use JSDoc `@typedef` for complex object types
- Document all function parameters and return types
- Include property descriptions for object types

**Error Handling:**
- Use try-catch blocks for API calls and data processing
- Log errors to console for debugging
- Gracefully handle missing data without crashing

**Example JavaScript code:**
```javascript
/**
 * @typedef {Object} CouponItem
 * @property {string} name - The name of the item
 * @property {number} count - The count of this item that can be purchased
 * @property {number} addition_price - The additional price for this item
 * @property {ItemFlavor[]} flavors - The additional flavors for this item
 */

/**
 * @typedef {Object} Coupon
 * @property {string} name - The name of the coupon
 * @property {string} product_code - The product code of the coupon
 * @property {number} coupon_code - The code of the coupon
 * @property {CouponItem[]} items - The array of items in the coupon
 * @property {string} start_date - The start date of the coupon
 * @property {string} end_date - The end date of the coupon
 * @property {number} price - The price of the coupon
 * @property {number} original_price - The original price of the coupon
 * @property {number} discount - The discount of the coupon
 */

/**
 * @type {Coupon[]}
 */
const COUPONS = COUPON_DICT.coupon_list;

/**
 * Load favorite coupons from localStorage
 */
function loadFavorites() {
    const stored = localStorage.getItem('favoriteCoupons');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            favoriteCoupons = new Set(parsed);
        } catch (error) {
            console.error('Failed to parse favorite coupons:', error);
            favoriteCoupons = new Set();
        }
    }
}
```

### HTML/CSS Style

**HTML:**
- Use semantic HTML elements
- Include alt attributes for images
- Use data attributes for JavaScript hooks
- Keep HTML structure clean and minimal

**CSS:**
- Use Bootstrap classes where available (project uses Bootstrap)
- Follow BEM naming convention for custom classes
- Use CSS custom properties for theming
- Maintain responsive design principles

### General Guidelines

**File Organization:**
- Python scripts in `script/` directory with subdirectories for modules
- JavaScript files in `js/` directory
- CSS files in `css/` directory
- HTML files in root directory
- Generated data files (JSON/JS) in appropriate locations

**Version Control:**
- Use descriptive commit messages
- Follow conventional commit format when possible
- Test changes locally before committing

**Security:**
- Never log or commit sensitive data (API keys, credentials)
- Validate all external data inputs
- Use HTTPS for all external requests

**Performance:**
- Minimize API calls with appropriate caching
- Optimize data processing for large coupon datasets
- Ensure frontend loads efficiently

## Copilot Instructions

## Architecture Overview
KCouper is a web app that collects KFC coupon data from Taiwan's official API and displays it in a searchable interface. The backend (Python) gathers data via `script/kfc.py`, processes it into structured JSON/JS files (`coupon.json`, `public/coupon.js`), and the frontend (HTML/JS/CSS) renders coupons with filtering, sorting, and favorites.

Key components:
- **Backend**: `script/gatherer/coupon.py` converts API responses to Coupon objects with items/flavors.
- **Frontend**: `js/main.js` handles UI logic; uses jQuery/Bootstrap for DOM manipulation.
- **Data Flow**: API → Python processing → JSON storage → JS loading → HTML rendering.

## Developer Workflows
- **Update Coupons (Full)**: Run `pipenv run python script/kfc.py --mode main` after setting env vars (`SHOP_CODE`, `COUPON_RANGES`, `EXCLUDE_NAMES`).
- **Update Coupons (Quick)**: Run `pipenv run python script/kfc.py --mode quick` to incrementally update, reusing valid existing data.
- **Check Coupons**: Use `--mode check` to verify existence without full processing.
- **Single Query**: `--mode single` for querying each product prices.
- **Environment**: Use Pipenv for dependencies; Python 3.12 required.
- **Debugging**: Check `utils.LOG` for API errors; frontend logs to console for UI issues.
- **Linting**: Run `pylint script/` for Python code style checks.

## Code Patterns & Conventions
- **Data Structures**: Coupon objects include `items` array with `flavors` for variants (e.g., `convert_coupon_data` in `gatherer/coupon.py`).
- **Frontend Functions**: Use `prepareInitData()` for initial render, `filterCouponsWithNames()` for search (supports "搜尋所有選項" for variant matching).
- **Error Handling**: API retries up to 10 times on 502; skip invalid coupons with logging.
- **Naming**: Normalize names by stripping parentheses (e.g., `normalize_name` in `gatherer/coupon.py`).
- **Storage**: Favorites in `localStorage` as Set; coupon data in `COUPON_DICT` from `public/coupon.js`.
- **Style**: Python PEP 8 (100 char lines, snake_case); JS camelCase with JSDoc; HTML/CSS semantic with Bootstrap.

## Integration Points
- **KFC API**: Calls via `utils.api_caller` with 0.3s delays; uses session from `init_session`.
- **Dependencies**: `requests`, `beautifulsoup4`, `python-dotenv` for backend; jQuery/Bootstrap for frontend.
- **Deployment**: Static files served; update via GitHub Pages (https://winedays.github.io/KCouper/) with GitHub Actions workflows.

Reference: `SPECIFICATION.md` for full details, `README.md` for overview, `AGENTS.md` for comprehensive guidelines.</content>
