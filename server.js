const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdlp = require('yt-dlp-exec');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/download', async (req, res) => {
  const { url, format } = req.body;

  const supportedFormats = ['mp3', 'mp4', 'wav'];
  if (!url || !format || !supportedFormats.includes(format)) {
    return res.status(400).json({ error: 'Unsupported or missing format/URL.' });
  }

  const filename = `download.${format}`;
  const filePath = path.join(__dirname, `temp.${format}`);

  try {
    await ytdlp(url, {
      output: filePath,
      extractAudio: format !== 'mp4',
      audioFormat: format,
      mergeOutputFormat: format === 'mp4' ? 'mp4' : undefined,
      format: format === 'mp4' ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4' : 'bestaudio',
    });

    if (!fs.existsSync(filePath)) {
      return res.status(500).send('Download failed. File not found.');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : format === 'wav' ? 'audio/wav' : 'video/mp4');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlinkSync(filePath); // Clean up temp file
    });

  } catch (error) {
    console.error('[yt-dlp ERROR]', error);
    res.status(500).send('An error occurred while downloading.');
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

