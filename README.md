# Beauty Hub - Web Commercial Site

A comprehensive application designed and developed for my Web Technologies Course, from my Second Year, Second Semester. Built with a Node.js and Express core, EJS for dynamic server-side rendering, and a PostgreSQL relational database, this repository documents the evolution of a static frontend interface into an integrated, data-driven platform.
> [!NOTE]
> **Project Requirements:** The complete document can be reviewed directly here: [View Project Requirements PDF](./Requirements/Planificare%20&%20cerin%C8%9Be%20proiect%20(CTI,%202025-2026,%20sem%202)%20.pdf).

## Architecture and Core Specifications

### 1. Backend Architecture & Dynamic Template Engine
* **Server Infrastructure:** Built using Node.js and Express, implementing clean architectural routing paradigms for core application paths, product catalogs, and custom dynamic landing states.
* **Deterministic Error Handling:** Formulated a centralized error-handling subsystem mapped to a local structure (`erori.json`). The server dynamically catches, logs, and processes specific HTTP status codes (400, 403, 404) and custom errors that can occur through dedicated, user-friendly templates.
* **Dual-Strategy Server-Side Rendering (SSR):** Leverages EJS (Embedded JavaScript) templates by combining two distinct structural design patterns:
  * *Partial Inclusion:* Decouples granular, highly reusable interface segments—such as the Site Metadata, Navigation, Footer, and Operational Schedules—into isolated components to maintain a strict DRY (Don't Repeat Yourself) architecture.
  * *Master Layout Pattern:* Implements a centralized blueprint framework that orchestrates global HTML5 boilerplate configurations, dynamically injecting page-specific views into a unified metadata and asset wrapper.
* **Automated Asset Management Pipeline:** Integrates a native file system monitor (`fs.watch()`) that tracks modifications within SASS files. The pipeline compiles stylesheets on-the-fly and creates timestamped structural backups in a distinct `/backup` directory to guarantee operational recovery.
* **Data-Driven Static Gallery Node:** Integrates a structured image gallery powered by an external `galerie.json` data store. The server dynamically parses the payload to generate layout components, decoupling the presentation layer from hardcoded media assets.
---
### 2. Frontend Engineering & Responsive Layout Systems
* **Semantic Layout Design:** Employs advanced CSS Grid architectures governed by precise `grid-template-areas`. The presentation layer scales predictably from multi-column desktop arrangements down to tablet views, fully linearizing into a single-column layout for mobile form factors.
* **SASS and System Customization:** Extends and overrides core Bootstrap 5 configuration layers (breakpoints, utilities, border radii, and typographic matrices) through custom SASS variables to adhere strictly to a predefined 5-color aesthetic constraint.
* **Stateful Theme Engine:** Implements a native client-side script that toggles visual states by altering CSS custom properties and updating iconography. State synchronization persists across browsing sessions using synchronous `localStorage` caching.
* **Media Handling and Performance Optimizations:** Native HTML5 video components feature multi-language subtitle track integrations via VTT targets. Media resources are pre-processed server-side utilizing the `sharp` library to feed structural, high-efficiency `<picture>` tags tailored to specific screen resolutions.
---
### 3. Relational Database & Query Engineering
* **Database Modeling:** Layered over a relational PostgreSQL data model utilizing normalized schemas, explicitly configured ENUM datatypes, structured timestamps, and multi-value parameters.
* **Algorithmic Search and Multi-Criteria Filtering:**
  * Features a fuzzy text search engine implementing a fault-tolerant parsing scheme with a maximum threshold deviation of two characters.
  * Formulates boolean evaluation matrices combining nested Checkbox and Radio input nodes to execute strict relational state filtration.
  * Incorporates a dual-handle continuous range input slider for the scalar pricing bounds.
* **Multi-Key Sorting Module:** Implements a custom sorting algorithm capable of simultaneously parsing distinct attributes, enabling complex hierarchical prioritization (e.g., compounding specific computational coefficients against structural subcategories).
* **Inter-Session Component Tracking:** Leverages `sessionStorage` layers to cache user viewport modifications, giving users the ability to temporarily suppress or isolate specific data objects in real-time.
* **Many-to-Many Product Bundling System (Seturi):** * Implements a normalized relational schema utilizing an intersection table (`asociere_set`) to map complex Many-to-Many associations between base products and composite promotional kits (`seturi`).
  * Features an algorithmic pricing model that dynamically aggregates individual product rates and computes a non-linear scaling discount derived from the formula: $min(5, n) \times 5\%$, where $n$ represents the total quantity of encapsulated entities.
  * Provides bidirectional view routing: a dedicated catalog displays available bundles with deep-linking directly to specific item profiles, while individual product pages dynamically list all composite sets they intersect with.
---
### 4. Security, Compliance, and Auxiliary Systems
* **State Management for Compliance:** Implements an animated GDPR-compliant data usage banner. Visual changes are driven through hardware-accelerated CSS opacity and scaling transformations, while underlying consensus state is handled via short-expiry cookie management.
* **Strict Print Rendering Pipeline:** Employs a dedicated `@media print` stylesheet optimized for standard document printing. The layout strips navigation artifacts and promotional graphics, enforces explicit page-break boundaries, transforms interactive hyperlinks into textual URI citations, and injects an un-spoofable developer identity watermark.
---
### 5. Automated Promotional Systems & State Synchronicity
* **Asynchronous Time-Interval Event Loop (Oferte):**
  * Implements an asynchronous event loop that evaluates system state at a specific interval ($T$). The engine queries the relational database to fetch distinct, programmatically valid inventory categories and generates a temporary discount coefficient from a static scalar matrix (ranging from 5% to 50%).
  * Enforces business-logic constraints preventing consecutive promotional cycles for identical product classes.
* **Persistent Local Cache Eviction & Garbage Collection:** Actively manages a flat-file JSON buffer (`oferte.json`) using a First-In, First-Out (FIFO) pipeline to inject new campaigns. Implements a continuous data eviction routine (Garbage Collection) governed by a secondary threshold ($T_2$) to dynamically purge obsolete, expired campaigns.
* **Real-Time Client Synchronization & Edge UI Feedback:**
  * *Dynamic Price Derivation:* On the product indexing views, active promotional categories trigger runtime overrides that visually strike out original base values and render mathematically derived, discounted prices based on active JSON state.
  * *Asynchronous Countdown Clock:* The landing page features a low-latency JavaScript countdown timer that polls and recalculates active campaign expiration states every second ($1000ms$). 
  * *Critical Threshold State Shifts:* Transitions into a critical state during the final 10 seconds of a campaign lifecycle, modifying the DOM tree structure to alter CSS color values or trigger auditory alerts before executing an instantaneous view refresh upon expiration.

---

## Technology Stack and System Dependencies

* **Runtime Environment & Server Core:** Node.js, Express.js
* **Template Engine:** EJS (Embedded JavaScript)
* **Data Layer:** PostgreSQL / Relational SQL Core, JSON flat-file data buffers (`oferte.json`, `galerie.json`, `erori.json`)
* **Presentation Layers:** HTML5 (Semantic Structure), CSS3 (Custom Variables, Grid, Flexbox Layouts), SASS/SCSS (Modular Mixins, Loops, Declarative Nesting), Bootstrap 5
* **Primary Dependencies:** `express`, `sass`, `sharp`, `pg`, `path`, `fs`

---

## Deployment and Installation Guide

Follow these steps to provision dependencies and initialize the application environment locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/ilinca13/web-dev-BeautyHub-site.git](https://github.com/ilinca13/web-dev-BeautyHub-site.git)
cd web-dev-BeautyHub-site
```
2. Install Dependencies
```bash
npm install
```
3. Database Connection Configuration

The application layer does not auto-initialize relational table structures or roles.
>[!IMPORTANT]
> Before booting the environment, you must log into your local PostgreSQL instance and execute the structural initialization script (or restore your schema backup) using the following parameters:
>
>* Database Name: proiect_beauty_hub
>
>* Role / User: beauty_hub_admin
>
>* Password: beauty_hub
```bash
JavaScript
const client = new pg.Client({
    database: "proiect_beauty_hub",
    user: "beauty_hub_admin",
    password: "beauty_hub",
    host: "localhost",
    port: 5432
});
```
4. Initialize the Server Infrastructure
```bash
node index.js
```
5. Access the Application
Once the initialization routine logs a successful launch, open a secure browser instance and navigate to the local testing gateway:
```bash
http://localhost:8080
```
