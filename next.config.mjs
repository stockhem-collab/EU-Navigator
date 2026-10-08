/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The imported reference data is read from disk on the server
  // (lib/imported/server.ts); make sure the files ship with those routes.
  experimental: {
    outputFileTracingIncludes: {
      "/api/referensprojekt": ["./data/app/**", "./data/vaxelkurs.csv"],
      "/api/liknande-projekt": ["./data/app/**", "./data/vaxelkurs.csv"],
      "/api/belopp": ["./data/app/**", "./data/vaxelkurs.csv"],
      "/historik": ["./data/app/**", "./data/vaxelkurs.csv"],
    },
  },
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
