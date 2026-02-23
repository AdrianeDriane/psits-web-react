import React from "react";
import { Link } from "react-router-dom";
import { Construction, Home, ExternalLink } from "lucide-react";
import { BackgroundText } from "@/components/common/BackgroundText";

export const UnderConstruction: React.FC = () => {
  return (
    <div className="bg-background text-foreground animate-in fade-in relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center font-sans duration-500 select-none">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-primary-100/20 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="relative mb-8">
        <div className="animate-in zoom-in inline-block rounded-full bg-orange-50 p-6 shadow-sm ring-8 ring-orange-50/50 duration-300">
          <Construction className="h-16 w-16 text-orange-500" />
        </div>
        <BackgroundText
          text="WIP"
          parentStyle="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full text-center scale-150"
          childStyle="text-transparent bg-clip-text bg-gradient-to-br from-primary/20 to-primary/5"
        />
      </div>

      <div className="z-10 max-w-lg space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">
          Under Construction
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          This page is currently under development. However, this functionality
          is available in the legacy website.
        </p>

        <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
          <Link
            to="/admin"
            className="btn btn-primary hover:shadow-primary/25 gap-2 shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
          <a
            href="https://psits.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline hover:bg-primary/5 border-primary text-primary gap-2 transition-all duration-300 hover:-translate-y-1"
          >
            <ExternalLink className="h-5 w-5" />
            Legacy Website
          </a>
        </div>
        <BackgroundText
          text="404"
          parentStyle="absolute -top-16 sm:-top-24 md:-top-32 lg:-top-44 xl:-top-56 left-1/2 -translate-x-1/2 w-full text-center -z-10"
          childStyle="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/80"
        />
        <BackgroundText
          text="PSITS"
          parentStyle="absolute -bottom-16 sm:-bottom-24 md:-bottom-32 lg:-bottom-44 xl:-bottom-56 left-1/2 -translate-x-1/2 w-full text-center -z-10"
          childStyle="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/80"
        />
      </div>
    </div>
  );
};

export default UnderConstruction;
