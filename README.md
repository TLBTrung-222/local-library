# express-locallibrary-tutorial

Tutorial "Local Library" website written in in Node/Express.

---

This web application creates an online catalog for a small local library, where users can browse available books and manage their accounts.

![A UML diagram showing the relation of database entities in this example repository](https://raw.githubusercontent.com/mdn/express-locallibrary-tutorial/main/public/images/Library%20Website%20-%20Mongoose_Express.png)

For more information see the associated [MDN tutorial home page](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website).

> **Note** The [auth branch](/../../tree/auth) in this repository implements an _unsupported_ and _undocumented_ version of the library with User Authentication and Authorization. This may be a useful starting point for some users.

## Quick Start

To get this project up and running locally on your computer:

1. Set up a [Node.js](https://wiki.developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/development_environment) development environment.
2. Once you have node setup install the project in the root of your clone of this repo:

    ```bash
    npm install
    ```

3. Run the tutorial server, using the appropriate command line shell for your environment:

    ```bash
    # Linux terminal
    DEBUG=express-locallibrary-tutorial:* npm run devstart

    # Windows Powershell
    $ENV:DEBUG = "express-locallibrary-tutorial:*"; npm start
    ```

4. Open a browser to <http://localhost:3000/> to open the library site.

> **Note:** The library uses a default MongoDB database hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). You should use a different database for your own code experiments.

# Tech stack:

Server: Express
View engine: pug.js
Database: MongoDB
ORM: mongoose
Authentication: passport.js

# Authen learn:

1. `express-session` is the crucial things that manage sessions (both server and client side), after sending client a cookie contains sessionID, on subsequent request, it load the session base on sessionID (from our db) and inject into `req.session` => we can modify this object to decide what information will be stored back on db.

Browser Request -> Cookie with Session ID -> express-session middleware
-> MongoStore -> MongoDB -> Session Data -> req.session

Example of `req.session`

```javascript
Session {
  cookie: {
    path: '/',
    _expires: 2024-07-26T13:39:53.995Z,
    originalMaxAge: 18000000,
    httpOnly: true
  },
  passport: { user: '66a35a0c5981b9843b163146' }
}
```

2. `passport.js` utilize session that loaded from `express-session`, call `serializeUser` to add user infor (in our app, we choose only userId) to `req.session`, then later request, `deserializeUser` to turn user infor (our app use only userId) to user object (this is document from mongoose, it attached into `req.user`)
   => our app can access to user base on the session he provided.

Example of `req.user`:

```javascript
{
  _id: new ObjectId('66a35a0c5981b9843b163146'),
  username: 'thanhhien',
  hash: '...',
  role: 0,
  fullname: '...',
  email: '...',
  salt: '...',
  __v: 0
}
```

Note that for simple username and password authen, we can just use `express-session` (by attach user infor to `req.session` object)

# express-session vs passport.js

You're mostly correct in your understanding of the roles of `express-session` and Passport.js, but let's clarify and expand on a few key points to give you a complete picture:

### `express-session`

-   **Purpose:**

    -   `express-session` is responsible for managing user sessions. It stores session data on the server, typically in a database or memory store, and sets a session cookie on the client to track the session ID.

-   **Session Management:**

    -   It provides a `req.session` object, which you can use to store and retrieve session-specific data. This is often used to store user IDs or other information needed to maintain the state of a user's session across requests.

-   **Use Case:**
    -   It is used for maintaining state and data persistence between requests, but it doesn't inherently handle authentication.

### Passport.js

-   **Purpose:**

    -   Passport.js is an authentication middleware for Node.js. It works in conjunction with `express-session` to provide a higher-level abstraction for managing user authentication and sessions.

-   **User Authentication:**

    -   Passport.js simplifies the process of authenticating users by providing strategies for different types of authentication (e.g., local, OAuth, JWT). It handles the process of checking credentials and determining whether a user is authenticated.

-   **`req.user` Object:**

    -   When a user is authenticated, Passport.js creates a `req.user` object that contains the user's information (as specified in `serializeUser` and `deserializeUser`). This object is added to the request automatically and represents the currently authenticated user.

-   **Advantages:**
    -   Using `req.user` allows you to easily access user information without needing to query the database on each request, as the user details are retrieved from the session.

### How They Work Together

-   **Session Storage:**

    -   `express-session` manages the storage and retrieval of session data. It is typically used to store the serialized user identifier (e.g., user ID).

-   **User Representation:**
    -   Passport.js uses the session to store and retrieve the user identifier. When a user is authenticated, Passport.js serializes the user data and stores the identifier in the session. When a request is made, Passport.js deserializes this identifier to populate `req.user`.

### Example Workflow

1. **Login Request:**

    - User submits login credentials (username and password).
    - Passport.js authenticates the credentials using a strategy (e.g., `LocalStrategy`).
    - On successful authentication, Passport.js calls `serializeUser` to store the user's identifier in the session.

2. **Subsequent Requests:**

    - `express-session` retrieves the session data using the session ID stored in the client's cookie.
    - Passport.js uses the session data to call `deserializeUser`, which retrieves user details from the database and populates `req.user`.

3. **Access Control:**
    - In route handlers, you can use `req.isAuthenticated()` to check if a user is logged in and `req.user` to access the user's information directly.

### Summary

-   **`express-session`** is responsible for managing sessions and storing session data, while **Passport.js** handles user authentication and provides an easy way to access user data via `req.user`.
-   With Passport.js, you don't have to manually query the database to get user details on every request; instead, you can rely on the `req.user` object provided by Passport.js after successful authentication.
-   Passport.js extends the capabilities of `express-session` by handling the complexity of authentication and providing a streamlined way to manage authenticated sessions.
