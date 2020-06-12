const axios = require('axios');
const Joi = require('@hapi/joi');

const TOKEN = process.env.DEEZER_API_TOKEN;

function setEq(a, b) {
  if (a != b) {
    if (!a || !b) {
      return false;
    }
    for (let e of a) {
      if (!b.has(e)) {
        return false;
      }
    }
  }
  return true;
}

const getPlaylistID = (playlistLink) => {
  const arr = playlistLink.split('/');
  return arr[arr.length - 1].split('?')[0];
};

const getTracks = async (tracks) => {
  const links = tracks.map((track) => {
    return axios.get(track.link.replace('www', 'api'));
  });

  const response = await axios.all(links);
  const tracklist = [];

  for (const track of response) {
    if (track.data.error) {
      continue;
    }

    tracklist.push({
      title: track.data.title,
      artist: track.data.artist.name,
      contributors: track.data.contributors.map((artist) => artist.name),
      duration: track.data.duration,
      album: track.data.album.title,
      trackCover: track.data.album.cover_medium,
    });
  }
  return tracklist;
};

const getPlaylistInfo = async (playlistLink) => {
  const playlistId = getPlaylistID(playlistLink);

  const url = `https://api.deezer.com/playlist/${playlistId}`;
  let res = await axios.get(url);
  if (res.data.error) {
    return { isValid: false, playlist: {} };
  }

  const playlist = res.data;
  const playlistTracks = await getTracks(playlist.tracks.data);
  const playlistInfo = {
    name: playlist.title,
    description: playlist.description,
    duration: playlist.duration,
    numTracks: playlistTracks.length,
    playlistCover: playlist.picture_medium,
    tracks: playlistTracks,
  };

  return { isValid: true, playlist: playlistInfo };
};

const findSong = async (trackInfo) => {
  let trackId = '';
  const title = trackInfo.title.split(' ').join('+');
  const artist = trackInfo.artist.split(' ').join('+');
  const url = `https://api.deezer.com/search?q=${title}+${artist}`;

  const res = await axios.get(url);
  if (res.data.total === 0) {
    return '';
  }
  const searchResults = await getTracks(res.data.data);
  for (let i = 0; i < res.data.total; i++) {
    const track = searchResults[i];
    if (!track) {
      continue;
    }
    let score = 0;

    // Check that the title and artist are the same as the ones provided
    if (track.title === trackInfo.title && track.artist === trackInfo.artist) {
      score += 2;
    }

    // Check if album is the same as provided
    if (track.album === trackInfo.album) {
      score++;
    }

    // Check if track contributors is the same
    if (setEq(new Set(track.contributors), new Set(trackInfo.contributors))) {
      score++;
    }

    // Check if the duration of the songs match
    if (track.duration === trackInfo.duration) {
      score++;
    }

    // Check track score
    if (score >= 4) {
      trackId = res.data.data[i].id;
      break;
    }
  }

  return trackId;
};

const createPlaylist = async (tracklist, playlistInfo) => {
  const trackIds = [];
  const missingTracks = [];

  for (let track of tracklist) {
    const trackId = await findSong(track);
    if (trackId) {
      trackIds.push(trackId);
    } else {
      missingTracks.push(track);
    }
  }

  // Create playlist
  const name = playlistInfo.name.split(' ').join('+');
  const description = playlistInfo.description.split(' ').join('+');
  const playlistURL = `https://api.deezer.com/user/me/playlists/?access_token=${TOKEN}&title=${name}`;
  const res = await axios.post(playlistURL);
  const playlistId = res.data.id;

  // Add playlist description
  const descriptionURL = `https://api.deezer.com/playlist/${playlistId}/?access_token=${TOKEN}&description=${description}`;
  await axios.post(descriptionURL);

  // Add tracks to playlist
  const songs = trackIds.join(',');
  const tracksURL = `https://api.deezer.com/playlist/${playlistId}/tracks/?access_token=${TOKEN}&songs=${songs}`;
  await axios.post(tracksURL);

  // Get playlist share link
  const url = `https://api.deezer.com/playlist/${playlistId}/?access_token=${TOKEN}`;
  const resp = await axios.get(url);

  return {
    link: resp.data.share,
    missingTracks: missingTracks,
    numMissingTracks: missingTracks.length,
  };
};

const deletePlaylist = async (playlistLink) => {
  const playlistId = getPlaylistID(playlistLink);
  const url = `https://api.deezer.com/playlist/${playlistId}/?access_token=${TOKEN}`;
  await axios.delete(url);
  return true;
};

const validateBody = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('').required(),
    tracks: Joi.array()
      .items(
        Joi.object({
          title: Joi.string().required(),
          artist: Joi.string().required(),
          contributors: Joi.array().items(Joi.string()).min(1).required(),
          duration: Joi.number().required(),
          album: Joi.string().required(),
        }).unknown(true)
      )
      .min(1)
      .max(10)
      .required(),
  }).unknown(true);

  const res = schema.validate(data);
  if (res.error) {
    return {
      isValid: false,
      errors: res.error.details.map((err) => {
        return { field: err.path[0], message: err.message };
      }),
    };
  }
  return { isValid: true };
};

const data = {
  name: 'testing',
  description: '123',
  tracks: [
    {
      title: 'Over Again',
      artist: 'Charly Black',
      contributors: ['Charly Black', 'Ne-Yo'],
      duration: 203,
      album: 'Over Again',
      trackCover:
        'https://cdns-images.dzcdn.net/images/cover/ee44932807bf3a1042edf369e1e5b41f/250x250-000000-80-0-0.jpg',
    },
  ],
};

validateBody(data);

module.exports = {
  createPlaylist,
  deletePlaylist,
  getPlaylistInfo,
  validateBody,
};
