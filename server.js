const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

  const args = format === 'mp4'
    ? ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '--merge-output-format', 'mp4', '-o', filePath, url]
    : ['-f', 'bestaudio', '--extract-audio', '--audio-format', format, '-o', filePath, url];

  // Use system yt-dlp binary (installed in Docker container)
  const ytdlp = spawn('yt-dlp', args);

  ytdlp.stderr.on('data', (data) => {
    console.error(`[yt-dlp ERROR]: ${data}`);
  });

  ytdlp.on('close', (code) => {
    if (code !== 0 || !fs.existsSync(filePath)) {
      return res.status(500).send('Failed to download file.');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : format === 'wav' ? 'audio/wav' : 'video/mp4');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync(filePath); // Clean up temp file
    });
  });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
