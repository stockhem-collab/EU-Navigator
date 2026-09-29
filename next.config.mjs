/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Old addresses from before the Projekt / Ansöka / Rapportera structure,
  // kept working for bookmarks and shared links. Query strings carry over.
  async redirects() {
    return [
      { source: "/demo", destination: "/ansokan", permanent: false },
      { source: "/projektbank", destination: "/projekt", permanent: false },
      { source: "/projektbank/:id", destination: "/projekt/:id", permanent: false },
      // Grant ids ("beviljat stöd") start with "ap-"; project ids never do.
      { source: "/projekt/:id(ap-.*)", destination: "/stod/:id", permanent: false },
      { source: "/bevakning", destination: "/ansok", permanent: false },
    ];
  },
};

export default nextConfig;
