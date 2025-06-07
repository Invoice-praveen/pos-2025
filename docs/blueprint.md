# **App Name**: OrderFlow

## Description:
OrderFlow is a comprehensive point-of-sale (POS) system designed to streamline sales transactions, manage inventory, track customer interactions, and provide valuable business insights through a real-time dashboard. It supports various payment methods and allows for the management of both products and services.

## Core Features:

- Sales Interface: Simple interface for sales transactions, supporting multiple items, discounts, and taxes.
- Inventory Lookup: Basic product catalog management with categories and variants.
- Customer Profiles: Manage customer information and track their purchase history. This includes recording contact details and a history of transactions.
- Services: Track and manage services offered, differentiating between free and paid services. This allows for better service performance analysis.
- Payment Processing: Payment processing with cash, credit/debit cards, and bank transfer support.
- Real-time dashboard: Real-time dashboard with key metrics: sales, top products.

## Application Workflow:

1.  **Sales Transaction Initiation:** A new sale is initiated through the Sales Interface.
2.  **Item Selection:** Products and/or services are added to the transaction using the Inventory Lookup or Services management.
3.  **Customer Association (Optional):** An existing customer profile can be associated with the sale, or a new profile can be created. This links the sale to a specific customer for history tracking.
4.  **Discounts and Taxes (Optional):** Applicable discounts and taxes are applied to the transaction.
5.  **Payment Processing:** The customer completes the payment using one of the supported payment methods (cash, card, bank transfer).
6.  **Transaction Completion:** The sale is finalized, updating inventory levels (for products) and the customer's purchase history.
7.  **Data Visualization:** The Real-time Dashboard is updated with the new sales data, providing instant insights into business performance.
8.  **Inventory Management:** Products are added, updated, or removed through the Inventory Lookup. Categories and variants are managed here.
9.  **Customer Management:** Customer profiles are created, updated, or viewed, including their purchase history.
10. **Service Management:** Services are defined and managed, including their type (free/paid).
11. **Reporting:** The dashboard provides key metrics for sales performance and top-selling items.


## Style Guidelines:

-   Theme: Dark mode with a red and black color scheme.
-   Primary color: Red (specific shade used in `src/app/globals.css` for accents and highlights).
-   Background colors: Variations of black and dark gray for the main background and panels.
-   Text color: Light gray or white for readability against the dark background.
-   Body and headline font: 'Inter' sans-serif, or a similar modern sans-serif font for a clean look.
-   Icons: Simple, professional icons that complement the dark theme.
-   Layout: Clean and intuitive, optimized for quick access to features in a potentially low-light environment (common for POS systems).

## Architecture Diagram (Conceptual):

The application follows a client-server architecture:

-   **Frontend:** Built with Next.js and React, responsible for the user interface and interacting with the backend.
-   **Backend:** Likely uses Firebase services for authentication, database (Firestore), and potentially other functions. There is also an indication of AI integration using Genkit.
-   **Database:** Firestore is used for storing application data like sales, inventory, customers, etc.
-   **External Services:** Firebase for various backend functionalities and Genkit for potential AI features.

## Completed Features:

Based on the file structure and names, the following features appear to be implemented:

-   Sales Interface (likely with support for multiple items, discounts, and taxes)
-   Inventory Management (including product catalog, categories, and variants)
-   Customer Profile Management (with purchase history)
-   Service Tracking (free/paid)
-   Payment Processing (cash, card, bank transfer)
-   Real-time Dashboard (displaying sales and top products)
-   User Authentication (suggested by `AuthContext.tsx`)
-   Basic UI components (from the `components/ui` directory)

## Todo:

-   Implement more robust error handling and validation across all features.
-   Write comprehensive unit and integration tests.
-   Optimize performance for large datasets, especially in inventory and sales history.
-   Add advanced reporting and analytics features to the dashboard.
-   Explore and fully integrate AI features using Genkit (e.g., sales forecasting, personalized recommendations).
-   Improve UI/UX based on user feedback.
-   Implement a more detailed and granular permission system.
-   Add support for different currencies and tax regulations.
-   Develop a clear deployment strategy and documentation.

## Known Bugs:

-   Potential edge cases in data handling may not be fully covered by existing error handling.
-   Performance might degrade with a large number of records in the database.
-   Comprehensive testing is needed to identify and address potential bugs.

## .env Variables:

Based on typical Firebase configurations and the presence of AI features, the following environment variables are likely required:

-   `FIREBASE_API_KEY`
-   `FIREBASE_AUTH_DOMAIN`
-   `FIREBASE_PROJECT_ID`
-   `FIREBASE_STORAGE_BUCKET`
-   `FIREBASE_MESSAGING_SENDER_ID`
-   `FIREBASE_APP_ID`
-   `FIREBASE_MEASUREMENT_ID`
-   `GENKIT_API_KEY` (or similar for AI integration)
-   Other potential variables for external service configurations.
