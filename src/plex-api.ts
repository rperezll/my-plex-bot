// Legacy code for interacting with Plex API (actually not working, but kept for reference)

type PlexSearchResult = {
  success: boolean;
  content?: {
    title: string;
    year: string;
    rating: string;
    poster?: Buffer;
  }[];
};

type PlexServerStatus = {
  success: boolean;
  log?: string;
};

type PlexActiveUser = {
  success: boolean;
  users?: any[];
  log?: string;
};

export const getPlexServerStatus = async (): Promise<PlexServerStatus> => {
  try {
    const response = await fetch(process.env.PLEX_URL!, {
      headers: {
        'X-Plex-Token': process.env.PLEX_TOKEN!,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        log: `Plex está conectado, pero no se pudo obtener el estado.`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      log: `Plex está activo: ${data.MediaContainer.friendlyName || 'Desconocido'}`,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      log: `No se pudo conectar con Plex, debe estar apagado.`,
    };
  }
};

export const getPlexSearch = async (
  query: string
): Promise<PlexSearchResult> => {
  try {
    const response = await fetch(
      `${process.env.PLEX_URL!}/hubs/search?limit=10&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Plex-Token': process.env.PLEX_TOKEN!,
          Accept: 'application/json',
        },
      }
    );

    const text = await response.text();
    const data = JSON.parse(text);

    const peliculasHub = data.MediaContainer.Hub.find(
      (hub: any) => hub.title === 'Movies'
    );
    if (!peliculasHub || !peliculasHub.Metadata) {
      return {
        success: false,
      };
    }

    const results = [];

    for (const peli of peliculasHub.Metadata) {
      const posterUrl = `${process.env.PLEX_URL}${peli.thumb}?X-Plex-Token=${process.env.PLEX_TOKEN}`;

      const imageResponse = await fetch(posterUrl);
      if (!imageResponse.ok) {
        console.error(`No se pudo descargar la imagen: ${posterUrl}`);
        continue;
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      results.push({
        title: peli.title,
        year: peli.year,
        rating: peli.rating || '(Sin calificación)',
        poster: imageBuffer,
      });
    }

    if (results.length === 0) {
      return { success: false };
    }

    return {
      success: true,
      content: results,
    };
  } catch (error) {
    console.error('Error al buscar en Plex:', error);
    return {
      success: false,
    };
  }
};

export const getPlexActiveUsers = async (): Promise<PlexActiveUser> => {
  try {
    const response = await fetch(`${process.env.PLEX_URL!}/status/sessions`, {
      headers: {
        'X-Plex-Token': process.env.PLEX_TOKEN!,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        log: `Error al obtener sesiones activas: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    const sessions = data.MediaContainer.Metadata;

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        users: [],
        log: '👻 No hay usuarios conectados actualmente.',
      };
    }

    const users = sessions.map((session: any) => ({
      user: session.User.title,
      title: session.title,
      type: session.type,
      platform: session.Player.platform,
      state: session.Player.state,
    }));

    return {
      success: true,
      users,
      log: `${users.length} usuario(s) conectado(s)`,
    };
  } catch (error) {
    console.error('Error al obtener sesiones activas:', error);
    return {
      success: false,
      log: '❌ No se pudieron obtener las sesiones activas.',
    };
  }
};
