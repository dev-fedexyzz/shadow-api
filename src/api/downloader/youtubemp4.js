import { createApiKeyMiddleware } from "../../middleware/apikey.js";
import axios from "axios";
import crypto from "crypto";

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download",
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Postify/1.0.0",
  },
  crypto: {
    hexToBuffer: (hexString) => Buffer.from(hexString, "hex"),
    decrypt: async (enc) => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);

      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      let decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
      return JSON.parse(decrypted.toString());
    },
  },
  youtube: (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (let regex of patterns) {
      if (regex.test(url)) return url.match(regex)[1];
    }
    return null;
  },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith("http") ? "" : savetube.api.base}${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: savetube.headers,
      });
      return { status: true, code: 200, data: response };
    } catch (error) {
      return { status: false, code: error.response?.status || 500, error: error.message };
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) return response;
    return { status: true, code: 200, data: response.data.cdn };
  },
  downloadVideo: async (link) => {
    if (!link) return { status: false, code: 400, error: "Falta el enlace de YouTube." };
    const id = savetube.youtube(link);
    if (!id) return { status: false, code: 400, error: "No se pudo extraer el ID del video." };

    try {
      const cdnRes = await savetube.getCDN();
      if (!cdnRes.status) return cdnRes;
      const cdn = cdnRes.data;

      const infoRes = await savetube.request(`https://${cdn}${savetube.api.info}`, { url: `https://www.youtube.com/watch?v=${id}` });
      if (!infoRes.status) return infoRes;

      const decrypted = await savetube.crypto.decrypt(infoRes.data.data);

      const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
        id: id,
        downloadType: "video",
        quality: "480",
        key: decrypted.key,
      });

      const data = {
        title: decrypted.title || "Desconocido",
        duration: decrypted.duration ? `${Math.floor(decrypted.duration / 60)}:${String(decrypted.duration % 60).padStart(2, "0")}` : "Desconocido",
        youtube_url: `https://youtube.com/watch?v=${id}`,
        download_url: dl.data?.data?.downloadUrl || null,
        thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
      };

      return { status: true, code: 200, data };
    } catch (error) {
      return { status: false, code: 500, error: error.message };
    }
  },
};

export default (app) => {
  app.get("/download/ytmp4V2", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || url.trim() === "") return res.status(400).json({ status: false, error: "URL is required" });

      const result = await savetube.downloadVideo(url.trim());
      if (!result.status) return res.status(result.code || 500).json({ status: false, error: result.error });

      res.status(200).json({
        status: true,
        status_code: 200,
        creator: "Shadow`S Api'S",
        result: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          api: "Shadow`S Api'S",
          version: "v2",
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};
