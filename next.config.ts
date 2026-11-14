import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los callbacks OAuth contienen códigos transitorios en la URL.
  logging: { incomingRequests: { ignore: [/\/api\/auth\/callback\//] } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
