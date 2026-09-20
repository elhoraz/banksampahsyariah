import type { NextConfig } from "next";
import os from "os";

function getLocalIpOrigins(): string[] {
  const origins = [
    "localhost",
    "127.0.0.1",
    "localhost:3000",
    "127.0.0.1:3000",
    // Vercel deployment domains
    "*.vercel.app",
    "**.vercel.app",
    // Ngrok free and standard tunnels
    "*.ngrok-free.dev",
    "**.ngrok-free.dev",
    "*.ngrok-free.app",
    "**.ngrok-free.app",
    "*.ngrok.app",
    "**.ngrok.app",
    "*.ngrok.io",
    "**.ngrok.io",
    "*.loca.lt",
    "**.loca.lt",
    // Known active tunnel
    "departure-wistful-clang.ngrok-free.dev",
  ];

  if (process.env.VERCEL_URL) {
    origins.push(process.env.VERCEL_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.push(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          origins.push(net.address);
          origins.push(`${net.address}:3000`);
        }
      }
    }
  } catch {
    // Fallback default local IPs
    origins.push("192.168.18.69", "192.168.18.69:3000");
  }

  return origins;
}

const localOrigins = getLocalIpOrigins();

const nextConfig: NextConfig = {
  // Allow mobile browsers, local network IP addresses, and ngrok tunnels
  allowedDevOrigins: localOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: localOrigins,
    },
  },
};

export default nextConfig;

