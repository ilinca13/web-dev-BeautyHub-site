# Beauty Hub — Web Commercial Site

A full-stack e-commerce platform for a beauty and personal care brand, built as part of a **Web Technologies** course (2nd Year, 2nd Semester). The project evolved from a static frontend into a data-driven application with a **Node.js**/**Express** server, **EJS** server-side rendering, and a **PostgreSQL** relational database.
>[!NOTE]
> **Project Requirements:** The complete document is available here → [Project Requirements PDF](./Requirements/Planificare%20&%20cerin%C8%9Be%20proiect%20(CTI,%202025-2026,%20sem%202)%20.pdf).




## Overview

Beauty Hub lets users browse a product catalog, apply advanced search filters, view real-time promotional offers, and explore bundle sets with automatically calculated discounts. All business logic, from dynamic pricing to promotion lifecycle management, runs server-side.


## Features & Architecture

### 1. Backend & Server-Side Rendering

The server is built with **Node.js and Express**, with clean routing for main pages, product catalogs, and dynamic landing states.

HTTP errors (400, 403, 404) and custom application errors are handled through a centralized subsystem driven by a local `erori.json` config file. Each error type maps to a dedicated, user-friendly EJS template — no blank pages, no exposed stack traces.

Server-side rendering is handled by **EJS** using two complementary patterns:
- **Partial Inclusion** — reusable UI fragments (navigation, footer, schedules, metadata) are isolated into standalone components, keeping the codebase DRY
- **Master Layout Pattern** — a single HTML5 blueprint that wraps page-specific views with shared metadata and asset declarations

An **asset management pipeline** built on `fs.watch()` monitors SASS source files, recompiles stylesheets on change, and writes timestamped backups to `/backup` for recovery.

The image gallery is powered by an external `galerie.json` data file, completely decoupling media content from template logic.

---

### 2. Frontend & Responsive Layout

The layout uses **CSS Grid** with explicit `grid-template-areas`, scaling from multi-column desktop arrangements down to a fully linearized single-column mobile layout.

Styling is built on **SASS/SCSS** with custom variables that extend and override Bootstrap 5 defaults (breakpoints, utilities, border radii, typography) — all constrained to a predefined 5-color palette.

The **navigation menu** adapts across three breakpoints: on desktop it renders the full labeled menu with animated dropdowns; on medium screens only Font Awesome icons remain visible (labels are hidden); on mobile the entire menu collapses into a hamburger toggle, with submenus expanding via a circular `clip-path` animation growing from the top-left corner.

A client-side **theme engine** toggles visual modes by manipulating CSS custom properties and swapping icon states, with persistence across sessions via `localStorage`.

Native HTML5 video components include multi-language subtitle tracks via VTT files. Images are preprocessed server-side using **sharp** to produce responsive `<picture>` elements tailored to specific screen resolutions.

---

### 3. Database & Query Engineering

The PostgreSQL data model uses normalized schemas, explicitly typed ENUMs, structured timestamps, and multi-value parameters.

**Search & Filtering:**
- Fuzzy text search engine with a fault-tolerant threshold of up to 2 character deviations
- Multi-criteria filtering via boolean evaluation matrices combining Checkbox and Radio inputs against relational state
- Dual-handle range slider for price interval filtering

**Sorting:** A custom algorithm that simultaneously evaluates multiple attributes, enabling complex hierarchical prioritization (e.g., compounding computed coefficients against structural subcategories).

**Session-level UI State:** `sessionStorage` caches viewport changes made by the user, allowing real-time suppression or isolation of specific data objects without affecting the database.

---

### 4. Product Bundle System (Many-to-Many)

Products can be grouped into promotional bundles through a normalized relational schema with a dedicated junction table (`asociere_set`).

The discount model follows:

$$\text{discount} = \min(5,\ n) \times 5\%$$

where $n$ is the number of products in the bundle. Navigation is bidirectional: the bundle catalog deep-links to individual product profiles, and each product page dynamically lists every bundle it belongs to.

---

### 5. Security & Compliance

**GDPR:** An animated consent banner handles data usage acknowledgment through short-expiry cookies. Transitions use hardware-accelerated CSS transforms (opacity and scale).

**Print Rendering:** A dedicated `@media print` stylesheet strips navigation and promotional graphics, enforces explicit page breaks, converts hyperlinks into inline URI citations, and injects a developer identity watermark that cannot be spoofed.

---

### 6. Automated Promotional System

**Offer Engine:**
- An asynchronous event loop running at interval $T$ queries the database for eligible product categories and generates a random discount coefficient (5%–50%)
- A business-logic constraint prevents the same category from running consecutive promotional cycles

**Cache & Garbage Collection:** `oferte.json` acts as a FIFO buffer for active campaigns. A secondary process running at interval $T_2$ continuously purges expired entries.

**Real-Time Client Sync:**
- Active promotions trigger runtime price overrides in the product catalog — the server reads the current `oferte.json` state on each page request and injects discounted prices directly into the rendered product list, striking through the original price and displaying the calculated reduced price alongside it
- A countdown timer on the landing page polls campaign expiration state every second
- In the final 10 seconds of a campaign, the DOM transitions into a critical state with color changes and an audio alert, followed by an automatic page refresh on expiration

---

 ## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Runtime & Server | Node.js, Express.js |
| Template Engine | EJS (Embedded JavaScript) |
| Database | PostgreSQL, JSON flat-files (`oferte.json`, `galerie.json`, `erori.json`) |
| Frontend | HTML5, CSS3 (Grid, Flexbox, Custom Properties), SASS/SCSS, Bootstrap 5 |
| Key Dependencies | `express`, `sass`, `sharp`, `pg`, `path`, `fs` |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ilinca13/web-dev-BeautyHub-site.git
cd web-dev-BeautyHub-site
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the database

The application does not auto-initialize table structures. Before starting the server, connect to your local PostgreSQL instance and run the initialization script (or restore a schema backup) using the following credentials:

> - **Database:** `proiect_beauty_hub`
> - **User:** `beauty_hub_admin`
> - **Password:** `beauty_hub`

```javascript
const client = new pg.Client({
    database: "proiect_beauty_hub",
    user: "beauty_hub_admin",
    password: "beauty_hub",
    host: "localhost",
    port: 5432
});
```

### 4. Start the server

```bash
node index.js
```

### 5. Open in browser

```
http://localhost:8080
```
