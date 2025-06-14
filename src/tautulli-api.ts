import { getEnvs } from './env-config';
import { Logger } from './logger';

interface PlexSearchResult {
  success: boolean;
  log?: string;
  content?: {
    title: string;
    year: string;
    rating: string;
    type: string;
    poster: Buffer | null;
  }[];
}

interface PlexServerStatus {
  success: boolean;
  log?: string;
}

interface PlexUser {
  username: string;
  content?: string;
  player?: string;
  product?: string;
}

interface ConnectedUsers {
  success: boolean;
  log?: string;
  users?: PlexUser[];
}

export const getPlexServerStatus = async (): Promise<PlexServerStatus> => {
  const url = `${getEnvs().TAUTULLI_URL!}/api/v2?apikey=${getEnvs().TAUTULLI_TOKEN!}&cmd=server_status`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      Logger.error(
        `getPlexServerStatus(): Plex está conectado, pero no se pudo obtener el estado: ${response.statusText}`
      );
      return {
        success: false,
        log: 'Plex está conectado, pero no se pudo obtener el estado.',
      };
    }

    const { response: res } = await response.json();
    Logger.info(`getPlexServerStatus(): ${JSON.stringify(res)}`);

    const connected = res?.data?.connected;

    const logResult = connected
      ? 'El servidor de Plex está encendido.'
      : 'El servidor de Plex está apagado.';

    Logger.info(`getPlexServerStatus(): ${logResult}`);
    return {
      success: connected === true,
      log: logResult,
    };
  } catch (error) {
    Logger.error(
      `getPlexServerStatus(): No se pudo conectar con Plex, debe estar apagado: ${error}`
    );
    return {
      success: false,
      log: 'No se pudo conectar con Plex, debe estar apagado.',
    };
  }
};

export const getPlexSearch = async (
  search: string
): Promise<PlexSearchResult> => {
  const status = await getPlexServerStatus();

  if (!status.success) {
    return {
      success: false,
      log: status.log,
    };
  }

  const baseUrl = getEnvs().TAUTULLI_URL! + '/api/v2';
  const token = getEnvs().TAUTULLI_TOKEN!;

  try {
    // 1. Obtener todas las secciones
    const libsUrl = `${baseUrl}?apikey=${token}&cmd=get_libraries`;
    const response = await fetch(libsUrl);

    if (!response.ok) {
      Logger.error(
        `getPlexSearch(): No se pudieron obtener las bibliotecas de Plex: ${response.statusText}`
      );
      return {
        success: false,
        log: `No se pudieron obtener las bibliotecas de Plex`,
      };
    }

    const libsJson = await response.json();
    const sectionIds: number[] =
      libsJson.response?.data?.map((lib: any) => lib.section_id) || [];

    if (!sectionIds.length) {
      Logger.error(`getPlexSearch(): No se encontraron secciones en Plex`);
      return {
        success: false,
        log: 'No se encontraron bibliotecas en Tautulli.',
      };
    }

    // 2. Buscar en cada sección
    const searchResults = await Promise.all(
      sectionIds.map(async (sectionId) => {
        const query = new URLSearchParams({
          apikey: token,
          cmd: 'get_library_media_info',
          section_id: sectionId.toString(),
          search,
          length: '10',
        });

        const url = `${baseUrl}?${query.toString()}`;
        const response = await fetch(url);

        if (!response.ok) return [];

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return [];

        const json = await response.json();
        const data = json.response?.data.data;

        if (!Array.isArray(data) || data.length === 0) return [];

        return await Promise.all(
          data.map(async (item: any) => {
            let posterBuffer = null;
            if (item.thumb) {
              const assetUrl = `${baseUrl}?apikey=${token}&cmd=pms_image_proxy&img=${item.thumb}&width=300&height=450`;

              const assetResponse = await fetch(assetUrl);
              if (assetResponse.ok) {
                const arrayBuffer = await assetResponse.arrayBuffer();
                posterBuffer = Buffer.from(arrayBuffer);
              } else {
                Logger.warn(
                  `No se ha podido descargar el poster del contenido.`
                );
              }
            }

            return {
              title: item.title,
              year: item.year || 'N/A',
              rating: item.rating || 'N/A',
              type: item.section_type || 'N/A',
              poster: posterBuffer,
            };
          })
        );
      })
    );

    // 3. Combinar resultados
    const content = searchResults.flat();

    if (!content.length) {
      Logger.info(
        `getPlexSearch(): No se encontraron resultados para "${search}": ${searchResults}`
      );
      return {
        success: false,
        log: `No se encontraron resultados para "${search}".`,
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error) {
    Logger.info(
      `getPlexSearch(): Error inesperado consultado el contenido en Plex: ${(error as Error).message}`
    );
    return {
      success: false,
      log: 'Error inesperado consultado el contenido en Plex',
    };
  }
};

export const getPlexActiveUsers = async (): Promise<ConnectedUsers> => {
  const status = await getPlexServerStatus();

  if (!status.success) {
    return {
      success: false,
      log: status.log,
    };
  }

  const url = `${getEnvs().TAUTULLI_URL!}/api/v2?apikey=${getEnvs().TAUTULLI_TOKEN!}&cmd=get_activity`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      Logger.info(
        `getPlexActiveUsers(): Plex está conectado, pero no se pudo obtener el estado: ${response.statusText}`
      );
      return {
        success: false,
        log: `Error al obtener sesiones activas`,
      };
    }

    const { response: res } = await response.json();
    Logger.info(`getPlexActiveUsers(): ${JSON.stringify(res)}`);

    const sessions = res?.data?.sessions || [];

    // Obtener usuarios únicos por nombre de usuario
    const uniqueUsersMap = new Map<string, PlexUser>();

    sessions.forEach((session: any) => {
      const { user, player, product, full_title } = session;
      if (!uniqueUsersMap.has(user)) {
        uniqueUsersMap.set(user, {
          username: user,
          content: full_title,
          player,
          product,
        });
      }
    });

    Logger.info(`getPlexActiveUsers(): ${Array.from(uniqueUsersMap.values())}`);
    return {
      success: true,
      users: Array.from(uniqueUsersMap.values()),
    };
  } catch (error) {
    Logger.error(
      `getPlexActiveUsers(): Error al obtener usuarios conectados: ${error}`
    );
    return {
      success: false,
      log: `Error al obtener usuarios conectados`,
    };
  }
};
