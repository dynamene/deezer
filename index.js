const {
  createPlaylist,
  deletePlaylist,
  getPlaylistInfo,
  validateBody,
} = require('./utils');

exports.deezer = async (req, res) => {
  if (req.method === 'GET') {
    // Get playlist information
    const response = await getPlaylistInfo(req.query.link);
    return res.status(200).json(response);
  }

  if (req.method === 'POST') {
    // Create a playlist
    const result = validateBody(req.body);
    if (!result.isValid) {
      return res.status(400).json({ errors: result.errors });
    }

    const tracks = req.body.tracks;
    const playlistInfo = {
      name: req.body.name,
      description: req.body.description,
    };
    const response = await createPlaylist(tracks, playlistInfo);
    return res.status(201).json(response);
  }

  if (req.method === 'DELETE') {
    // Delete playlist
    await deletePlaylist(req.query.link);
    return res.status(200).json({ message: 'Done' });
  }

  return res.status(400).json({ message: 'Invalid method' });
};
