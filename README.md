<div align="center">
    <h1>TradeTicker</h1>
    <p>
        A Modern Web Application for Tracking Stock Prices with a Customisable Watchlist.
    </p>
    <p>
        <a href="#live-preview">Live Preview</a>
        •
        <a href="#installation">Installation</a>
        •
        <a href="#usage">Usage</a>
        •
        <a href="#limitations">Limitations</a>
        •
        <a href="#roadmap">Roadmap</a>
    </p>
</div>

---

## Live Preview

**[Live Demo](https://projects.samir.cx/TradeTicker/?utm_source=github&utm_medium=social&utm_campaign=repo&utm_content=readme 'TradeTicker Live Preview')**  
Check Out a Live Application to Experience the Features of **TradeTicker** for Yourself!

---

## Features

- **Real-Time Stock Tracking**: Monitor Price Updates.
- **Customisable Watchlist**: Organise & Yrack your Preferred Stocks.
- **Secure User Accounts**: With Enhanced Data Protection.

---

## Tech-Stack

**TradeTicker** is Built with the Following Technologies:

- **Back-End**: [Express.JS](https://expressjs.com) (In TypeScript)
- **Front-End**: [TailwindCSS](https://tailwindcss.com), [jQuery](https://jquery.com), & [Chart.js](https://www.chartjs.org)
- **Database**: [MySQL](https://www.mysql.com/) with Stored Procedures & SQL Injection Prevention

- **Authentication**:
    - JWT-Based Cookies for Session Management
    - Password Hashing with Salting & Peppering
    - Middleware for Validation & Security
- **Human Verification**: [hCaptcha](https://www.hcaptcha.com)
- **Code Structure**: Modular & Organised Codebase for Scalability

---

## Installation

> [!IMPORTANT]
> Ensure You Have the Following Prerequisites Installed on Your System:
>
> - **Node.JS** (v16.x or Higher): [Download Node.js](https://nodejs.org 'Node.JS Download')
> - **Yarn** (v1): [Installation Guide](https://classic.yarnpkg.com/en/docs/install 'Yarn Installation')

### Steps to Install

1. Clone the Repository:

    ```bash
    git clone https://github.com/04Samir/TradeTicker.git
    cd TradeTicker
    ```

2. Install Dependencies:

    ```bash
    yarn install
    ```

3. Set-Up Environment Variables:
   Create a `.env` File in the Project Root & Populate it With the Following Variables:

    ```plaintext
    BASE_PATH=[OPTIONAL-RELATIVE-PATH]
    LOCAL_URL=<LOCAL-API-URL>
    PORT=<LOCAL-PORT>

    DB_USER=<MYSQL-DB-USER>
    DB_PASSWORD=<MYSQL-DB-PASSWORD>

    ACCESS_SECRET=<JWT-ACCESS-SECRET>
    REFRESH_SECRET=<JWT-REFRESH-SECRET>
    SESSION_SECRET=<SESSION-SECRET>

    AUTH_PEPPER=<AUTH-PEPPER>

    HCAPTCHA_SECRET=<HCAPTCHA-SECRET>
    APCA_API_KEY_ID=<ALPACA-API-KEY-ID>
    APCA_API_SECRET_KEY=<ALPACA-API-SECRET-KEY>
    ```

    - hCaptcha Secret: [Sign Up & Get your Free hCaptcha Secret Here](https://www.hcaptcha.com).
    - Alpaca Markets API Keys: [Sign Up & Get your Free API Keys Here](https://alpaca.markets).

4. Initialise the Database:
   Use the Provided Schema File to Create the Necessary Tables:
    ```bash
    mysql -u <DB_USER> -p < source src/database/schema.sql
    ```

---

## Usage

> [!TIP]
> The Following Scripts are Available for Managing the Project:
>
> - **Development Server**: Launches the App in Development Mode with Hot-Reloading.
>     ```bash
>     yarn dev
>     ```
> - **Build for Production**: Compiles the Project into an Optimised Build for Production.
>     ```bash
>     yarn build
>     ```
> - **Start Production Server**: Runs the Compiled Production Build.
>     ```bash
>     yarn start
>     ```

---

## License

This Project is Licensed Under the GNU General Public License v3.0.  
See the [LICENSE](LICENSE 'License') File for Details.

---

## Limitations

While **TradeTicker** Provides Robust Features for Stock Tracking, There are Some Current Limitations to be Aware of:

- **Slow Fetching**: Data Retrieval May be Slow Due to Current API Rate Limits, Especially when Multiple Users are Online.
- **Limited Market Coverage**:
    - Currently Only Supports US Stocks & Cryptocurrencies.
    - Does Not Include Global Markets, Forex, or Futures etc.
- **Data Availability**: Some Lesser-Known Stocks or Assets May Not be Available via the Current API.

> **Planned Improvements**: Check the [Roadmap](#roadmap) Section for Upcoming Enhancements Addressing These Limitations.

---

## Roadmap

Planned Updates & Improvements for **TradeTicker**:

- [ ] Migrate to a Better Stock API for Reduced Rate Limits & More Comprehensive Data.
- [ ] Update the UI to a More Modern Design.
- [ ] Optimise the Build Process by Possibly Utilising **Gulp** for Task Automation.
- [ ] Add Support for Advanced Stock Data Visualisations (e.g. Candle-Stick Charts).
- [ ] Migrate the Database to **PostgreSQL** for Enhanced Performance & Security.

---
