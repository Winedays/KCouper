# KCouper Copilot Instructions

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