# chat-app-backend
Overview of `authController.js`

The `authController.js` is responsible for handling user authentication and related operations. It includes features like user registration, login, password reset, token management, and logout. Below is a breakdown of its components:

1. Rate Limiting: 
   - Implements rate limiting for login and password reset attempts to prevent abuse.
   - `loginLimiter` and `forgotPasswordLimiter` are middlewares that restrict the number of requests from a single IP address within a specified time window.

2. JWT Management:
   - `generateToken`: Creates JWT tokens with a specified expiration time.
   - Uses environment variables to configure token expiration (`JWT_EXPIRE`, `JWT_REFRESH_EXPIRE`).

3. User Registration(`register`):
   - Registers a new user after validating that the required fields are provided and ensuring the user does not already exist.
   - Stores the user in the database with a hashed password.

4. User Login (`login`):
   - Authenticates users based on email and password.
   - Uses JWT to generate access and refresh tokens.
   - Stores the refresh token in a secure HTTP-only cookie.

5. Forgot Password (`forgotPassword`):
   - Generates a temporary reset token (JWT) for the user to reset their password.

6. Reset Password (`resetPassword`):
   - Allows users to reset their password using a valid reset token.

7. Refresh Token (`refreshToken`):
   - Issues a new access token based on a valid refresh token.

8. Logout (`logout`):
   - Clears the refresh token cookie to log the user out.

Testing the `authController.js` with Postman

1. User Registration

- URL: `{{BASE_URL}}/auth/register`
- Method: `POST`
- Headers: 
  - `Content-Type`: `application/json`
- Body: 'json'
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  
- Expected Response:
  - Status: `201 Created`
  - Body: 'json'
    {
      "message": "User registered successfully"
    }
    
![Screenshot (105)](https://github.com/user-attachments/assets/7bc42d26-b625-41e8-8421-24ebfe014efd)


2. User Login**

- **URL**: `{{BASE_URL}}/auth/login`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "accessToken": "your_jwt_token_here"
    }
    ```
  - **Cookies**: 
    - `refreshToken`: The refresh token stored as an HTTP-only cookie.

![Screenshot (108)](https://github.com/user-attachments/assets/14760761-d8ac-4d87-a0b2-0ea9745f1926)


#### 3. **Forgot Password**

- **URL**: `{{BASE_URL}}/auth/forgot-password`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "email": "test@example.com"
  }
  ```
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "resetToken": "temporary_jwt_reset_token"
    }
    ```

![Screenshot (109)](https://github.com/user-attachments/assets/a5fb309c-183c-4725-b40f-48c56d724ae6)


#### 4. **Reset Password**

- **URL**: `{{BASE_URL}}/auth/reset-password`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "resetToken": "temporary_jwt_reset_token",
    "newPassword": "newpassword123"
  }
  ```
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Password reset successfully"
    }
    ```

![Screenshot (110)](https://github.com/user-attachments/assets/caf1297d-e88b-4882-b640-046e206ab767)


#### 5. **Refresh Token**

- **URL**: `{{BASE_URL}}/auth/refresh-token`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
- **Cookies**:
  - `refreshToken`: Set by the login request.
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "accessToken": "new_jwt_access_token"
    }
    ```

#### 6. **Logout**

