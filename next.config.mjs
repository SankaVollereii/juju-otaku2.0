/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Poster datang dari banyak CDN sumber (Otakudesu/Kuramanime/AnimeKompi/dll)
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }],
  },
};
export default nextConfig;
