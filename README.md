# 🔐 TeaceLock — Smart Product Authentication & Anti-Counterfeit System

**Verify authenticity. Build trust. Fight counterfeiting.**

TeaceLock is a smart product authentication and verification platform designed to combat counterfeit products by providing a reliable way to verify product authenticity using unique product identifiers, cryptographic hashing, and QR code technology.

The platform allows manufacturers to register products, generate unique product identification codes, and create QR codes that customers can scan to verify whether a product is genuine.

By combining modern web technologies, secure hashing mechanisms, and cloud-based database management, TeaceLock aims to make product verification simple, transparent, and accessible.

---

## 🚀 Key Features

- **Product Registration:** Register products with essential details such as product name and brand.
- **Unique Product Identification:** Generate unique Product Registration/Reference IDs (PRD codes) for registered products.
- **SHA-256 Hashing:** Generate cryptographic hashes to create a digital fingerprint for product records.
- **QR Code Generation:** Generate unique QR codes linked to individual product verification pages.
- **Product Verification:** Verify products using their unique identification codes.
- **QR Code Scanning:** Scan product QR codes to access the verification interface.
- **Real-Time Database Lookup:** Retrieve registered product information through Supabase.
- **Authenticity Status:** Display verification results indicating whether a product is registered and recognized by the system.
- **Manufacturer Dashboard:** Provide an interface for managing and registering products.

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | React.js | Building the user interface |
| Build Tool | Vite | Fast development and production builds |
| Language | TypeScript | Type safety and maintainable code |
| Styling | CSS | Responsive UI and styling |
| Database | PostgreSQL | Structured product data storage |
| Backend / BaaS | Supabase | Database connectivity and backend services |
| Cryptography | SHA-256 | Generating cryptographic product hashes |
| Hashing Library | @noble/hashes | SHA-256 implementation |
| QR Generation | qrcode.react | Generating product QR codes |
| QR Scanning | html5-qrcode | Scanning QR codes |
| Routing | React Router DOM | Client-side navigation |
| Version Control | Git & GitHub | Source code management |

### Technology Highlights

**React + TypeScript**
- Component-based frontend architecture.
- Reusable UI components.
- Type-safe application development.

**Supabase + PostgreSQL**
- Cloud-hosted relational database.
- Structured product information management.
- Database integration through Supabase client libraries.

**SHA-256 Cryptography**
- Generates a cryptographic fingerprint for product information.
- Helps identify changes in the hashed data.
- Provides a foundation for future tamper-evident verification.

**QR Code Technology**
- Generates unique QR codes for registered products.
- Connects physical products to their digital verification records.
- Simplifies customer-side verification.

---

## ⚙️ How TeaceLock Works

The system follows a simple product registration and verification workflow.

1. **Product Registration:** The manufacturer enters the required product information.
2. **Unique Identification:** TeaceLock generates a unique product reference code.
3. **Hash Generation:** A SHA-256 hash is generated for the product record.
4. **QR Generation:** A QR code is generated and linked to the product's verification URL.
5. **Database Storage:** Product details and associated metadata are stored in Supabase.
6. **Customer Scanning:** A customer scans the QR code using a compatible scanner.
7. **Verification:** The application retrieves the corresponding product record from Supabase.
8. **Verification Result:** The system displays the product information and its registration status.

---

## 🏗️ System Architecture

```text
          MANUFACTURER
                |
                v
       React + TypeScript UI
                |
                v
        Product Registration
                |
          +-----+------+
          |            |
          v            v
      SHA-256      QR Code
       Hashing     Generation
          |            |
          +-----+------+
                |
                v
          Supabase API
                |
                v
          PostgreSQL DB
                |
                |
          CUSTOMER SCANS
                |
                v
         QR Code Scanner
                |
                v
        Verification Page
                |
                v
         Database Lookup
                |
                v
       Authenticity Result
```

---

## 📂 Project Structure

The following is a suggested representation of the application structure. Adjust the paths to match your actual repository.

```text
TeaceLock/
│
├── public/
│   └── assets/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Product/
│   │   ├── QRCode/
│   │   └── Verification/
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProductRegistration.tsx
│   │   └── VerifyProduct.tsx
│   │
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── utils/
│   │   └── hashing.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💻 Getting Started

Follow these instructions to run TeaceLock locally.

### Prerequisites

Make sure you have installed:

- Node.js (LTS version recommended)
- npm
- Git
- A Supabase account

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd TeaceLock
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Replace the placeholder values with your Supabase project credentials.

**Important:** Never expose your Supabase service-role or secret key in frontend code or commit sensitive credentials to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

---

## 🔒 Security & Data Integrity

TeaceLock uses several mechanisms to support product authenticity verification:

- SHA-256 cryptographic hashing for product fingerprints.
- Unique product identifiers for individual product records.
- Supabase PostgreSQL for structured data management.
- Environment variables for application configuration.
- Database-backed product verification rather than relying solely on QR code contents.

**Note:** A SHA-256 hash and a QR code alone do not prove that a physical product is genuine. Stronger protection requires secure issuance, access controls, tamper-resistant records, and safeguards against copied QR codes.

---

## 🔮 Future Enhancements

The following features are planned possibilities for expanding TeaceLock:

- [ ] Role-Based Access Control (RBAC) for manufacturers, suppliers, and administrators.
- [ ] Google Authentication with authorized administrator access.
- [ ] Product lifecycle and supply-chain tracking.
- [ ] Supplier and distributor management.
- [ ] Blockchain-based product authentication.
- [ ] Tamper-evident product history and audit logs.
- [ ] Duplicate QR code and suspicious verification detection.
- [ ] Advanced fraud detection mechanisms.
- [ ] Product recall and batch management.
- [ ] Analytics dashboard for manufacturers.

---

## 🎯 Project Objectives

1. Reduce the circulation of counterfeit products.
2. Make product verification accessible through QR codes.
3. Provide manufacturers with a digital product registration system.
4. Improve product traceability and data integrity.
5. Build a scalable foundation for secure product authentication.

---

## 👨‍💻 Development & Contributions

TeaceLock is developed as an independent project focused on combining web development, cryptography, and product authentication.

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---