- **URL**: `{{BASE_URL}}/auth/logout`
- **Method**: `POST`
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```
  - **Cookies**: The `refreshToken` cookie should be cleared.

#### `friendController.js`
This file contains the logic for managing friend-related operations, such as sending friend requests, accepting/rejecting requests, removing friends, retrieving friends, and more. Each function interacts with the `User`, `Friend`, and `Notification` models to handle the necessary database operations. Here's a breakdown of the key functions:

1. **sendFriendRequest**: Sends a friend request to another user by their username. It checks if the users are already friends or if a friend request has already been sent or received. If all checks pass, it creates a new `Friend` document with a "pending" status and sends a notification to the recipient.

2. **acceptFriendRequest**: Accepts a friend request by updating the `Friend` document's status from "pending" to "accepted" and creates a reciprocal friendship. It also sends a notification to the sender of the original friend request.

3. **rejectFriendRequest**: Rejects a friend request by updating the `Friend` document's status to "rejected" and sends a notification to the sender.

4. **removeFriend**: Removes a friend by deleting the `Friend` documents that represent the friendship between the two users. It also decrements the friend count for both users and sends a notification.

5. **getFriendRequests**: Retrieves all pending friend requests that the authenticated user has received, populating the username of the sender.

6. **getAllFriends**: Retrieves all friends of the authenticated user, ensuring no duplicate friends are returned.

7. **getMutualFriends**: Retrieves mutual friends between the authenticated user and another user by their username.

8. **getFriendsOfFriends**: Retrieves friends who are friends of the authenticated user's friends, excluding direct friends of the user.

9. **getFriendCount**: Retrieves the total number of friends the authenticated user has.

#### `friendRoutes.js`
This file defines the routes that map HTTP requests to the corresponding controller functions in `friendController.js`. These routes are protected by `authMiddleware.protectRoute`, meaning only authenticated users can access them.

- **POST `/request`**: Send a friend request.
- **GET `/requests`**: Get all friend requests.
- **POST `/accept`**: Accept a friend request.
- **POST `/reject`**: Reject a friend request.
- **DELETE `/remove`**: Remove a friend.
- **GET `/all`**: Get all friends.
- **GET `/mutual/:friendUsername`**: Get mutual friends with another user.
- **GET `/friends-of-friends`**: Get friends of the user's friends.
- **GET `/count`**: Get friend count.

### Testing the API Using Postman

1. **Start the Server**: Ensure your server is running locally by executing `node server.js` or `npm start`.

2. **Postman Setup**:
   - **Base URL**: `http://localhost:5000` (adjust the port if necessary).

3. **Authentication**:
   - First, you need to log in or register a user via your `/auth/login` or `/auth/register` endpoint.
   - Use the returned token in the `Authorization` header for subsequent requests:
     ```plaintext
     Authorization: Bearer <your_jwt_token>
     ```

4. **Sending a Friend Request**:
   - **Method**: POST
   - **URL**: `/friends/request`
   - **Body** (JSON):
     ```json
     {
       "username": "friendUsername"
     }
     ```

