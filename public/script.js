document.getElementById('downloadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = document.getElementById('url').value;
  const format = document.getElementById('format').value;
  const loading = document.getElementById('loading');
  const success = document.getElementById('success');
  const error = document.getElementById('error');

  loading.classList.remove('hidden');
  success.classList.add('hidden');
  error.classList.add('hidden');

  try {
    const response = await fetch('/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format })
    });

    if (!response.ok) throw new Error('Server error');

const blob = await response.blob();
const downloadUrl = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = downloadUrl;
// 🚫 Do NOT set a.download here — let the browser use the filename from the server
document.body.appendChild(a);
a.click();
a.remove();

    loading.classList.add('hidden');
    success.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
});
