# AGENTS.md - Development Guidelines for KCouper

This document provides comprehensive guidelines for coding agents working on the KCouper project, a web application that collects and displays KFC coupon data from Taiwan's official API.

## Project Overview

KCouper is a web app that automatically collects KFC coupon data from Taiwan's official API and displays it in a searchable interface. The backend (Python) gathers data via `script/kfc.py`, processes it into structured JSON/JS files (`coupon.json`, `js/coupon.js`), and the frontend (HTML/JS/CSS) renders coupons with filtering, sorting, and favorites functionality.

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

The project uses integration testing through the data collection scripts. No unit test framework is currently configured, but you can verify functionality by:

1. Running the data collection scripts
2. Checking the generated output files (`coupon.json`, `js/coupon.js`, `single.json`, `js/single.js`)
3. Verifying the frontend loads correctly

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

**Code Structure:**
- Import organization: Standard library → Third-party → Local modules
- Separate import groups with blank lines
- Use type hints for function parameters and return values
- Maximum function/method length: 50 statements
- Maximum class attributes: 7
- Maximum local variables: 15

**Error Handling:**
- Use specific exception types, avoid bare `except:`
- Log errors with the `utils.LOG` logger
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
KCouper is a web app that collects KFC coupon data from Taiwan's official API and displays it in a searchable interface. The backend (Python) gathers data via `script/kfc.py`, processes it into structured JSON/JS files (`coupon.json`, `js/coupon.js`), and the frontend (HTML/JS/CSS) renders coupons with filtering, sorting, and favorites.

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
- **Storage**: Favorites in `localStorage` as Set; coupon data in `COUPON_DICT` from `js/coupon.js`.
- **Style**: Python PEP 8 (100 char lines, snake_case); JS camelCase with JSDoc; HTML/CSS semantic with Bootstrap.

## Integration Points
- **KFC API**: Calls via `utils.api_caller` with 0.3s delays; uses session from `init_session`.
- **Dependencies**: `requests`, `beautifulsoup4`, `python-dotenv` for backend; jQuery/Bootstrap for frontend.
- **Deployment**: Static files served; update via GitHub Pages (https://winedays.github.io/KCouper/) with GitHub Actions workflows.

Reference: `SPECIFICATION.md` for full details, `README.md` for overview, `AGENTS.md` for comprehensive guidelines.</content>
