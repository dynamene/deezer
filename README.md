# PlayMo Deezer Cloud Function

Deezer API implementation

## Getting Started

- Install all dependencies `npm install`

- Create a **.env** file and add the values from **.env_example**

- Source your environment variables `source .env`

- To run functions locally `npm start`

## Routes

- **GET**

  - Endpoint: `/?link=tidal_playlist_link`

- **DELETE**

  - Endpoint: `/?link=tidal_playlist_link`

- **POST**

  - Endpoint: `/`

  - Body:

    ```json
    {
      "name": "string", // The playlist name
      "description": "string", // The playlist description
      // List of tracks to add to playlist. Maximum of 10 tracks.
      "tracks": [
        {
          "title": "string", // Track title
          "artist": "string", // Track artist
          "album": "string", // Track album
          "contributors": ["string"], // Track contributors. Must have atleast one value i.e. the track artist
          "duration": "integer" // The track duration in seconds
        }
      ]
    }
    ```

### How to Get Deezer Token

- Visit [developers.deezer.com](https://developers.deezer.com)

- Click **MyApps** and then **Create a new Application**

- Fill in the following details

  - Name: Whatever you want to name your app

  - Domain: <http://localhost.com>

    - **It doesn't have to be a valid domain**

  - Redirect URL after authentication: <http://localhost:3000>

    - **Make this <http://localhost:3000>**

  - Link to your Terms of Use: <http://localhost.com/terms>

    - **Again this doesn't have to be a valid link**

  - Description: Some short description.

- Accept the terms and create the app

- Visit <https://connect.deezer.com/oauth/auth.php?app_id=YOUR_APP_ID&redirect_uri=http://localhost:3000&perms=basic_access,email,offline_access,manage_library,delete_library> after replacing **YOUR_APP_ID** with the one Deezer created for your app.

- After accespting you will redirected to **<http://localhost:3000/?code=SOME_SORT_OF_TOKEN>**. Copy the code and paste it somewhere.

- Now visit <https://connect.deezer.com/oauth/access_token.php?app_id=YOU_APP_ID&secret=YOU_APP_SECRET&code=THE_CODE_FROM_ABOVE>. Fill in the APP_ID, APP_SECRET_KEY and the code from above

- You will recieve your access_token