![Screenshot (111)](https://github.com/user-attachments/assets/fa1774e3-ecaa-40ed-b9fa-475eab101ffd)



5. **Getting All Friend Requests**:
   - **Method**: GET
   - **URL**: `/friends/requests`

![Screenshot (112)](https://github.com/user-attachments/assets/e0e033c1-0cb3-488e-886e-70aa9d56c80e)

6. **Accepting a Friend Request**:
   - **Method**: POST
   - **URL**: `/friends/accept`
   - **Body** (JSON):
     ```json
     {
       "username": "friendUsername"
     }
     ```

![Screenshot (113)](https://github.com/user-attachments/assets/f446547c-3376-4af6-ba63-2eda669e8b00)


7. **Rejecting a Friend Request**:
   - **Method**: POST
   - **URL**: `/friends/reject`
   - **Body** (JSON):
     ```json
     {
       "username": "friendUsername"
     }
     ```

![Screenshot (114)](https://github.com/user-attachments/assets/7f1e93b7-bc31-48f3-b75f-f961b4cf79d3)


8. **Removing a Friend**:
   - **Method**: DELETE
   - **URL**: `/friends/remove`
   - **Body** (JSON):
     ```json
     {
       "username": "friendUsername"
     }
     ```

9. **Getting All Friends**:
   - **Method**: GET
   - **URL**: `/friends/all`

![Screenshot (115)](https://github.com/user-attachments/assets/5c267c75-287b-4a13-b120-d1bcdce27c0c)

10. **Getting Mutual Friends**:
    - **Method**: GET
    - **URL**: `/friends/mutual/:friendUsername`

![Screenshot (123)](https://github.com/user-attachments/assets/376ed822-319d-4367-a42e-e921ee34c68e)


11. **Getting Friends of Friends**:
    - **Method**: GET
    - **URL**: `/friends/friends-of-friends`

![Screenshot (124)](https://github.com/user-attachments/assets/12a7d9c2-cf8e-42f4-9394-ebdca4abfa0a)

12. **Getting Friend Count**:
    - **Method**: GET
    - **URL**: `/friends/count`

![Screenshot (125)](https://github.com/user-attachments/assets/c0063c92-3f95-491e-8508-2a9d09c26483)


**Group Controller (`groupController.js`)**
   - This file contains the logic for handling group-related operations such as creating a group, updating a group, deleting a group, and adding members to a group.
   - It includes several helper functions and main controller functions to perform these operations.

**Key Features:**
   - **Creating a Group (`createGroup`)**: 
     - Validates the group name and members.
     - Ensures all group members are friends of the group creator.
     - Adds the creator to the group if not already included.
     - Saves the group and sends notifications to all members about the creation.
   
   - **Getting Groups (`getGroups`)**:
     - Retrieves all groups the current user is a member of or fetches a specific group by name.
     - Formats the group data before sending it to the client.
   
   - **Updating a Group (`updateGroup`)**:
     - Allows the group creator to update the group name or members.
     - Ensures all new members are friends of the creator.
     - Sends notifications to all group members about the update.
   
   - **Deleting a Group (`deleteGroup`)**:
     - Deletes a group by name and sends notifications to all members about the deletion.
   
   - **Exiting a Group (`exitGroup`)**:
     - Allows a user to exit a group.
     - If the user is the creator and the last member, the group is deleted.
   
   - **Adding a Member to a Group (`addMemberToGroup`)**:
     - Adds a new member to an existing group if they are friends with the group creator.
     - Sends notifications to the new member and the group about the addition.

#### 2. **Group Routes (`groupRoutes.js`)**
   - This file defines the endpoints for the group-related operations in the `groupController.js`.
   - Each route is protected by `protectRoute` middleware to ensure only authenticated users can access these routes.

**Endpoints:**
   - `POST /groups`: Creates a new group.
   - `GET /groups/:identifier?`: Retrieves a specific group by name or all groups the user is a member of.
   - `PUT /groups/:identifier`: Updates a group by name.
   - `DELETE /groups/:identifier`: Deletes a group by name.
   - `POST /groups/:identifier/exit`: Allows a user to exit a group.
   - `POST /groups/:identifier/add-member`: Adds a member to a group.


### Testing Using Postman

To test the API endpoints using Postman, follow these steps:

1. **Create a New Group**
   - **Endpoint**: `POST /groups`
   - **Body (JSON)**:
     ```json
     {
       "name": "MyGroup",
       "members": ["username1", "username2"]
     }
     ```
   - **Headers**: Include an `Authorization` header with a valid JWT token.
     
![Screenshot (117)](https://github.com/user-attachments/assets/20778822-2e69-41a7-a521-5a126cbaaf29)


2. **Get All Groups or a Specific Group**
   - **Endpoint**: `GET /groups`
     - Retrieves all groups the current user is a member of.
   - **Endpoint**: `GET /groups/MyGroup`
     - Retrieves the group with the name "MyGroup".

![Screenshot (118)](https://github.com/user-attachments/assets/5234394b-f538-4109-8047-4488876f98d2)
![Screenshot (119)](https://github.com/user-attachments/assets/2b342fc9-4e3e-40dc-a13a-aa03a10878b3)

3. **Update a Group**
   - **Endpoint**: `PUT /groups/MyGroup`
   - **Body (JSON)**:
     ```json
     {
       "name": "UpdatedGroup",
       "members": ["username1", "username3"]
     }
     ```
   - **Headers**: Include an `Authorization` header with a valid JWT token.

4. **Delete a Group**
   - **Endpoint**: `DELETE /groups/MyGroup`
   - **Headers**: Include an `Authorization` header with a valid JWT token.

5. **Exit a Group**
   - **Endpoint**: `POST /groups/MyGroup/exit`
   - **Headers**: Include an `Authorization` header with a valid JWT token.

![Screenshot (120)](https://github.com/user-attachments/assets/80c8713d-1b82-4815-8044-a87a2ec3263f)


6. **Add a Member to a Group**
   - **Endpoint**: `POST /groups/MyGroup/add-member`
   - **Body (JSON)**:
     ```json
     {
       "newMemberUsername": "username4"
     }
     ```
   - **Headers**: Include an `Authorization` header with a valid JWT token.

![Screenshot (121)](https://github.com/user-attachments/assets/29e09770-ee3e-4464-b81a-c6327081ebda)

### Overview of the Message System in Your Node.js Application

Your application implements a messaging system where users can send, receive, and manage messages either directly to another user or within a group. Here's a detailed breakdown of the key components:

#### 1. **Message Model (`message.js`)**
   - **Purpose**: Defines the structure of a message document in MongoDB.
   - **Fields**:
     - `sender`: The user who sent the message.
     - `receiver`: The user who received the message (for direct messages).
     - `groupId`: The group where the message was sent (for group messages).
     - `message`: The text content of the message.
     - `file`: The URL of any file attached to the message.
     - `isGroupMessage`: A boolean indicating whether the message is sent to a group or an individual.
     - `status`: The current status of the message, which can be `sent`, `delivered`, `read`, or `deleted`.

#### 2. **Message Controller (`messageController.js`)**
   - **Purpose**: Contains the logic for sending, retrieving, updating, and deleting messages.

   **Key Functions**:
   - **`sendMessage`**: Handles sending messages with optional file attachments. It differentiates between group messages and direct messages, handles file uploads to S3, and emits the message in real-time using Socket.io. It also sends notifications to the message recipient.
   - **`getMessages`**: Retrieves messages either from a specific group or between the current user and another user. Messages are enriched with usernames and marked as read if necessary.
   - **`updateMessageStatus`**: Updates the status of a message (e.g., from `delivered` to `read`) and notifies the sender that their message was read.
   - **`deleteMessage`**: Deletes a message. If the message has been read by the recipient, it deletes it for the sender only; otherwise, it deletes the message for both sender and receiver.

#### 3. **Message Routes (`messageRoutes.js`)**
   - **Purpose**: Defines the API endpoints for the messaging system.

   **Endpoints**:
   - `POST /messages`: Sends a new message. Supports file uploads via Multer.
   - `GET /messages`: Retrieves messages for a specific conversation or group.
   - `DELETE /messages`: Deletes a message.

   **Middleware**:
   - `protectRoute`: Ensures that only authenticated users can access these routes.
   - `multer`: Handles file uploads for messages.

#### 4. **Server Setup (`server.js`)**
   - **Purpose**: Initializes and configures the Express server, connects to MongoDB, and integrates Socket.io for real-time communication.

   **Key Features**:
   - **Socket.io Integration**:
     - Handles real-time events for messages and notifications.
     - Listens for `message`, `notification`, and `message_read` events, and broadcasts these events to connected clients.
   - **Routes Setup**:
     - Sets up various routes including authentication, friends, groups, messages, notifications, posts, and user profiles.
   - **Middleware**:
     - Uses `body-parser` to handle JSON request bodies.
     - Uses `cookie-parser` to handle cookies.
     - Attaches the Socket.io instance to the request object, making it accessible in all routes.

### Testing the API Using Postman

You can test the API endpoints using Postman by following these steps:

#### 1. **Sending a Message**
   - **Endpoint**: `POST /messages`
   - **Headers**:
     - `Authorization`: `Bearer <Your JWT Token>`
   - **Body (form-data)**:
     - `message`: (Optional) The text content of the message.
     - `file`: (Optional) A file to attach to the message.
     - `isGroupMessage`: `true` or `false` (depending on whether the message is sent to a group).
     - `groupName`: (Required if `isGroupMessage` is `true`) The name of the group.
     - `receiverUsername`: (Required if `isGroupMessage` is `false`) The username of the recipient.

![Screenshot (122)](https://github.com/user-attachments/assets/4117f2c9-960d-42f6-85e5-418f02ac9894)


#### 2. **Retrieving Messages**
   - **Endpoint**: `GET /messages`
   - **Headers**:
     - `Authorization`: `Bearer <Your JWT Token>`
   - **Query Parameters**:
     - `groupName`: (Optional) The name of the group to retrieve messages from.
     - `receiverUsername`: (Optional) The username of the recipient to retrieve messages from.

#### 3. **Deleting a Message**
   - **Endpoint**: `DELETE /messages`
   - **Headers**:
     - `Authorization`: `Bearer <Your JWT Token>`
   - **Body (JSON)**:
     ```json
     {
       "messageId": "<Message ID to delete>"
     }
     ```

![Screenshot (127)](https://github.com/user-attachments/assets/55f56fea-6199-48bf-84cc-add3015ac487)


### Additional Notes
- **Real-time Communication**: Thanks to Socket.io, your application supports real-time notifications and messaging, providing a seamless user experience.
- **File Handling**: The system is capable of handling file attachments with messages, which are uploaded to S3 using the `uploadFile` utility.
- **Authorization**: The `protectRoute` middleware ensures that all messaging operations are secure and only accessible to authenticated users.

### Overview of the Notification System

#### **Notification Model**
- **Purpose:** Stores user notifications, such as likes, comments, friend requests, and messages.
- **Key Fields:**
  - `user`: References the user who received the notification.
  - `type`: Specifies the type of notification (e.g., 'like', 'comment', 'message_received').
  - `relatedId`: Stores the ID of the related entity (e.g., message, post).
  - `message`: Contains a brief description of the notification.
  - `read`: Indicates whether the notification has been read by the user.
  - **Timestamps:** Automatically stores `createdAt` and `updatedAt`.

#### **Notification Controller**
- **Functions:**
  - `getNotifications`: Retrieves all notifications for the logged-in user, sorted by the most recent.
  - `markAsRead`: Marks a specific notification as read based on its ID.

#### **Notification Routes**
- **Routes:**
  - `GET /notifications`: Retrieves all notifications for the logged-in user.
  - `PUT /notifications/:id/read`: Marks a specific notification as read.

#### **Integration with Socket.io**
- **Real-Time Updates:** Notifications are sent in real-time using Socket.io. When an event like a new message occurs, a notification is emitted to the respective user(s).

#### **Server Setup**
- **Socket.io:** Integrated with the server to handle real-time communication.
- **Middleware:**
  - `bodyParser.json()`: Parses incoming JSON requests.
  - `cookieParser()`: Parses cookies attached to client requests.
  - `req.io`: Attaches the Socket.io instance to `req` for use in controllers.
- **Database:** Connected to MongoDB using Mongoose.

### Testing the Notification API with Postman

1. **Get Notifications:**
   - **Endpoint:** `GET /notifications`
   - **Headers:**
     - `Authorization: Bearer <your_token>`
   - **Description:** Retrieves all notifications for the logged-in user.
   - **Expected Response:** A list of notifications, each with details like type, message, and whether it has been read.

![Screenshot (128)](https://github.com/user-attachments/assets/eb775f5e-fc97-44b1-9359-28836ead1e74)


2. **Mark Notification as Read:**
   - **Endpoint:** `PUT /notifications/:id/read`
   - **Headers:**
     - `Authorization: Bearer <your_token>`
   - **URL Parameters:**
     - `id`: The ID of the notification to mark as read.
   - **Description:** Marks the specified notification as read.
   - **Expected Response:** The updated notification object with `read: true`.

![Screenshot (129)](https://github.com/user-attachments/assets/e976afa4-f030-4cf1-9c0e-f862fadf9492)

### Overview

Your Node.js application is designed to handle various social media functionalities, including user authentication, friend management, group management, messaging, notifications, and posting content. The server is built using Express.js, with MongoDB as the database and Socket.io for real-time communication. Here's a breakdown of the main components:

#### 1. **PostController.js**
   - **Create a Post**: This function allows users to create posts with optional image and video uploads. The files are uploaded to S3, and the post is saved in the MongoDB database.
   - **Get Posts**: Users can retrieve posts by username or by their own user ID. The function checks the friendship status to ensure the requesting user can view the posts.
   - **Like a Post**: Users can like a post. If the post is already liked by the user, the like is not duplicated.
   - **Comment on a Post**: Users can add comments to a post. Each comment is associated with a user and a timestamp.

#### 2. **Post.js Model**
   - Defines the structure of a post, including references to the user who created it, media (image/video), caption, likes, and comments. The schema includes indexes to optimize queries.

#### 3. **PostRoutes.js**
   - Defines the API endpoints for creating posts, retrieving posts, liking posts, and commenting on posts. The routes are protected, meaning users need to be authenticated to access them.

#### 4. **Server.js**
   - The main server setup, which includes loading environment variables, connecting to MongoDB, and setting up routes for different functionalities. It also configures Socket.io for real-time notifications and messages.

### Postman Testing

Here are the Postman endpoints you can use to test your API:

1. **Create a Post**:
   - **URL**: `POST /posts`
   - **Body**: 
     - `caption`: String (optional)
     - `hideFromUsers`: Array of usernames (optional)
     - `image`: File (optional)
     - `video`: File (optional)
   - **Authorization**: Bearer Token (required)

![Screenshot (130)](https://github.com/user-attachments/assets/7c932ca8-f969-4b03-8abd-27d46fa39408)


2. **Get Posts**:
   - **URL**: `GET /posts?username={username}`
   - **Query Params**: 
     - `username`: String (optional)
   - **Authorization**: Bearer Token (required)

![Screenshot (131)](https://github.com/user-attachments/assets/f344adab-e1ea-4726-a0f3-7a47dd16ea1c)


3. **Like a Post**:
   - **URL**: `PUT /posts/like/{postId}`
   - **Authorization**: Bearer Token (required)

![Screenshot (132)](https://github.com/user-attachments/assets/dbe49c65-d80e-49c2-b4a6-c47a89e20e51)


4. **Comment on a Post**:
   - **URL**: `PUT /posts/comment/{postId}`
   - **Body**: 
     - `text`: String (required)
   - **Authorization**: Bearer Token (required)

![Screenshot (132)](https://github.com/user-attachments/assets/5a918a4f-ce11-4406-a638-dbf245a6ae8d)

### Overview of the Profile Picture Feature

Your Node.js application includes functionality for users to upload, retrieve, and manage profile pictures using AWS S3 for storage. Here's a breakdown of the main components:

#### 1. **Profile Picture Controller (`profilePicController.js`)**
   - **`uploadProfilePicture`**: 
     - This function handles the uploading of profile pictures to AWS S3.
     - It validates the user and file, then uploads the file to S3 using `aws-sdk`.
     - The S3 file URL is stored in the `ProfilePic` model and the user's profile.
   - **`getProfilePicture`**:
     - Retrieves the profile picture URL for a user by their ID.
     - If the user has a profile picture, the URL is returned; otherwise, a 404 error is sent.
   - **`getProfilePictureByUsername`**:
     - Retrieves the profile picture by the username instead of the user ID.
     - This is useful for accessing profile pictures when only the username is known.

#### 2. **Profile Picture Model (`profilePic.js`)**
   - Defines the structure for storing profile picture information, including a reference to the user and the URL of the profile picture.

#### 3. **Profile Picture Routes (`profilePicRoutes.js`)**
   - Configures routes for uploading and retrieving profile pictures:
     - `POST /profile-pictures`: Upload a new profile picture.
     - `GET /profile-pictures/:id`: Get a profile picture by user ID.
     - `GET /profile-pictures/username/:username`: Get a profile picture by username.

#### 4. **S3 Upload Utility (`s3Uploads.js`)**
   - Handles the actual uploading of files to S3.
   - Configured with AWS credentials and uploads files to a specified bucket.

### Postman Testing Setup

To test these endpoints using Postman, you can follow these instructions:

#### 1. **Upload a Profile Picture**
   - **Method**: `POST`
   - **URL**: `http://localhost:5000/profile-pictures`
   - **Authorization**: Bearer Token
   - **Body**: Form-data
     - Key: `profilePic` (Type: File)
     - Select the image file to upload.

![Screenshot (134)](https://github.com/user-attachments/assets/6bfa25f8-2f51-4dc8-aa76-045d0ce113e5)


#### 2. **Get Profile Picture by User ID**
   - **Method**: `GET`
   - **URL**: `http://localhost:5000/profile-pictures/{userId}`
   - **Authorization**: Bearer Token

![Screenshot (137)](https://github.com/user-attachments/assets/82d3320c-3501-40ab-bc91-8fb05691067f)


#### 3. **Get Profile Picture by Username**
   - **Method**: `GET`
   - **URL**: `http://localhost:5000/profile-pictures/username/{username}`
   - **Authorization**: Bearer Token

![Screenshot (136)](https://github.com/user-attachments/assets/df518c01-2364-410e-8d04-6448f887d8e7)

####  **User Controller (`userController.js`):**
   - **searchUsersByUsername**: 
     - **Purpose**: Searches for users based on a username query.
     - **Method**: `GET`
     - **Route**: `/search`
     - **Parameters**: `query` (in the query string)
     - **Response**: List of users matching the query.

   - **getProfileByUsername**: 
     - **Purpose**: Retrieves a user’s profile based on the username.
     - **Method**: `GET`
     - **Route**: `/profile/username/:username`
     - **Parameters**: `username` (in the URL path)
     - **Response**: User profile details.

   - **updateProfileByUsername**: 
     - **Purpose**: Updates a user’s profile, including their bio and profile picture.
     - **Method**: `PUT`
     - **Route**: `/profile/username/:username`
     - **Parameters**: `username` (in the URL path)
     - **Body**: `name` (optional), `bio` (optional), `profilePicture` (optional file upload)
     - **Response**: Updated user profile details.

#### 2. **User Routes (`userRoutes.js`):**
   - **Search Users by Username**
     - **Route**: `GET /search`
     - **Middleware**: `protectRoute` (authentication required)

   - **Get User Profile by Username**
     - **Route**: `GET /profile/username/:username`
     - **Middleware**: `protectRoute` (authentication required)

   - **Update User Profile by Username**
     - **Route**: `PUT /profile/username/:username`
     - **Middleware**: `protectRoute` (authentication required)
     - **File Upload**: `profilePicture` (optional)

### Postman Testing

Here’s how you can test each route using Postman:

#### 1. **Search Users by Username**

- **Method**: `GET`
- **URL**: `http://localhost:5000/search?query=yourQuery`
- **Headers**: 
  - `Authorization: Bearer <your_token>`

**Response**: List of users matching the query.

![Screenshot (138)](https://github.com/user-attachments/assets/8886cde0-50ed-49e5-9388-732b4d4ca272)

#### 2. **Get User Profile by Username**

- **Method**: `GET`
- **URL**: `http://localhost:5000/profile/username/yourUsername`
- **Headers**: 
  - `Authorization: Bearer <your_token>`

**Response**: User profile details.

![Screenshot (139)](https://github.com/user-attachments/assets/91e37c26-8f3c-463b-a0c7-dde58e9702cc)

#### 3. **Update User Profile by Username**

- **Method**: `PUT`
- **URL**: `http://localhost:5000/profile/username/yourUsername`
- **Headers**: 
  - `Authorization: Bearer <your_token>`
- **Body**: 
  - **Form-data**:
    - `name`: (optional)
    - `bio`: (optional)
    - `profilePicture`: (optional file upload)

**Response**: Updated user profile details.
![Screenshot (140)](https://github.com/user-attachments/assets/71f37017-229c-45c2-a57a-731646feeeee)

