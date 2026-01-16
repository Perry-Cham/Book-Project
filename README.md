# Book-Project Backend

A Node.js backend API for a reading and studying helper web application. This API manages books, user accounts, reading goals, study timetables, and supports file uploads for eBooks (PDF/EPUB).

## Features

- **User Authentication**: Sign up, sign in with JWT tokens
- **Book Management**: Browse books, save books, manage current reading list
- **Reading Progress Tracking**: Track pages read, reading history, goals
- **File Sync**: Upload and sync PDF/EPUB files using GridFS
- **Study Tools**: Create timetables and study goals
- **Session Management**: Express sessions with MongoDB store

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, express-jwt
- **File Storage**: GridFS for eBook files
- **Session Store**: connect-mongo
- **Utilities**: date-fns, axios, multer, bcryptjs

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Book-Project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB:
   - Install MongoDB locally or use a cloud service like MongoDB Atlas
   - Ensure MongoDB is running

4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/bookproject
   JWT_KEY=your-jwt-secret-key
   SESSION_KEY=your-session-secret-key
   NODE_ENV=development
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on the specified PORT (default: 3000).

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `JWT_KEY`: Secret key for JWT token signing
- `SESSION_KEY`: Secret key for session management
- `NODE_ENV`: Environment mode (development/production)

## API Endpoints

### Authentication
- `POST /signup` - Create new user account
- `POST /signin` - Authenticate user
- `GET /getsession` - Get current session info
- `GET /logout` - Destroy session

### Books
- `GET /allBooks` - Get all books
- `GET /download/:id` - Get book metadata
- `GET /download/file/:id` - Download book file or redirect to external source
- `GET /download/current/file/:id` - Download user's current book file
- `POST /saveBook/:id` - Save book to user's saved list
- `POST /setcurrentbook` - Add book to current reading list
- `POST /setcurrentpage` - Update reading progress
- `POST /addcustombook` - Add custom book with Open Library integration
- `DELETE /deletecurrent/:id` - Remove book from current list
- `DELETE /deletesaved/:id` - Remove book from saved list

### Goals
- `GET /getgoal` - Get user's reading goal
- `POST /setgoal` - Create reading goal
- `DELETE /deletegoal/:id` - Delete reading goal

### Study
- `GET /gettimetable` - Get study timetable
- `GET /getstudygoal` - Get study goals
- `POST /settimetable` - Set study timetable
- `POST /setstudygoal` - Set study goal
- `PATCH /deletetimetable` - Clear timetable
- `PATCH /deletestudygoal` - Delete study goal
- `PATCH /completegoal` - Mark study goal complete
- `PATCH /addstudytopic` - Add topic to study goal

### File Sync
- `PATCH /syncbooks` - Upload and sync eBook files
- `PATCH /syncpages` - Sync reading progress for synced books

### User Management
- `DELETE /deleteuser` - Delete user account

### History
- `GET /gethistory` - Get reading history

## Data Models

### User
```javascript
{
  name: String,
  password: String,
  savedBooks: [ObjectId], // References to Book
  currentBooks: [{
    title: String,
    cover: String,
    pageCount: Number,
    page: Number,
    mainBook: ObjectId, // Reference to Book
    fileType: String,
    epubcfi: String,
    progress: Number,
    synced: Boolean,
    file: {
      provider: String,
      bucket: String,
      key: String,
      url: String,
      contentType: String,
      size: Number,
      etag: String,
      uploadedAt: Date,
      metadata: Object
    }
  }],
  readBooks: [ObjectId], // References to Book
  history: Array,
  goals: [ObjectId] // References to Goal
}
```

### Book
Flexible schema stored in "books" collection.

### Goal
```javascript
{
  userId: ObjectId, // Reference to User
  type: String,
  hasStreak: Boolean,
  streakLength: Number,
  numberOfBooks: Number,
  duration: Number,
  progress: Number,
  booksRead: Array,
  startDate: Date,
  endDate: Date,
  complete: Boolean
}
```

### StudyInfo
```javascript
{
  userId: ObjectId, // Reference to User
  timetable: Array,
  goals: Array
}
```

## Usage

1. **User Registration/Login**: Use `/signup` and `/signin` endpoints to create accounts and authenticate.

2. **Book Management**:
   - Browse available books with `/allBooks`
   - Save interesting books with `/saveBook/:id`
   - Start reading by adding to current books with `/setcurrentbook`
   - Track progress with `/setcurrentpage`

3. **Reading Goals**: Set and track reading goals using the goals endpoints.

4. **File Sync**: Upload eBook files (PDF/EPUB) using `/syncbooks` to sync them with the app.

5. **Study Tools**: Create timetables and set study goals for academic purposes.

## CORS Configuration

The API allows requests from:
- `http://localhost:5173` (typical Vite dev server)
- `https://ps-books.netlify.app`

Credentials are enabled for session management.

## File Upload

- Uses Multer for handling multipart/form-data
- Files are stored in MongoDB GridFS
- Supports PDF and EPUB formats
- Metadata is stored with file information

## Error Handling

- Standard HTTP status codes (200, 400, 404, 500)
- JSON error responses with descriptive messages
- Console logging for debugging

## Security

- JWT authentication for protected routes
- Session management with secure cookies
- CORS restrictions
- Password storage (note: currently plain text - consider hashing with bcryptjs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.