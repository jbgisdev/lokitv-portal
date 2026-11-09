import { Channel } from '../types';
import { formatCategory } from '../services/channels.service';

/**
 * Escapa caracteres reservados para asegurar que el XML sea 100% válido y seguro.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera el título para cada canal en la playlist VLC (.xspf) según las reglas de Loki TV:
 * - Formato base: "Categoría - Nombre del canal"
 * - Lógica dinámica para http://cvcplayertv: si la URL comienza con dicho host, extrae el último
 *   segmento tras el slash final y lo anexa al título.
 *   Ejemplo: http://cvcplayertv.xyz:8080/ewrwer/erewre/43419 -> "Categoría - Nombre del canal - 43419"
 */
export function formatChannelPlaylistTitle(channel: {
  name: string;
  category?: string | null;
  stream_url?: string | null;
}): string {
  const cat = formatCategory(channel.category?.trim() || 'General');
  const name = channel.name.trim();
  const url = (channel.stream_url || '').trim();

  let title = `${cat} - ${name}`;

  if (
    url.toLowerCase().startsWith('http://cvcplayertv') ||
    url.toLowerCase().startsWith('https://cvcplayertv')
  ) {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment) {
      title = `${title} - ${lastSegment}`;
    }
  }

  return title;
}

/**
 * Genera el archivo .xspf (XML Shareable Playlist Format) para VLC y dispara la descarga en el navegador.
 * Ordena alfabéticamente por título.
 */
export function exportToVLCPlaylist(
  channels: Channel[],
  playlistTitle: string = 'Loki TV Playlist',
  filename: string = 'lokitv_canales.xspf'
): void {
  if (!channels || channels.length === 0) return;

  // 1. Filtrar canales con stream_url y generar títulos
  const items = channels
    .filter((c) => !!c.stream_url && !!c.stream_url.trim())
    .map((c) => ({
      title: formatChannelPlaylistTitle(c),
      location: c.stream_url.trim(),
    }));

  // 2. Ordenar alfabéticamente por título
  items.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));

  // 3. Construir estructura XML .xspf compatible con VLC
  const xmlTracks = items
    .map(
      (item, index) => `    <track>
      <location>${escapeXml(item.location)}</location>
      <title>${escapeXml(item.title)}</title>
      <extension application="http://www.videolan.org/vlc/playlist/ns/0/">
        <vlc:id>${index}</vlc:id>
      </extension>
    </track>`
    )
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<playlist xmlns="http://xspf.org/ns/0/" xmlns:vlc="http://www.videolan.org/vlc/playlist/ns/0/" version="1">
  <title>${escapeXml(playlistTitle)}</title>
  <trackList>
${xmlTracks}
  </trackList>
</playlist>`;

  // 4. Descargar archivo en el cliente
  const blob = new Blob([xmlContent], { type: 'application/xspf+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

