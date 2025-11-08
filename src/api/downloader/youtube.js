import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

// Renombramos la función para reflejar su propósito: obtener la última publicación de la comunidad.
async function getLatestYoutubeCommunityPost(url) {
  try {
    const { data: response } = await axios.get(url, {
      headers: {
        // Establecer un User-Agent es a menudo útil para evitar ser bloqueado
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(response)

    // Intenta extraer ytInitialData de manera más segura
    const scriptContent = $("script")
      .toArray()
      .map((script) => $(script).html())
      .find((html) => html && html.includes("ytInitialData"))

    if (!scriptContent) {
      throw new Error("Could not find ytInitialData script.")
    }

    const ytInitialDataMatch = scriptContent.match(/ytInitialData = ({.*?});/s)
    if (!ytInitialDataMatch || !ytInitialDataMatch[1]) {
      throw new Error("Could not parse ytInitialData content.")
    }

    const ytInitialData = JSON.parse(ytInitialDataMatch[1])

    // --- Lógica de Extracción de la Publicación (Esta es la parte más frágil) ---
    // Intentamos encontrar el contenido de la pestaña "Comunidad"
    const communityTabContent = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs
      ?.find((tab) => tab.tabRenderer?.title === "Comunidad") // Asume que el título puede estar en español o inglés, revisa si hay una manera más universal (como una propiedad de índice)
      ?.tabRenderer?.content

    if (!communityTabContent) {
      // Si falla la búsqueda por título, intenta la ruta original, que asume que es la primera pestaña (índice 0)
       try {
            const fallbackContent = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content;
            if (fallbackContent) {
                console.log("Using fallback: First tab content.");
            }
        } catch (e) {
            throw new Error("Community content structure not found in ytInitialData.");
        }
    }


    const sections =
      (communityTabContent?.sectionListRenderer?.contents || [])

    const posts = sections
      .flatMap((section) => section.itemSectionRenderer?.contents || [])
      .map((item) => {
        const postRenderer =
          item.backstagePostThreadRenderer?.post?.backstagePostRenderer
        if (!postRenderer) return null

        // Extracción de imágenes
        const images =
          postRenderer.backstageAttachment?.postMultiImageRenderer?.images || []
        const imageUrls = images.map((imageObj) => {
          const thumbnails = imageObj.backstageImageRenderer.image.thumbnails
          // Devuelve la última (generalmente la de mayor resolución)
          return thumbnails[thumbnails.length - 1].url
        })

        // Extracción de contenido de texto
        const content =
          postRenderer.contentText?.runs?.map((run) => run.text).join("") ||
          ""

        return {
          postId: postRenderer.postId,
          author: postRenderer.authorText?.simpleText || "Desconocido",
          content: content,
          images: imageUrls,
          publishedTime:
            postRenderer.publishedTimeText?.simpleText || "No disponible",
        }
      })
      .filter(Boolean)

    // Devolvemos la primera publicación encontrada (la más reciente)
    return posts[0] || null
  } catch (error) {
    console.error("Youtube Community scrape error:", error.message)
    // Cambiamos el mensaje para no revelar la causa técnica al usuario final
    throw new Error("Failed to process YouTube community data.")
  }
}

export default (app) => {
  // Renombramos el endpoint para reflejar su función real (scraper de comunidad)
  const endpointPath = "/youtube/community/post"

  // Función unificada para manejar GET y POST
  const handleCommunityPostRequest = async (req, res) => {
    try {
      // Obtener URL de query (GET) o body (POST)
      const url = req.query.url || req.body.url

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "El parámetro 'url' (URL del canal de YouTube) es obligatorio.",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "La URL debe ser una cadena de texto válida.",
        })
      }

      const result = await getLatestYoutubeCommunityPost(url.trim())

      if (!result) {
        return res.status(404).json({
          status: false,
          error: "No se pudo encontrar ninguna publicación de la comunidad en la URL proporcionada.",
        })
      }

      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(error); // Loguear el error interno
      res.status(500).json({
        status: false,
        error: error.message || "Error interno del servidor al procesar la solicitud.",
      })
    }
  }

  app.get(endpointPath, createApiKeyMiddleware(), handleCommunityPostRequest)
  app.post(endpointPath, createApiKeyMiddleware(), handleCommunityPostRequest)
      }
